import { hasContent, readJobDraft } from './jobDraft'
import { enqueueJob } from './outbox'

const AUTOSAVE_DELAY_MS = 1500

let timer: ReturnType<typeof setTimeout> | undefined

/** Every write of the draft goes through the outbox (one entry per job, latest snapshot
 *  wins); the sync engine writes it to Supabase as soon as the network allows. */
const queueDraft = async (complete = false) => {
  const draft = readJobDraft()
  if (!hasContent(draft)) return
  await enqueueJob(draft, complete)
}

/** Called on every draft change: (re)starts the autosave timer. */
export const scheduleAutosave = () => {
  clearTimeout(timer)
  timer = setTimeout(() => void queueDraft(), AUTOSAVE_DELAY_MS)
}

/** Queues any pending change now. Used before leaving the steps, so the Jobs list already
 *  shows the draft (as Pending sync until it is written). */
export const flushDraft = async (): Promise<void> => {
  clearTimeout(timer)
  await queueDraft()
}

/** Complete on Step 4: queues the job as completed and returns its id. Resolves as soon as
 *  the entry is stored on the device — offline, the job shows Pending sync until it syncs. */
export const completeDraft = async (): Promise<string> => {
  clearTimeout(timer)
  const draft = readJobDraft()
  const entry = await enqueueJob(draft, true)
  return entry.jobId
}
