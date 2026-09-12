import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { isAutosaveSuppressed, subscribeDraft } from '../data/draft'
import { flushDraft, scheduleAutosave } from '../data/draftSync'
import { hydrateDraft } from '../data/jobDraft'

/** Layout route around Steps 1–4. Before the first step renders, the draft persisted on
 *  this device is restored (a reload mid-job resumes in place). While any step is mounted,
 *  every change to the draft store is queued for sync a moment after typing stops;
 *  unmounting (leaving the steps by any route) queues what is still pending. */
export function DraftSync() {
  const [ready, setReady] = useState(false)

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

  return ready ? <Outlet /> : null
}
