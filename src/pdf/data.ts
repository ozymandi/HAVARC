import { statusOption } from '../data/status.js'
import type { PdfCompany } from './company.js'
import { one, type PdfJobRow } from './query.js'
import type { InvoicePdfData, PdfEquipment, PdfReadings, PdfSignature, ReportData } from './types.js'

/* Builds the data the PDF templates render from stored rows. Shared by the in-app
 * preview and the Vercel function, so both produce the same document. */

export type PdfKind = 'report' | 'invoice'

export interface PdfSource {
  job: PdfJobRow
  /** Storage path → URL the renderer can load (signed URL or object URL). */
  photoUrls: Record<string, string>
  customerSignatureUrl: string | null
  technicianSignatureUrl: string | null
  company: PdfCompany
}

const str = (v: string | null | undefined) => v ?? ''

/** "2026-09-02" → "09/02/2026" */
const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

/** "09/02/26 11:38 AM" for signature lines. */
const signedAt = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

/** "1997 Ashley Pl, Riverdale GA" → ["1997 Ashley Pl", "Riverdale GA"] for the hero table. */
export const splitAddress = (address: string): string[] => {
  const i = address.indexOf(',')
  return i === -1 ? [address] : [address.slice(0, i).trim(), address.slice(i + 1).trim()]
}

/** Step 1 says "Diagnostic / Repair Call"; the printed checklist says "Diagnostic / Service Call". */
const SERVICE_TYPE_ALIASES: Record<string, string> = { 'Diagnostic / Repair Call': 'Diagnostic / Service Call' }

const equipmentOf = (job: PdfJobRow): PdfEquipment[] =>
  [...job.equipment]
    .sort((a, b) => a.position - b.position)
    .map((u) => ({
      unitId: str(u.equipment_id),
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

const header = (job: PdfJobRow) => ({
  workOrder: job.work_order,
  date: longDate(job.job_date),
  customer: job.customer_name,
  addressLines: splitAddress(job.address),
  phone: job.customer?.phone ?? undefined,
})

export function buildReportData(src: PdfSource): ReportData {
  const { job } = src
  const r = one(job.readings)
  const f = one(job.findings)
  const readings: PdfReadings | null = r
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
    : null
  const when = signedAt(job.completed_at)
  const signature = (url: string | null, name: string): PdfSignature | null => (url ? { image: url, name, signedAt: when } : null)

  return {
    ...header(job),
    status: job.final_status ? statusOption(job.final_status) : null,
    serviceType: [job.service_type ? (SERVICE_TYPE_ALIASES[job.service_type] ?? job.service_type) : null, ...job.complaints].filter(
      (s): s is string => !!s,
    ),
    complaintDetails: str(job.complaint_details),
    customerNotes: str(job.customer_notes),
    equipment: equipmentOf(job),
    readings,
    conditions: r
      ? { filter: r.filter_check, drain: r.drain_check, ductwork: r.ductwork_check, heating: r.heating_check }
      : { filter: null, drain: null, ductwork: null, heating: null },
    findings: f?.findings ?? [],
    repairs: f?.repairs ?? [],
    recommendations: f?.recommendations ?? [],
    serviceNotes: str(f?.service_notes),
    parts: str(f?.parts),
    recommendedWork: str(f?.recommended_work),
    photos: [...job.photos]
      .sort((a, b) => a.position - b.position)
      .flatMap((p) => (src.photoUrls[p.storage_path] ? [{ src: src.photoUrls[p.storage_path] }] : [])),
    customerSignature: signature(src.customerSignatureUrl, job.customer_rep_name || job.customer_name),
    technicianSignature: signature(src.technicianSignatureUrl, job.technician),
  }
}

export function buildInvoiceData(src: PdfSource): InvoicePdfData {
  const { job } = src
  const inv = one(job.invoice)
  return {
    ...header(job),
    number: inv?.number ?? 'Draft',
    items: [...(inv?.items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, description: i.description, qty: i.qty, unitPrice: i.unit_price, customerPaid: i.customer_paid })),
    taxRate: inv?.tax_rate ?? 0,
    discount: inv?.discount ?? 0,
    description: str(inv?.description),
    equipment: equipmentOf(job),
    workPerformed: workPerformedFor(job),
  }
}

/** The invoice's WORK PERFORMED checklist is the client's paper form; the app has no
 *  such step, so its ticks are derived from what the technician actually recorded:
 *  repairs and findings (Step 3), readings and condition checks (Step 2), parts text and
 *  the service type (Step 1). A Preventive Maintenance call ticks the routine checks. */
export function workPerformedFor(job: PdfJobRow): string[] {
  const ticks = new Set<string>()
  const tick = (...labels: string[]) => labels.forEach((l) => ticks.add(l))
  const f = one(job.findings)
  const r = one(job.readings)
  const has = (v: string | null | undefined) => !!v && v.trim() !== ''

  if (job.service_type === 'Preventive Maintenance') {
    tick('Checked Coils', 'Checked air filter', 'Checked Motors', 'Checked Electrical Connections', 'Checked Safety Controls', 'Checked thermostat')
  }
  if (job.complaints.includes('Thermostat / Controls')) tick('Checked thermostat')

  for (const repair of f?.repairs ?? []) {
    if (repair === 'Coil Cleaning') tick('Cleaned O/D Coil', 'Checked Coils')
    if (repair === 'Refrigerant Added') tick('Adjusted Refrigerant', 'Checked Refrigerant')
    if (repair === 'Leak Search') tick('Checked for Ref. Leaks', 'Checked Refrigerant')
    if (repair === 'Electrical Repair') tick('Checked Electrical Connections')
  }
  for (const finding of f?.findings ?? []) {
    if (finding === 'Dirty Condenser Coil' || finding === 'Dirty Evaporator Coil') tick('Checked Coils')
    if (finding === 'Low Refrigerant') tick('Checked Refrigerant')
    if (finding === 'Leak Suspected') tick('Checked for Ref. Leaks')
    if (finding === 'Blower Motor Issue' || finding === 'Condenser Fan Motor Issue') tick('Checked Motors')
    if (finding === 'Electrical / Wiring') tick('Checked Electrical Connections')
    if (finding === 'Failed / Weak Capacitor' || finding === 'Failed / Burned Contactor') tick('Checked Electrical Connections', 'Amp Check')
  }

  const parts = (f?.parts ?? '').toLowerCase()
  if (/filter/.test(parts)) tick('Changed air filter', 'Checked air filter')
  if (/thermocouple/.test(parts)) tick('Replace Thermocouple')

  if (r) {
    if (r.filter_check) tick('Checked air filter')
    if (r.heating_check) tick('Checked Heat Exchange')
    if (has(r.incoming_v)) tick('Volt Check')
    if (has(r.compressor_a) || has(r.cond_fan_a) || has(r.blower_a)) tick('Amp Check')
    if (has(r.outdoor_f)) tick('Outdoor temp')
    if (has(r.return_air)) tick('RA temp', 'Indoor temp')
    if (has(r.supply_air)) tick('SA temp')
    if (has(r.head_psig)) tick('Head PSIG')
    if (has(r.suction_psig)) tick('Suction PSIG')
    if (has(r.subcooling)) tick('Subcool')
    if (has(r.superheat)) tick('Superheat Degrees F')
    if (has(r.suction_psig) || has(r.head_psig) || has(r.superheat) || has(r.subcooling)) tick('Checked Refrigerant')
  }
  return [...ticks]
}

/* ------------------------------------------------------------------ print-route payload
 * The renderer hands the print page everything it needs in the URL hash, so that page
 * needs neither a session nor a database call. */
export interface PdfPayload {
  kind: PdfKind
  company: PdfCompany
  report?: ReportData
  invoice?: InvoicePdfData
}

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromBase64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export const encodePdfPayload = (payload: PdfPayload): string => toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))

export const decodePdfPayload = (hash: string): PdfPayload | null => {
  const m = hash.match(/data=([A-Za-z0-9_-]+)/)
  if (!m) return null
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(m[1]))) as PdfPayload
  } catch {
    return null
  }
}
