import { useEffect, useState } from 'react'

/** navigator.onLine, kept live via the online/offline window events. Real connectivity,
 *  not a placeholder — Sync Banner's "Offline" state (18:161) is only ever shown when
 *  this is false. "Syncing"/"Error" states belong to the offline queue (Phase 1 backend
 *  work, not built yet) and aren't wired to anything real yet. */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const set = () => setOnline(navigator.onLine)
    window.addEventListener('online', set)
    window.addEventListener('offline', set)
    return () => {
      window.removeEventListener('online', set)
      window.removeEventListener('offline', set)
    }
  }, [])

  return online
}
