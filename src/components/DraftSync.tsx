import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { subscribeDraft } from '../data/draft'
import { flushDraft, scheduleAutosave } from '../data/draftSync'

/** Layout route around Steps 1–4: while any step is mounted, every change to the draft
 *  store is written to Supabase a moment after typing stops. Unmounting (leaving the
 *  steps by any route) flushes what is still pending. */
export function DraftSync() {
  useEffect(() => {
    const unsubscribe = subscribeDraft(scheduleAutosave)
    return () => {
      unsubscribe()
      void flushDraft()
    }
  }, [])
  return <Outlet />
}
