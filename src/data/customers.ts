import { MOCK_JOBS } from './mockJobs'

export interface Customer {
  name: string
  address: string
  previousJobs: number
  hasNotes: boolean
}

/** Derived from MOCK_JOBS rather than a separate hand-authored list — a customer's real
 *  "previous jobs" count and notes-on-file flag should always match what's actually in the
 *  job history, and deriving it avoids the two ever drifting out of sync. */
const buildCustomers = (): Customer[] => {
  const byName = new Map<string, Customer>()
  for (const job of MOCK_JOBS) {
    const existing = byName.get(job.customer)
    if (existing) {
      existing.previousJobs += 1
      existing.hasNotes = existing.hasNotes || !!job.customerNotes
    } else {
      byName.set(job.customer, { name: job.customer, address: job.address, previousJobs: 1, hasNotes: !!job.customerNotes })
    }
  }
  return [...byName.values()]
}

export const CUSTOMERS: Customer[] = buildCustomers()
