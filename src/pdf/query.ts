/** The one query both renderers use to load a job for its PDFs: the app (in-app preview)
 *  and the Vercel function (real files). Pure types, no client — each side brings its own. */

export const PDF_JOB_SELECT = `id, work_order, customer_name, address, unit_suite, technician, job_date, arrival_time, departure_time,
  service_type, complaints, complaint_details, customer_notes, status, final_status, customer_rep_name,
  customer_signature_path, technician_signature_path, completed_at,
  customer:customers(phone),
  equipment(position, equipment_id, location, type, manufacturer, model, serial, tonnage, refrigerant, voltage, filter_size),
  readings(*),
  findings:job_findings(findings, repairs, recommendations, service_notes, parts, recommended_work),
  invoice:invoices(number, tax_rate, discount, description, items:invoice_items(id, position, description, qty, unit_price, customer_paid)),
  photos(id, position, storage_path)`

type CheckState = 'good' | 'issue' | null
type OneOrMany<T> = T | T[] | null

export interface PdfReadingsRow {
  return_air: string | null
  supply_air: string | null
  temp_split: string | null
  return_static: string | null
  supply_static: string | null
  total_static: string | null
  incoming_v: string | null
  compressor_a: string | null
  cond_fan_a: string | null
  blower_a: string | null
  cap_rated_mfd: string | null
  cap_actual_mfd: string | null
  suction_psig: string | null
  head_psig: string | null
  outdoor_f: string | null
  superheat: string | null
  subcooling: string | null
  refrigerant_added: string | null
  filter_check: CheckState
  drain_check: CheckState
  ductwork_check: CheckState
  heating_check: CheckState
}

export interface PdfJobRow {
  id: string
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
  status: 'draft' | 'pending' | 'completed'
  final_status: 'green' | 'yellow' | 'orange' | 'red' | null
  customer_rep_name: string | null
  customer_signature_path: string | null
  technician_signature_path: string | null
  completed_at: string | null
  customer: { phone: string | null } | null
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
  readings: OneOrMany<PdfReadingsRow>
  findings: OneOrMany<{
    findings: string[]
    repairs: string[]
    recommendations: string[]
    service_notes: string | null
    parts: string | null
    recommended_work: string | null
  }>
  invoice: OneOrMany<{
    number: string | null
    tax_rate: number
    discount: number
    description: string | null
    items: { id: string; position: number; description: string; qty: number; unit_price: number; customer_paid: boolean }[]
  }>
  photos: { id: string; position: number; storage_path: string }[]
}

/** PostgREST returns a one-to-one embed as an object, older shapes as a one-element array. */
export const one = <T,>(value: OneOrMany<T>): T | null => (Array.isArray(value) ? (value[0] ?? null) : value)
