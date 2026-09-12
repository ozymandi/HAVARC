/** Minimal IndexedDB access: two key/value stores, promise-wrapped. `kv` holds the live
 *  draft, cached reads and small flags; `outbox` holds one pending write per job. Every
 *  call degrades to "nothing stored" when IndexedDB is unavailable (private mode, a
 *  browser that evicted storage) — the app must keep working, only without persistence. */
const DB_NAME = 'havarc'
const DB_VERSION = 1
const STORES = ['kv', 'outbox'] as const
export type Store = (typeof STORES)[number]

let dbPromise: Promise<IDBDatabase | null> | null = null

const open = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null)
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        for (const store of STORES) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

const run = async <T,>(store: Store, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> => {
  const db = await open()
  if (!db) return undefined
  return new Promise<T | undefined>((resolve) => {
    try {
      const tx = db.transaction(store, mode)
      const request = op(tx.objectStore(store))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(undefined)
    } catch {
      resolve(undefined)
    }
  })
}

export const idbGet = <T,>(store: Store, key: string) => run<T>(store, 'readonly', (s) => s.get(key) as IDBRequest<T>)
export const idbPut = (store: Store, key: string, value: unknown) => run(store, 'readwrite', (s) => s.put(value, key))
export const idbDelete = (store: Store, key: string) => run(store, 'readwrite', (s) => s.delete(key))
export const idbGetAll = <T,>(store: Store) => run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)
