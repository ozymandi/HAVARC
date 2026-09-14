import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAutosaveSuppressed, subscribeDraft } from '../data/draft'
import { flushDraft, scheduleAutosave } from '../data/draftSync'
import { hasStep1Required, hydrateDraft } from '../data/jobDraft'

/** Layout route around Steps 1–4. Before the first step renders, the draft persisted on
 *  this device is restored (a reload mid-job resumes in place). While any step is mounted,
 *  every change to the draft store is queued for sync a moment after typing stops;
 *  unmounting (leaving the steps by any route) queues what is still pending. */
export function DraftSync() {
  const [ready, setReady] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    let active = true
    void hydrateDraft().finally(() => active && setReady(true))
    const unsubscribe = subscribeDraft(() => {
      if (!isAutosaveSuppressed()) scheduleAutosave()
    })
    return () => {
      active = false
      unsubscribe()
      void flushDraft()
    }
  }, [])

  if (!ready) return null
  // Steps 2–4 need a job to belong to; without Step 1's required fields (e.g. Back after
  // Complete emptied the draft) the only sensible place is the Jobs list.
  if (pathname !== '/jobs/new' && !hasStep1Required()) return <Navigate to="/jobs" replace />
  return <Outlet />
}
