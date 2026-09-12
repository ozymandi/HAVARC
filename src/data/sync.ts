import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'
import { invalidateCache } from './cache'
import { requestPdfs } from './documents'
import { clearDraft, readDraft, setDraftValue, withoutAutosave } from './draft'
import { idbGet, idbPut } from './idb'
import { saveJobDraft, type DraftPhoto, type SavedJob } from './jobDraft'
import { fetchNextWorkOrder } from './jobs'
import { getEntry, getOutbox, loadOutbox, removeEntry, subscribeOutbox, updateEntry, type OutboxEntry } from './outbox'

/* ------------------------------------------------------------------ state */
export interface SyncState {
  status: 'idle' | 'syncing' | 'error'
  /** Jobs waiting in the outbox (including ones stopped by a conflict). */
  pending: number
  lastSyncAt: string | null
  /** The first job whose sync is stopped by an edit from another device (dialog 02g). */
  conflict: OutboxEntry | null
}

let state: SyncState = { status: 'idle', pending: 0, lastSyncAt: null, conflict: null }
const listeners = new Set<() => void>()
const setState = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const useSyncState = () => useSyncExternalStore(subscribe, () => state, () => state)

const refreshFromOutbox = () => {
  const entries = getOutbox()
  setState({ pending: entries.length, conflict: entries.find((e) => e.conflict) ?? null })
}

/* ------------------------------------------------------------------ engine */
let running = false
let runAgain = false
const online = () => navigator.onLine

/** Drains the outbox in order: one job per write, oldest first. Stops at the first
 *  failure (order matters for a job queued twice) and reports it as an error only while
 *  online — offline is not an error, the queue simply waits for the network. */
export async function runSync(): Promise<void> {
  if (running) {
    runAgain = true
    return
  }
  running = true
  try {
    await loadOutbox()
    const queue = getOutbox().filter((e) => !e.conflict)
    if (queue.length === 0 || !online()) {
      setState({ status: 'idle' })
      return
    }
    setState({ status: 'syncing' })
    for (const entry of queue) {
      if (entry.baseUpdatedAt && (await editedElsewhere(entry))) {
        await updateEntry(entry.jobId, { conflict: true })
        continue
      }
      const saved = await saveWithFreshWorkOrder(entry)
      const latest = getEntry(entry.jobId)
      if (latest && latest.enqueuedAt !== entry.enqueuedAt) {
        // A newer snapshot of the same job was queued meanwhile; the server's updated_at
        // is now ours, so that snapshot must not be flagged as a conflict.
        await updateEntry(entry.jobId, { baseUpdatedAt: saved.updatedAt })
      } else {
        await removeEntry(entry.jobId)
      }
      applyToLiveDraft(saved)
      await invalidateCache(`job:${entry.jobId}`)
      // A completed job (just completed, or edited after completion) gets fresh PDFs.
      if (saved.draft.status === 'completed') void requestPdfs(saved.jobId)
    }
    const at = new Date().toISOString()
    void idbPut('kv', 'lastSyncAt', at)
    setState({ status: 'idle', lastSyncAt: at })
  } catch {
    setState({ status: online() ? 'error' : 'idle' })
  } finally {
    running = false
    if (runAgain) {
      runAgain = false
      void runSync()
    }
  }
}

/** Work-order numbers are picked on the device (max + 1), so two technicians starting a
 *  job at the same time — or one starting offline with a stale list — can pick the same
 *  one. On the unique-key violation the job takes the next free number and is written
 *  again; the on-screen draft (if it is this job) shows the new number. */
const saveWithFreshWorkOrder = async (entry: OutboxEntry): Promise<SavedJob> => {
  try {
    return await saveJobDraft(entry.draft, entry.complete)
  } catch (err) {
    const violation = typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505'
    if (!violation || !String((err as { message?: string }).message).includes('work_order')) throw err
    const workOrder = await fetchNextWorkOrder()
    const draft = { ...entry.draft, workOrder }
    await updateEntry(entry.jobId, { draft })
    if (readDraft<string>('job.id', '') === entry.jobId) withoutAutosave(() => setDraftValue('step1.workOrder', workOrder))
    return saveJobDraft(draft, entry.complete)
  }
}

const editedElsewhere = async (entry: OutboxEntry): Promise<boolean> => {
  const { data, error } = await supabase.from('jobs').select('updated_at').eq('id', entry.jobId).maybeSingle()
  if (error) throw error
  return !!data && new Date(data.updated_at).getTime() > new Date(entry.baseUpdatedAt as string).getTime()
}

/** After a job is written, the draft being edited on screen (if it is that job) learns the
 *  new Storage paths, status and updated_at — without triggering another autosave. */
const applyToLiveDraft = (saved: SavedJob) => {
  if (readDraft<string>('job.id', '') !== saved.jobId) return
  withoutAutosave(() => {
    const live = readDraft<DraftPhoto[]>('step4.photos', [])
    const paths = new Map(saved.draft.photos.map((p) => [p.id, p.path]))
    setDraftValue(
      'step4.photos',
      live.map((p) => (p.path || !paths.get(p.id) ? p : { ...p, path: paths.get(p.id) ?? null, blob: undefined })),
    )
    setDraftValue('job.customerSignaturePath', saved.draft.customerSignaturePath)
    setDraftValue('job.techSignaturePath', saved.draft.techSignaturePath)
    setDraftValue('job.status', saved.draft.status)
    setDraftValue('job.completedAt', saved.draft.completedAt)
    setDraftValue('job.updatedAt', saved.updatedAt)
  })
}

/** Dialog 02g. "mine" writes our snapshot over the other device's version; "theirs" drops
 *  our queued write and, if that job is open in the steps, the on-screen draft too. */
export async function resolveConflict(jobId: string, keep: 'mine' | 'theirs'): Promise<void> {
  if (keep === 'mine') {
    await updateEntry(jobId, { conflict: false, baseUpdatedAt: null })
    void runSync()
  } else {
    await removeEntry(jobId)
    await invalidateCache(`job:${jobId}`)
    if (readDraft<string>('job.id', '') === jobId) clearDraft()
  }
}

/* ------------------------------------------------------------------ lifecycle */
let stop: (() => void) | null = null

/** Called once a session exists (writes need RLS access). Syncs now, on regaining the
 *  network, when the app comes back to the foreground, and after every new queue entry. */
export function startSyncEngine(): void {
  if (stop) return
  const onVisible = () => {
    if (document.visibilityState === 'visible') void runSync()
  }
  window.addEventListener('online', runSync)
  document.addEventListener('visibilitychange', onVisible)
  const unsubscribeOutbox = subscribeOutbox(() => {
    refreshFromOutbox()
    void runSync()
  })
  stop = () => {
    window.removeEventListener('online', runSync)
    document.removeEventListener('visibilitychange', onVisible)
    unsubscribeOutbox()
    stop = null
  }
  void idbGet<string>('kv', 'lastSyncAt').then((at) => at && setState({ lastSyncAt: at }))
  void loadOutbox().then(() => {
    refreshFromOutbox()
    void runSync()
  })
}

export function stopSyncEngine(): void {
  stop?.()
}

/** "2 min ago" for the Settings footer. */
export const relativeTime = (iso: string | null, now = Date.now()): string => {
  if (!iso) return 'never'
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
}
