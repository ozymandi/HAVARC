import type { Equipment } from '../components/EquipmentCard'
import type { StatusColor } from '../components/StatusBanner'
import { supabase } from '../lib/supabase'
import { loadDraft, readDraft, readPersistedDraft, restoreDraft, setDraftValue } from './draft'
import { EMPTY_INVOICE, type InvoiceData } from './invoice'
import { saveInvoice, type JobStatusValue } from './jobs'

/* ------------------------------------------------------------------ draft shapes
 * The four steps keep their fields in the in-memory draft store under `step1.*` …
 * `step4.*` keys. This module is the only place that knows how those keys map onto
 * the Postgres tables, in both directions (autosave / Complete write them, Edit job
 * loads them back). */

export interface Readings {
  returnAir: string
  supplyAir: string
  tempSplit: string
  returnStatic: string
  supplyStatic: string
  totalStatic: string
  incomingV: string
  compressorA: string
  condFanA: string
  blowerA: string
  capRatedMfd: string
  capActualMfd: string
  suctionPsig: string
  headPsig: string
  outdoorF: string
  superheat: string
  subcooling: string
  refrigerantAdded: string
}

export const EMPTY_READINGS: Readings = {
  returnAir: '',
  supplyAir: '',
  tempSplit: '',
  returnStatic: '',
  supplyStatic: '',
  totalStatic: '',
  incomingV: '',
  compressorA: '',
  condFanA: '',
  blowerA: '',
  capRatedMfd: '',
  capActualMfd: '',
  suctionPsig: '',
  headPsig: '',
  outdoorF: '',
  superheat: '',
  subcooling: '',
  refrigerantAdded: '',
}

export type CheckState = 'good' | 'issue' | null

export interface Conditions {
  filter: CheckState
  drain: CheckState
  ductwork: CheckState
  heating: CheckState
}

export const EMPTY_CONDITIONS: Conditions = { filter: null, drain: null, ductwork: null, heating: null }

/** A photo on Step 4. `path` is its Storage key once uploaded; `blob` is kept only while
 *  the upload has not succeeded yet, so Complete can retry it. `url` is what the tile shows. */
export interface DraftPhoto {
  id: string
  path: string | null
  url: string
  blob?: Blob
}

export interface JobDraft {
  jobId: string
  status: JobStatusValue
  completedAt: string | null
  /** Server `updated_at` this edit started from (Edit job); null for a job born here. */
  updatedAt: string | null
  workOrder: string
  date: string
  technician: string
  unitSuite: string
  customer: string
  address: string
  arrival: string
  departure: string
  customerNotes: string
  serviceType: string
  complaints: string[]
  complaintDetails: string
  equipment: Equipment[]
  readingsOpen: boolean
  readings: Readings
  conditions: Conditions
  findings: string[]
  repairs: string[]
  recommendations: string[]
  serviceNotes: string
  parts: string
  recommendedWork: string
  finalStatus: StatusColor | null
  photos: DraftPhoto[]
  customerName: string
  customerSignature: string | null
  techSignature: string | null
  customerSignaturePath: string | null
  techSignaturePath: string | null
  invoice: InvoiceData
}

/** The job's id is minted on the client the first time it's needed, so Storage paths and
 *  the row share one id before anything has been written. */
export const ensureJobId = (): string => {
  const existing = readDraft<string>('job.id', '')
  if (existing) return existing
  const id = crypto.randomUUID()
  setDraftValue('job.id', id)
  return id
}

export const readJobDraft = (): JobDraft => ({
  jobId: readDraft('job.id', ''),
  status: readDraft<JobStatusValue>('job.status', 'draft'),
  completedAt: readDraft<string | null>('job.completedAt', null),
  updatedAt: readDraft<string | null>('job.updatedAt', null),
  workOrder: readDraft('step1.workOrder', ''),
  date: readDraft('step1.date', ''),
  technician: readDraft('step1.technician', ''),
  unitSuite: readDraft('step1.unitSuite', ''),
  customer: readDraft('step1.customer', ''),
  address: readDraft('step1.address', ''),
  arrival: readDraft('step1.arrival', ''),
  departure: readDraft('step1.departure', ''),
  customerNotes: readDraft('step1.customerNotes', ''),
  serviceType: readDraft('step1.serviceType', ''),
  complaints: readDraft<string[]>('step1.complaints', []),
  complaintDetails: readDraft('step1.complaintDetails', ''),
  equipment: readDraft<Equipment[]>('step1.equipment', []),
  readingsOpen: readDraft('step2.readingsOpen', false),
  readings: readDraft<Readings>('step2.readings', EMPTY_READINGS),
  conditions: readDraft<Conditions>('step2.conditions', EMPTY_CONDITIONS),
  findings: readDraft<string[]>('step3.findings', []),
  repairs: readDraft<string[]>('step3.repairs', []),
  recommendations: readDraft<string[]>('step3.recommendations', []),
  serviceNotes: readDraft('step3.serviceNotes', ''),
  parts: readDraft('step3.parts', ''),
  recommendedWork: readDraft('step3.recommendedWork', ''),
  finalStatus: readDraft<StatusColor | null>('step4.status', null),
  photos: readDraft<DraftPhoto[]>('step4.photos', []),
  customerName: readDraft('step4.customerName', ''),
  customerSignature: readDraft<string | null>('step4.customerSignature', null),
  techSignature: readDraft<string | null>('step4.techSignature', null),
  customerSignaturePath: readDraft<string | null>('job.customerSignaturePath', null),
  techSignaturePath: readDraft<string | null>('job.techSignaturePath', null),
  invoice: readDraft<InvoiceData>('step4.invoice', EMPTY_INVOICE),
})

/** A draft is worth a row once it names a customer or carries a file; an untouched
 *  "New job" that is backed out of leaves nothing behind in the Jobs list. */
export const hasContent = (d: JobDraft) =>
  d.customer.trim() !== '' || d.photos.length > 0 || !!d.customerSignaturePath || !!d.techSignaturePath || d.status !== 'draft'

/* ------------------------------------------------------------------ formatting helpers */
const nullable = (s: string | null | undefined) => (s && s.trim() !== '' ? s.trim() : null)

const localIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Step 1 types the date as MM/DD/YYYY (US); anything unparsable falls back to today. */
const parseUsDate = (value: string): string => {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return localIsoDate(new Date())
  const year = m[3].length === 2 ? `20${m[3]}` : m[3]
  return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
}
const formatUsDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

const furthestStep = (d: JobDraft): number => {
  if (d.finalStatus || d.photos.length || d.customerSignature || d.techSignature || d.customerName) return 4
  if (d.findings.length || d.repairs.length || d.recommendations.length || d.serviceNotes || d.parts || d.recommendedWork) return 3
  if (d.readingsOpen || Object.values(d.conditions).some(Boolean)) return 2
  return 1
}

/* ------------------------------------------------------------------ customers */
async function resolveCustomer(d: JobDraft): Promise<string | null> {
  const name = d.customer.trim()
  if (!name) return null
  const { data: found, error } = await supabase.from('customers').select('id').ilike('name', name).maybeSingle()
  if (error) throw error
  if (found) {
    // "Saved to this customer · auto-fills on every work order" — notes follow the customer.
    const { error: updateError } = await supabase.from('customers').update({ notes: nullable(d.customerNotes) }).eq('id', found.id)
    if (updateError) throw updateError
    return found.id as string
  }
  const { data: created, error: insertError } = await supabase
    .from('customers')
    .insert({ name, address: d.address.trim(), notes: nullable(d.customerNotes) })
    .select('id')
    .single()
  if (insertError) throw insertError
  return created.id as string
}

/* ------------------------------------------------------------------ files */
const MAX_PHOTO_SIDE = 1600
const PHOTO_QUALITY = 0.8

/** Re-encodes a camera photo as a JPEG no larger than 1600px on its long side — a phone
 *  photo of several MB becomes a few hundred KB before it goes anywhere near the network. */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('JPEG encode failed'))), 'image/jpeg', PHOTO_QUALITY))
}

async function uploadPhotoBlob(jobId: string, id: string, blob: Blob): Promise<string> {
  const path = `${jobId}/${id}.jpg`
  const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return path
}

/** Compresses and uploads a Step 4 photo. If the upload fails (offline), the photo still
 *  joins the draft with its blob so Complete can retry; the caller sees no error. */
export async function addDraftPhoto(file: File): Promise<DraftPhoto> {
  const jobId = ensureJobId()
  const id = crypto.randomUUID()
  const blob = await compressImage(file)
  const url = URL.createObjectURL(blob)
  try {
    const path = await uploadPhotoBlob(jobId, id, blob)
    return { id, path, url }
  } catch {
    return { id, path: null, url, blob }
  }
}

export async function removeDraftPhoto(photo: DraftPhoto): Promise<void> {
  if (photo.path) await supabase.storage.from('photos').remove([photo.path])
}

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob()

/** Uploads a signature PNG to `signatures/<job>/<who>.png` and records the path in the
 *  draft. Failures are swallowed here too — Complete retries any signature without a path. */
export async function storeSignature(who: 'customer' | 'technician', dataUrl: string): Promise<void> {
  const jobId = ensureJobId()
  const key = who === 'customer' ? 'job.customerSignaturePath' : 'job.techSignaturePath'
  setDraftValue(key, null)
  try {
    const path = await uploadSignatureData(jobId, who, dataUrl)
    setDraftValue(key, path)
  } catch {
    // retried on Complete
  }
}

async function uploadSignatureData(jobId: string, who: 'customer' | 'technician', dataUrl: string): Promise<string> {
  const path = `${jobId}/${who}.png`
  const { error } = await supabase.storage.from('signatures').upload(path, await dataUrlToBlob(dataUrl), { contentType: 'image/png', upsert: true })
  if (error) throw error
  return path
}

/** Uploads whatever is still local (photos without a path, signatures without a path).
 *  Throws on the first failure so Complete can report it. Returns the completed draft. */
async function uploadPending(d: JobDraft): Promise<JobDraft> {
  const photos: DraftPhoto[] = []
  for (const photo of d.photos) {
    if (photo.path || !photo.blob) {
      photos.push(photo)
      continue
    }
    photos.push({ ...photo, path: await uploadPhotoBlob(d.jobId, photo.id, photo.blob), blob: undefined })
  }
  let { customerSignaturePath, techSignaturePath } = d
  if (!customerSignaturePath && d.customerSignature?.startsWith('data:')) {
    customerSignaturePath = await uploadSignatureData(d.jobId, 'customer', d.customerSignature)
  }
  if (!techSignaturePath && d.techSignature?.startsWith('data:')) {
    techSignaturePath = await uploadSignatureData(d.jobId, 'technician', d.techSignature)
  }
  return { ...d, photos, customerSignaturePath, techSignaturePath }
}

/* ------------------------------------------------------------------ write */
const readingsRow = (r: Readings, c: Conditions) => ({
  return_air: nullable(r.returnAir),
  supply_air: nullable(r.supplyAir),
  temp_split: nullable(r.tempSplit),
  return_static: nullable(r.returnStatic),
  supply_static: nullable(r.supplyStatic),
  total_static: nullable(r.totalStatic),
  incoming_v: nullable(r.incomingV),
  compressor_a: nullable(r.compressorA),
  cond_fan_a: nullable(r.condFanA),
  blower_a: nullable(r.blowerA),
  cap_rated_mfd: nullable(r.capRatedMfd),
  cap_actual_mfd: nullable(r.capActualMfd),
  suction_psig: nullable(r.suctionPsig),
  head_psig: nullable(r.headPsig),
  outdoor_f: nullable(r.outdoorF),
  superheat: nullable(r.superheat),
  subcooling: nullable(r.subcooling),
  refrigerant_added: nullable(r.refrigerantAdded),
  filter_check: c.filter,
  drain_check: c.drain,
  ductwork_check: c.ductwork,
  heating_check: c.heating,
})

export interface SavedJob {
  jobId: string
  /** The draft as written: uploaded paths, final status and the server's new updated_at. */
  draft: JobDraft
  updatedAt: string
}

/** Writes the whole draft: the job row plus every child table. `complete` marks the job
 *  completed and stamps the final-status / signature fields; otherwise the row keeps its
 *  current status. Pure with respect to the on-screen draft — the sync engine decides what
 *  to feed back into it (the snapshot may belong to a job no longer being edited). */
export async function saveJobDraft(input: JobDraft, complete = false): Promise<SavedJob> {
  const d = await uploadPending(input)
  const jobId = d.jobId || crypto.randomUUID()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const customerId = await resolveCustomer(d)
  const status: JobStatusValue = complete ? 'completed' : d.status
  const completedAt = complete ? (d.completedAt ?? new Date().toISOString()) : d.completedAt

  const { data: written, error: jobError } = await supabase
    .from('jobs')
    .upsert({
    id: jobId,
    work_order: d.workOrder.trim() || `WO-${jobId.slice(0, 8)}`,
    customer_id: customerId,
    customer_name: d.customer.trim(),
    address: d.address.trim(),
    unit_suite: nullable(d.unitSuite),
    technician: d.technician.trim(),
    job_date: parseUsDate(d.date),
    arrival_time: nullable(d.arrival),
    departure_time: nullable(d.departure),
    service_type: nullable(d.serviceType),
    complaints: d.complaints,
    complaint_details: nullable(d.complaintDetails),
    customer_notes: nullable(d.customerNotes),
    status,
    step: complete ? 4 : furthestStep(d),
    final_status: d.finalStatus,
    customer_rep_name: nullable(d.customerName),
    customer_signature_path: d.customerSignaturePath,
    technician_signature_path: d.techSignaturePath,
    completed_at: completedAt,
    created_by: session?.user.id ?? null,
    })
    .select('updated_at')
    .single()
  if (jobError) throw jobError

  // Children are replaced wholesale: a draft is small and this keeps positions and
  // removals trivially right.
  const { error: eqDelError } = await supabase.from('equipment').delete().eq('job_id', jobId)
  if (eqDelError) throw eqDelError
  if (d.equipment.length) {
    const { error: eqError } = await supabase.from('equipment').insert(
      d.equipment.map((u, i) => ({
        job_id: jobId,
        position: i + 1,
        equipment_id: nullable(u.equipmentId),
        location: nullable(u.location),
        type: nullable(u.type),
        manufacturer: nullable(u.manufacturer),
        model: nullable(u.model),
        serial: nullable(u.serial),
        tonnage: nullable(u.tonnage),
        refrigerant: nullable(u.refrigerant),
        voltage: nullable(u.voltage),
        filter_size: nullable(u.filterSize),
      })),
    )
    if (eqError) throw eqError
  }

  const { error: readingsError } = await supabase.from('readings').upsert({ job_id: jobId, ...readingsRow(d.readings, d.conditions) })
  if (readingsError) throw readingsError

  const { error: findingsError } = await supabase.from('job_findings').upsert({
    job_id: jobId,
    findings: d.findings,
    repairs: d.repairs,
    recommendations: d.recommendations,
    service_notes: nullable(d.serviceNotes),
    parts: nullable(d.parts),
    recommended_work: nullable(d.recommendedWork),
  })
  if (findingsError) throw findingsError

  await saveInvoice(jobId, d.invoice)

  const { error: photoDelError } = await supabase.from('photos').delete().eq('job_id', jobId)
  if (photoDelError) throw photoDelError
  const photoRows = d.photos.flatMap((p, i) => (p.path ? [{ id: p.id, job_id: jobId, position: i + 1, storage_path: p.path }] : []))
  if (photoRows.length) {
    const { error: photoError } = await supabase.from('photos').insert(photoRows)
    if (photoError) throw photoError
  }

  return { jobId, draft: { ...d, jobId, status, completedAt, updatedAt: written.updated_at }, updatedAt: written.updated_at }
}

/* ------------------------------------------------------------------ persisted draft (reload) */
let hydrated: Promise<void> | null = null
/** Restores the draft persisted by the store (draft.ts) after a reload. Object URLs of
 *  photos die with the page, so they are rebuilt from the kept blob, or from a signed URL
 *  when the file is already in Storage (best effort — offline the tile stays empty). */
export const hydrateDraft = (): Promise<void> => {
  hydrated ??= (async () => {
    const stored = await readPersistedDraft()
    if (!stored) return
    const photos = (stored['step4.photos'] as DraftPhoto[] | undefined) ?? []
    const rebuilt = await Promise.all(
      photos.map(async (p) => {
        if (p.blob) return { ...p, url: URL.createObjectURL(p.blob) }
        if (!p.path) return { ...p, url: '' }
        const { data } = await supabase.storage.from('photos').createSignedUrl(p.path, 60 * 60)
        return { ...p, url: data?.signedUrl ?? '' }
      }),
    ).catch(() => photos)
    restoreDraft({ ...stored, 'step4.photos': rebuilt })
  })()
  return hydrated
}

/* ------------------------------------------------------------------ read back (Edit job) */
interface StoredJob {
  id: string
  updated_at: string
  work_order: string
  customer_name: string
  address: string
  unit_suite: string | null
  technician: string
  job_date: string
  arrival_time: string | null
  departure_time: string | null
  service_type: string | null
  complaints: string[]
  complaint_details: string | null
  customer_notes: string | null
  status: JobStatusValue
  final_status: StatusColor | null
  customer_rep_name: string | null
  customer_signature_path: string | null
  technician_signature_path: string | null
  completed_at: string | null
  equipment: {
    position: number
    equipment_id: string | null
    location: string | null
    type: string | null
    manufacturer: string | null
    model: string | null
    serial: string | null
    tonnage: string | null
    refrigerant: string | null
    voltage: string | null
    filter_size: string | null
  }[]
  readings: ReturnType<typeof readingsRow> | ReturnType<typeof readingsRow>[] | null
  findings: FindingsRow | FindingsRow[] | null
  invoice: InvoiceRow | InvoiceRow[] | null
  photos: { id: string; position: number; storage_path: string }[]
}
interface FindingsRow {
  findings: string[]
  repairs: string[]
  recommendations: string[]
  service_notes: string | null
  parts: string | null
  recommended_work: string | null
}
interface InvoiceRow {
  tax_rate: number
  discount: number
  description: string | null
  items: { id: string; position: number; description: string; qty: number; unit_price: number; customer_paid: boolean }[]
}
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)
const str = (v: string | null | undefined) => v ?? ''

const signedUrl = async (bucket: string, path: string | null) => {
  if (!path) return null
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? null
}

/** Pulls a stored job into the draft store so Steps 1–4 open with its data. Autosave
 *  then updates the same row (same id, same status). */
export async function loadJobIntoDraft(jobId: string): Promise<void> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `id, updated_at, work_order, customer_name, address, unit_suite, technician, job_date, arrival_time, departure_time, service_type,
       complaints, complaint_details, customer_notes, status, final_status, customer_rep_name, customer_signature_path,
       technician_signature_path, completed_at,
       equipment(position, equipment_id, location, type, manufacturer, model, serial, tonnage, refrigerant, voltage, filter_size),
       readings(*), findings:job_findings(*),
       invoice:invoices(tax_rate, discount, description, items:invoice_items(id, position, description, qty, unit_price, customer_paid)),
       photos(id, position, storage_path)`,
    )
    .eq('id', jobId)
    .single()
  if (error) throw error
  const job = data as unknown as StoredJob
  const r = one(job.readings)
  const f = one(job.findings)
  const inv = one(job.invoice)

  const photos = [...job.photos].sort((a, b) => a.position - b.position)
  const photoUrls = photos.length
    ? ((await supabase.storage.from('photos').createSignedUrls(photos.map((p) => p.storage_path), 60 * 60)).data ?? [])
    : []
  const [customerSignature, techSignature] = await Promise.all([
    signedUrl('signatures', job.customer_signature_path),
    signedUrl('signatures', job.technician_signature_path),
  ])

  const readings: Readings = r
    ? {
        returnAir: str(r.return_air),
        supplyAir: str(r.supply_air),
        tempSplit: str(r.temp_split),
        returnStatic: str(r.return_static),
        supplyStatic: str(r.supply_static),
        totalStatic: str(r.total_static),
        incomingV: str(r.incoming_v),
        compressorA: str(r.compressor_a),
        condFanA: str(r.cond_fan_a),
        blowerA: str(r.blower_a),
        capRatedMfd: str(r.cap_rated_mfd),
        capActualMfd: str(r.cap_actual_mfd),
        suctionPsig: str(r.suction_psig),
        headPsig: str(r.head_psig),
        outdoorF: str(r.outdoor_f),
        superheat: str(r.superheat),
        subcooling: str(r.subcooling),
        refrigerantAdded: str(r.refrigerant_added),
      }
    : EMPTY_READINGS
  const hasReadings = Object.values(readings).some((v) => v !== '')

  const equipment: Equipment[] = [...job.equipment]
    .sort((a, b) => a.position - b.position)
    .map((u, i) => ({
      id: `unit-${i + 1}`,
      equipmentId: str(u.equipment_id),
      location: str(u.location),
      type: str(u.type),
      manufacturer: str(u.manufacturer),
      model: str(u.model),
      serial: str(u.serial),
      tonnage: str(u.tonnage),
      refrigerant: str(u.refrigerant),
      voltage: str(u.voltage),
      filterSize: str(u.filter_size),
    }))

  loadDraft({
    'job.id': job.id,
    'job.status': job.status,
    'job.completedAt': job.completed_at,
    'job.updatedAt': job.updated_at,
    'job.customerSignaturePath': job.customer_signature_path,
    'job.techSignaturePath': job.technician_signature_path,
    'step1.workOrder': job.work_order,
    'step1.date': formatUsDate(job.job_date),
    'step1.technician': job.technician,
    'step1.unitSuite': str(job.unit_suite),
    'step1.customer': job.customer_name,
    'step1.address': job.address,
    'step1.arrival': str(job.arrival_time),
    'step1.departure': str(job.departure_time),
    'step1.customerNotes': str(job.customer_notes),
    'step1.serviceType': str(job.service_type),
    'step1.complaints': job.complaints,
    'step1.complaintDetails': str(job.complaint_details),
    'step1.equipment': equipment,
    'step2.readingsOpen': hasReadings,
    'step2.readings': readings,
    'step2.conditions': r
      ? { filter: r.filter_check, drain: r.drain_check, ductwork: r.ductwork_check, heating: r.heating_check }
      : EMPTY_CONDITIONS,
    'step3.findings': f?.findings ?? [],
    'step3.repairs': f?.repairs ?? [],
    'step3.recommendations': f?.recommendations ?? [],
    'step3.serviceNotes': str(f?.service_notes),
    'step3.parts': str(f?.parts),
    'step3.recommendedWork': str(f?.recommended_work),
    'step4.status': job.final_status,
    'step4.photos': photos.map((p, i) => ({ id: p.id, path: p.storage_path, url: photoUrls[i]?.signedUrl ?? '' }) satisfies DraftPhoto),
    'step4.customerName': str(job.customer_rep_name),
    'step4.customerSignature': customerSignature,
    'step4.techSignature': techSignature,
    'step4.invoice': inv
      ? {
          items: [...inv.items].sort((a, b) => a.position - b.position).map((i) => ({ id: i.id, description: i.description, qty: i.qty, unitPrice: i.unit_price, customerPaid: i.customer_paid })),
          taxRate: inv.tax_rate,
          discount: inv.discount,
          description: str(inv.description),
        }
      : EMPTY_INVOICE,
  })
}
