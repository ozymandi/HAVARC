import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  reload: () => void
}

/** Runs `load` on mount and whenever `key` changes; ignores results from a superseded
 *  run. Small on purpose — the offline queue (backend step 4) is where caching, retries
 *  and sync state will live, not here. */
export function useAsync<T>(load: () => Promise<T>, key: string): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    load().then(
      (result) => {
        if (!active) return
        setData(result)
        setLoading(false)
      },
      (err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
    // `load` is a plain module function chosen by `key`; re-run only when the key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, loading, error, reload }
}
