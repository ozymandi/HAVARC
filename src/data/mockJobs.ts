import type { JobStatus } from '../components/JobCard'
import type { StatusColor } from '../components/StatusBanner'

/** Placeholder rows standing in for Supabase until the backend lands. `group` on the list
 *  shape is hardcoded rather than computed from a real date, because these sample dates
 *  never actually match "today" — once jobs load from the API, group by comparing each
 *  job's date to `new Date()` instead. Detail fields (`finalStatus`, `summary`, `documents`)
 *  only exist once a job has gone through Step 4 · Complete Service Call, so most sample
 *  jobs leave them out — Job Detail falls back to a lighter "not completed yet" view. */
export interface Job {
  id: string
  workOrder: string
  customer: string
  address: string
  meta: string
  status: JobStatus
  group: 'today' | 'earlier'
  customerNotes?: string
  finalStatus?: { color: StatusColor; label: string; description: string }
  completedMeta?: string
  summary?: { label: string; value: string }[]
  documents?: { title: string; meta: string }[]
  photos?: string[]
  phone?: string
  invoiceNumber?: string
}

export const MOCK_JOBS: Job[] = [
  {
    id: 'wo-10031',
    workOrder: 'WO-10031',
    customer: 'Brenda Johnson',
    address: '1997 Ashley Pl, Riverdale GA',
    meta: '1997 Ashley Pl, Riverdale GA · 09/02/26',
    status: 'draft',
    group: 'today',
    customerNotes: 'Gate code 4471#. Key box by the side door. Dog in the backyard — call before entering.',
  },
  {
    id: 'wo-10030',
    workOrder: 'WO-10030',
    customer: 'Trillium Urban Remedy',
    address: '202 Spring Cir, Stockbridge GA',
    meta: '202 Spring Cir, Stockbridge GA · 09/02/26',
    status: 'pending',
    group: 'today',
  },
  {
    id: 'wo-10029',
    workOrder: 'WO-10029',
    customer: 'Piedmont Dental Group',
    address: '450 Mt Zion Rd, Jonesboro GA 30236',
    meta: '450 Mt Zion Rd, Jonesboro GA · 08/29/26',
    status: 'completed',
    group: 'earlier',
    completedMeta: 'Completed 08/29/26 · 2:40 PM · T. Holloway',
    finalStatus: { color: 'green', label: 'Green', description: 'Operating Normally' },
    summary: [
      { label: 'Service', value: 'Preventive Maintenance' },
      { label: 'Equipment', value: 'RTU-2 · Carrier 48TC · S/N 2419C44521' },
      { label: 'Readings', value: '76/57 °F split 19 · 118/330 PSIG · SH 12 / SC 9' },
      { label: 'Findings', value: 'No Defects Found' },
      { label: 'Repairs', value: 'Coil Cleaning, Filter Changed' },
      { label: 'Recommend', value: 'No Further Action' },
    ],
    documents: [
      { title: 'Service Report PDF', meta: 'Generated 08/29/26 · 412 KB' },
      { title: 'Invoice #646 · $189.00', meta: 'Generated 08/29/26 · 236 KB' },
    ],
    phone: '770-994-8768',
    invoiceNumber: '646',
    photos: [
      '/photo/photo-1513694203232-719a280e022f.avif',
      '/photo/photo-1583847268964-b28dc8f51f92.avif',
      '/photo/photo-1598928506311-c55ded91a20c.avif',
    ],
  },
  {
    id: 'wo-10028',
    workOrder: 'WO-10028',
    customer: 'Marcus Reed',
    address: '88 Lakeview Dr, McDonough GA',
    meta: '88 Lakeview Dr, McDonough GA · 08/27/26',
    status: 'completed',
    group: 'earlier',
    completedMeta: 'Completed 08/27/26 · 11:05 AM · T. Holloway',
    finalStatus: { color: 'yellow', label: 'Yellow', description: 'Needs Attention Soon' },
    documents: [{ title: 'Service Report PDF', meta: 'Generated 08/27/26 · 388 KB' }],
  },
  {
    id: 'wo-10027',
    workOrder: 'WO-10027',
    customer: 'Sunrise Daycare',
    address: '15 Eagles Landing Pkwy, Stockbridge GA',
    meta: '15 Eagles Landing Pkwy, Stockbridge GA · 08/26/26',
    status: 'completed',
    group: 'earlier',
    completedMeta: 'Completed 08/26/26 · 3:20 PM · T. Holloway',
    finalStatus: { color: 'green', label: 'Green', description: 'Operating Normally' },
  },
]

/** Mutates the shared array in place — the only "delete" mechanism available without a
 *  backend. Real deletion (removing the server record, its PDFs, photos) is Phase-1
 *  backend work; this just makes the Jobs list stop showing it for this session. */
export const removeJob = (id: string) => {
  const index = MOCK_JOBS.findIndex((j) => j.id === id)
  if (index !== -1) MOCK_JOBS.splice(index, 1)
}
