import { useAsync } from '../hooks/useAsync'
import { supabase } from '../lib/supabase'

export interface Customer {
  id: string
  name: string
  address: string
  phone: string | null
  /** Access codes etc. — auto-filled into the work order's Customer notes (client decision). */
  notes: string | null
  previousJobs: number
  hasNotes: boolean
}

interface CustomerRow {
  id: string
  name: string
  address: string
  phone: string | null
  notes: string | null
  jobs: { count: number }[]
}

/** Customers with their job count, for the Step 1 suggestions list. */
export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('id, name, address, phone, notes, jobs(count)').order('name')
  if (error) throw error
  return (data as unknown as CustomerRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    notes: c.notes,
    previousJobs: c.jobs[0]?.count ?? 0,
    hasNotes: !!c.notes?.trim(),
  }))
}

export const useCustomers = () => useAsync(fetchCustomers, 'customers')
