import type { JobStatus } from '../components/JobCard'
import type { StatusColor } from '../components/StatusBanner'
import { useAsync } from '../hooks/useAsync'
import { supabase } from '../lib/supabase'
import { readCache, withCache } from './cache'
import type { InvoiceData } from './invoice'
import type { JobDraft } from './jobDraft'
import { getEntry, getOutbox, loadOutbox } from './outbox'
import { statusOption } from './status'

export type JobStatusValue = JobStatus

/** What the screens render. Shaped for the components (Job Card, Job Detail, Share sheet,
 *  PDF preview) rather than for the tables — `meta`, `completedMeta`, `summary` and
 *  `documents` are presentation strings built once from the rows below. Detail-only
 *  fields are optional because the list query doesn't fetch them, and because drafts
 *  simply don't have them yet. */
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
  /** The stored invoice (editor + PDF preview); absent until one is saved. */
  invoice?: InvoiceData
}

// ---------------------------------------------------------------- rows (subset of the schema)
interface JobRow {
  id: string
  work_order: string
  customer_name: string
  address: string
  job_date: string
  status: JobStatus
}

interface ReadingsEmbed {
  return_air: string | null
  supply_air: string | null
  temp_split: string | null
  suction_psig: string | null
  head_psig: string | null
  superheat: string | null
  subcooling: string | null
}

interface FindingsEmbed {
  findings: string[]
  repairs: string[]
  recommendations: string[]
}

interface InvoiceEmbed {
  number: string | null
  tax_rate: number
  discount: number
  description: string | null
  items: { id: string; position: number; description: string; qty: number; unit_price: number; customer_paid: boolean }[]
}

interface JobDetailRow extends JobRow {
  technician: string
  service_type: string | null
  complaints: string[]
  customer_notes: string | null
  final_status: StatusColor | null
  completed_at: string | null
  customer: { phone: string | null } | null
  equipment: { position: number; equipment_id: string | null; manufacturer: string | null; model: string | null; serial: string | null }[]
  readings: OneOrMany<ReadingsEmbed>
  findings: OneOrMany<FindingsEmbed>
  invoice: OneOrMany<InvoiceEmbed>
  documents: { kind: 'report' | 'invoice'; status: 'pending' | 'ready' | 'error'; size_bytes: number | null; updated_at: string }[]
  photos: { position: number; storage_path: string }[]
}

/** PostgREST returns a one-to-one embed (FK on a primary key) as an object; be tolerant. */
type OneOrMany<T> = T | T[] | null
const one = <T,>(value: OneOrMany<T>): T | null => (Array.isArray(value) ? (value[0] ?? null) : value)

const LIST_COLUMNS = 'id, work_order, customer_name, address, job_date, status'
const DETAIL_COLUMNS = `${LIST_COLUMNS}, technician, service_type, complaints, customer_notes, final_status, completed_at,
  customer:customers(phone),
  equipment(position, equipment_id, manufacturer, model, serial),
  readings(return_air, supply_air, temp_split, suction_psig, head_psig, superheat, subcooling),
  findings:job_findings(findings, repairs, recommendations),
  invoice:invoices(number, tax_rate, discount, description, items:invoice_items(id, position, description, qty, unit_price, customer_paid)),
  documents(kind, status, size_bytes, updated_at),
  photos(position, storage_path)`

// ---------------------------------------------------------------- formatting
const localIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** "2026-09-02" → "09/02/26" without going through Date (a bare date has no time zone). */
const shortDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-')
  return `${m}/${d}/${y.slice(2)}`
}
const shortDateTime = (iso: string) => {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}
const money = (n: number) => `$${n.toFixed(2)}`
const join = (parts: (string | null | undefined)[], sep: string) =>
  parts.filter((p): p is string => !!p && p.trim() !== '').join(sep)

const toListJob = (row: JobRow, today: string): Job => ({
  id: row.id,
  workOrder: row.work_order,
  customer: row.customer_name,
  address: row.address,
  meta: `${row.address} · ${shortDate(row.job_date)}`,
  status: row.status,
  group: row.job_date === today ? 'today' : 'earlier',
})

const buildSummary = (row: JobDetailRow): { label: string; value: string }[] => {
  const rows: { label: string; value: string }[] = []
  const service = join([row.service_type, ...row.complaints], ' · ')
  if (service) rows.push({ label: 'Service', value: service })

  const units = [...row.equipment]
    .sort((a, b) => a.position - b.position)
    .map((u) => join([u.equipment_id, join([u.manufacturer, u.model], ' '), u.serial ? `S/N ${u.serial}` : null], ' · '))
    .filter(Boolean)
  if (units.length) rows.push({ label: 'Equipment', value: units.join('; ') })

  const r = one(row.readings)
  if (r) {
    const temps =
      r.return_air || r.supply_air
        ? join([`${r.return_air ?? '—'}/${r.supply_air ?? '—'} °F`, r.temp_split ? `split ${r.temp_split}` : null], ' ')
        : null
    const pressures = r.suction_psig || r.head_psig ? `${r.suction_psig ?? '—'}/${r.head_psig ?? '—'} PSIG` : null
    const sh = join([r.superheat ? `SH ${r.superheat}` : null, r.subcooling ? `SC ${r.subcooling}` : null], ' / ')
    const readings = join([temps, pressures, sh], ' · ')
    if (readings) rows.push({ label: 'Readings', value: readings })
  }

  const f = one(row.findings)
  if (f?.findings.length) rows.push({ label: 'Findings', value: f.findings.join(', ') })
  if (f?.repairs.length) rows.push({ label: 'Repairs', value: f.repairs.join(', ') })
  if (f?.recommendations.length) rows.push({ label: 'Recommend', value: f.recommendations.join(', ') })
  return rows
}

/** Same arithmetic as the invoice editor's totals. */
const invoiceTotal = (invoice: InvoiceEmbed) => {
  const subtotal = invoice.items.reduce((sum, i) => sum + (i.customer_paid ? 0 : i.qty * i.unit_price), 0)
  const tax = subtotal * (invoice.tax_rate / 100)
  return Math.max(0, subtotal + tax - invoice.discount)
}

const buildDocuments = (row: JobDetailRow): { title: string; meta: string }[] => {
  const invoice = one(row.invoice)
  return row.documents
    .filter((d) => d.status === 'ready')
    .sort((a) => (a.kind === 'report' ? -1 : 1))
    .map((d) => ({
      title:
        d.kind === 'report'
          ? 'Service Report PDF'
          : join([`Invoice${invoice?.number ? ` #${invoice.number}` : ''}`, invoice ? money(invoiceTotal(invoice)) : null], ' · '),
      meta: join([`Generated ${shortDate(d.updated_at.slice(0, 10))}`, d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : null], ' · '),
    }))
}

const signedPhotoUrls = async (photos: JobDetailRow['photos']): Promise<string[]> => {
  if (photos.length === 0) return []
  const paths = [...photos].sort((a, b) => a.position - b.position).map((p) => p.storage_path)
  const { data, error } = await supabase.storage.from('photos').createSignedUrls(paths, 60 * 60)
  if (error) throw error
  return data.map((d) => d.signedUrl).filter((u): u is string => !!u)
}

const toDetailJob = async (row: JobDetailRow, today: string): Promise<Job> => {
  const job = toListJob(row, today)
  const invoice = one(row.invoice)
  const summary = row.status === 'draft' ? [] : buildSummary(row)
  const documents = buildDocuments(row)
  const photos = await signedPhotoUrls(row.photos)
  return {
    ...job,
    customerNotes: row.customer_notes ?? undefined,
    finalStatus: row.final_status ? statusOption(row.final_status) : undefined,
    completedMeta: row.completed_at ? `Completed ${shortDateTime(row.completed_at)} · ${row.technician}` : undefined,
    summary: summary.length ? summary : undefined,
    documents: documents.length ? documents : undefined,
    photos: photos.length ? photos : undefined,
    phone: row.customer?.phone ?? undefined,
    invoiceNumber: invoice?.number ?? undefined,
    invoice: invoice
      ? {
          items: [...invoice.items]
            .sort((a, b) => a.position - b.position)
            .map((i) => ({ id: i.id, description: i.description, qty: i.qty, unitPrice: i.unit_price, customerPaid: i.customer_paid })),
          taxRate: invoice.tax_rate,
          discount: invoice.discount,
          description: invoice.description ?? '',
        }
      : undefined,
  }
}

/** A job that exists only in the outbox so far (created offline), shaped for the list
 *  and the lighter Job Detail. Completed offline it already shows its final status. */
const jobFromDraft = (d: JobDraft, today: string): Job => {
  const m = d.date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  const isoDate = m ? `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : today
  return {
    id: d.jobId,
    workOrder: d.workOrder || 'WO-…',
    customer: d.customer,
    address: d.address,
    meta: `${d.address} · ${shortDate(isoDate)}`,
    status: 'pending',
    group: isoDate === today ? 'today' : 'earlier',
    customerNotes: d.customerNotes || undefined,
    finalStatus: d.finalStatus ? statusOption(d.finalStatus) : undefined,
    phone: undefined,
    invoice: d.invoice,
  }
}

// ---------------------------------------------------------------- queries
/** Server list (or the cached copy when offline), with the outbox laid over it: queued
 *  jobs show as Pending sync, jobs created offline appear at the top. */
export async function fetchJobs(): Promise<Job[]> {
  const today = localIsoDate(new Date())
  const [list] = await Promise.all([
    withCache('jobs', async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(LIST_COLUMNS)
        .order('job_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as JobRow[]).map((row) => toListJob(row, today))
    }),
    loadOutbox(),
  ])
  const queued = getOutbox()
  const known = new Set(list.map((j) => j.id))
  const pending = new Set(queued.map((e) => e.jobId))
  const offlineOnly = queued.filter((e) => !known.has(e.jobId)).map((e) => jobFromDraft(e.draft, today))
  return [...offlineOnly.reverse(), ...list.map((j) => (pending.has(j.id) ? { ...j, status: 'pending' as const } : j))]
}

export async function fetchJob(id: string): Promise<Job | null> {
  const today = localIsoDate(new Date())
  const [job] = await Promise.all([
    withCache<Job | null>(`job:${id}`, async () => {
      const { data, error } = await supabase.from('jobs').select(DETAIL_COLUMNS).eq('id', id).maybeSingle()
      if (error) throw error
      if (!data) return null
      return toDetailJob(data as unknown as JobDetailRow, today)
    }),
    loadOutbox(),
  ])
  const entry = getEntry(id)
  if (!entry) return job
  return job ? { ...job, status: 'pending' } : jobFromDraft(entry.draft, today)
}

/** Removes the row (cascades to equipment, readings, findings, invoice, documents, photos)
 *  and the job's files in every bucket, so nothing is left behind on any device. */
export async function deleteJob(id: string): Promise<void> {
  for (const bucket of ['photos', 'signatures', 'documents']) {
    const { data: files, error } = await supabase.storage.from(bucket).list(id)
    if (error) throw error
    if (files.length) {
      const { error: removeError } = await supabase.storage.from(bucket).remove(files.map((f) => `${id}/${f.name}`))
      if (removeError) throw removeError
    }
  }
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) throw error
}

/** Replaces the job's invoice row and line items with the editor's contents. Line-item
 *  ids from the editor are kept when they are uuids (rows loaded from the DB) and minted
 *  otherwise (the editor's `new-…` ids). The invoice number is left alone — step 5 assigns it. */
export async function saveInvoice(jobId: string, invoice: InvoiceData): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .upsert({ job_id: jobId, tax_rate: invoice.taxRate, discount: invoice.discount, description: invoice.description || null })
  if (error) throw error
  const { error: delError } = await supabase.from('invoice_items').delete().eq('job_id', jobId)
  if (delError) throw delError
  if (invoice.items.length === 0) return
  const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  const { error: insError } = await supabase.from('invoice_items').insert(
    invoice.items.map((i, index) => ({
      id: isUuid(i.id) ? i.id : crypto.randomUUID(),
      job_id: jobId,
      position: index + 1,
      description: i.description,
      qty: i.qty,
      unit_price: i.unitPrice,
      customer_paid: i.customerPaid,
    })),
  )
  if (insError) throw insError
}

/** "WO-10031" → "WO-10032". Work orders are short strings on a two-user table, so reading
 *  them all and taking the numeric max is simpler than a Postgres sequence for now. */
export async function fetchNextWorkOrder(): Promise<string> {
  const numbers = await withCache('workOrders', async () => {
    const { data, error } = await supabase.from('jobs').select('work_order')
    if (error) throw error
    return (data as { work_order: string }[]).map((r) => Number(r.work_order.replace(/\D/g, '')) || 0)
  }).catch(async () => ((await readCache<Job[]>('jobs')) ?? []).map((j) => Number(j.workOrder.replace(/\D/g, '')) || 0))
  await loadOutbox()
  const queued = getOutbox().map((e) => Number(e.draft.workOrder.replace(/\D/g, '')) || 0)
  return `WO-${Math.max(10000, ...numbers, ...queued) + 1}`
}

// ---------------------------------------------------------------- hooks
export const useJobs = () => useAsync(fetchJobs, 'jobs')
export const useJob = (id: string | undefined) =>
  useAsync(() => (id ? fetchJob(id) : Promise.resolve(null)), `job:${id ?? ''}`)
