import type { NavigateFunction } from 'react-router-dom'
import { flushDraft } from '../data/draftSync'

/** Leaving the steps: write what is pending first, so the Jobs list already shows the
 *  draft when it renders. Steps 2–4 exit straight away; Step 1 asks first (03e). */
export const exitDraft = async (navigate: NavigateFunction) => {
  await flushDraft()
  navigate('/jobs')
}
