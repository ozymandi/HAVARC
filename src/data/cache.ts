import { idbDelete, idbGet, idbPut } from './idb'

/** Read-through cache for the screens' queries: a successful load is stored, a failed
 *  one (offline, server down) falls back to the last stored copy. The server stays the
 *  source of truth — the copy is only ever shown when the server cannot be asked. */
export async function withCache<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const value = await load()
    void idbPut('kv', `cache:${key}`, value)
    return value
  } catch (err) {
    const cached = await idbGet<T>('kv', `cache:${key}`)
    if (cached !== undefined) return cached
    throw err
  }
}

export const readCache = <T,>(key: string) => idbGet<T>('kv', `cache:${key}`)
export const invalidateCache = (key: string) => idbDelete('kv', `cache:${key}`)
