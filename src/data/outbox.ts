import { idbDelete, idbGetAll, idbPut } from './idb'
import type { JobDraft } from './jobDraft'

/** One pending write per job. Writing a job is idempotent (upsert + full replace of its
 *  child rows), so several edits of the same job collapse into the latest snapshot; the
 *  `complete` flag is sticky so an autosave queued after Complete cannot un-complete it.
 *  `baseUpdatedAt` is the server's `updated_at` the edit started from — the sync engine
 *  compares it with the server before writing to detect edits from the other device. */
export interface OutboxEntry {
  jobId: string
  draft: JobDraft
  complete: boolean
  baseUpdatedAt: string | null
  enqueuedAt: string
  conflict: boolean
}

const entries = new Map<string, OutboxEntry>()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

let loaded: Promise<void> | null = null
/** Reads the persisted queue once per app start. */
export const loadOutbox = (): Promise<void> => {
  loaded ??= idbGetAll<OutboxEntry>('outbox').then(async (list) => {
    for (const entry of list ?? []) {
      if (!entry.jobId) await idbDelete('outbox', '') // a snapshot without an id can never be written
      else entries.set(entry.jobId, entry)
    }
    notify()
  })
  return loaded
}

export const subscribeOutbox = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getOutbox = (): OutboxEntry[] => [...entries.values()].sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt))
export const getEntry = (jobId: string) => entries.get(jobId)

export async function enqueueJob(draft: JobDraft, complete: boolean): Promise<OutboxEntry> {
  if (!draft.jobId) throw new Error('Cannot queue a draft without a job id')
  await loadOutbox()
  const previous = entries.get(draft.jobId)
  const entry: OutboxEntry = {
    jobId: draft.jobId,
    draft,
    complete: complete || !!previous?.complete,
    baseUpdatedAt: previous ? previous.baseUpdatedAt : draft.updatedAt,
    enqueuedAt: new Date().toISOString(),
    conflict: previous?.conflict ?? false,
  }
  entries.set(entry.jobId, entry)
  await idbPut('outbox', entry.jobId, entry)
  notify()
  return entry
}

export async function updateEntry(jobId: string, patch: Partial<OutboxEntry>): Promise<void> {
  const current = entries.get(jobId)
  if (!current) return
  const next = { ...current, ...patch }
  entries.set(jobId, next)
  await idbPut('outbox', jobId, next)
  notify()
}

export async function removeEntry(jobId: string): Promise<void> {
  if (!entries.delete(jobId)) return
  await idbDelete('outbox', jobId)
  notify()
}
