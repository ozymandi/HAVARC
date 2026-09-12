import { hasContent, readJobDraft, saveJobDraft } from './jobDraft'

const AUTOSAVE_DELAY_MS = 1500

/* One serial queue for every write of the draft, so an autosave that is already in
 * flight can never land after — and overwrite — a Complete. */
let queue: Promise<unknown> = Promise.resolve()
const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}

let timer: ReturnType<typeof setTimeout> | undefined

const runAutosave = () =>
  enqueue(async () => {
    const draft = readJobDraft()
    if (!hasContent(draft)) return
    try {
      await saveJobDraft(draft)
    } catch {
      // the next change retries; Complete reports failures loudly
    }
  })

/** Called on every draft change: (re)starts the autosave timer. */
export const scheduleAutosave = () => {
  clearTimeout(timer)
  timer = setTimeout(() => void runAutosave(), AUTOSAVE_DELAY_MS)
}

/** Writes any pending change now and waits for the queue to drain. Used before leaving
 *  the steps (so the Jobs list already shows the draft). */
export const flushDraft = async (): Promise<void> => {
  clearTimeout(timer)
  await runAutosave()
}

/** Complete on Step 4: goes through the same queue as autosave; rejects on failure. */
export const completeDraft = (): Promise<string> =>
  enqueue(() => {
    clearTimeout(timer)
    return saveJobDraft(readJobDraft(), true)
  })
