import { useCallback, useSyncExternalStore } from 'react'
import { idbGet, idbPut } from './idb'

/** In-memory draft of the job being created in Steps 1–4. Each step used to keep purely
 *  local `useState`, so nothing survived navigating between steps and Step 4's Final Review
 *  had to show static text. `useDraftState` is a drop-in for `useState` whose value lives in
 *  this module-level store instead of the component, so it survives unmount/remount for as
 *  long as the app is open (the "Keep draft & exit" dialog copy has been promising exactly
 *  that). Persisting it across reloads (localStorage/IndexedDB) and syncing it to Supabase
 *  is the Phase-1 drafts/autosave work — this is the seam it plugs into. */
const values = new Map<string, unknown>()
const listeners = new Set<() => void>()

const PERSIST_DELAY_MS = 300
let persistTimer: ReturnType<typeof setTimeout> | undefined
/** True once anything in this session has written the store; the persisted copy from a
 *  previous session is only restored while this is still false. */
let touched = false
/** Mirrors the whole map into IndexedDB shortly after it changes, so a reload (or iOS
 *  killing the PWA) resumes exactly where the technician was. Blobs clone into IDB as-is.
 *  Whole-draft replacements (clear, load) are written at once, not debounced. */
const persist = (immediate = false) => {
  touched = true
  clearTimeout(persistTimer)
  const write = () => void idbPut('kv', 'draft', Object.fromEntries(values))
  if (immediate) write()
  else persistTimer = setTimeout(write, PERSIST_DELAY_MS)
}

const notify = (immediate = false) => {
  persist(immediate)
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

type Init<T> = T | (() => T)
const resolve = <T,>(init: Init<T>): T => (typeof init === 'function' ? (init as () => T)() : init)

export function useDraftState<T>(key: string, initial: Init<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const read = () => {
    if (!values.has(key)) values.set(key, resolve(initial))
    return values.get(key) as T
  }
  const value = useSyncExternalStore(subscribe, read, read)
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = values.get(key) as T
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      if (Object.is(prev, resolved)) return
      values.set(key, resolved)
      notify()
    },
    [key],
  )
  return [value, set]
}

/** One-off read without subscribing — for screens that only display another step's data. */
export const readDraft = <T,>(key: string, fallback: T): T => (values.has(key) ? (values.get(key) as T) : fallback)

/** Called once the job is completed (Step 4 → Job saved) so the next "New job" starts clean. */
export const clearDraft = () => {
  values.clear()
  notify(true)
}

/** Write one key outside React (uploads finishing, ids being assigned). */
export const setDraftValue = (key: string, value: unknown) => {
  values.set(key, value)
  notify()
}

/** Replace the whole draft at once — used when an existing job is opened for editing. */
export const loadDraft = (entries: Record<string, unknown>) => {
  values.clear()
  for (const [key, value] of Object.entries(entries)) values.set(key, value)
  notify(true)
}

/** Fires after every change; the autosave loop (DraftSync) hangs off this. */
export const subscribeDraft = subscribe

/* The sync engine writes server-side results (Storage paths, updated_at) back into the
 * live draft. Those writes must not count as edits, or they would queue another sync. */
let suppressed = false
export const withoutAutosave = (fn: () => void) => {
  suppressed = true
  try {
    fn()
  } finally {
    suppressed = false
  }
}
export const isAutosaveSuppressed = () => suppressed

/** The persisted map, if any — read once at start by `hydrateDraft` (jobDraft.ts). */
export const readPersistedDraft = () => idbGet<Record<string, unknown>>('kv', 'draft')

/** Restores persisted entries without re-persisting; skipped once this session has
 *  written the store itself (a "New job" or "Edit job" that happened before the steps mounted). */
export const restoreDraft = (entries: Record<string, unknown>) => {
  if (touched || values.size > 0) return
  for (const [key, value] of Object.entries(entries)) values.set(key, value)
  listeners.forEach((listener) => listener())
}
