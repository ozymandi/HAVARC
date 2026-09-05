import type { LineItem } from '../components/LineItemRow'
import type { StatusColor } from '../components/StatusBanner'

/** Data shapes the PDF templates render. They are deliberately independent of the mock
 *  `Job` list shape and of the step draft store — `sampleReport.ts` builds them from either,
 *  and the backend will build them from Postgres rows for server-side rendering. */

export interface PdfEquipment {
  unitId: string
  location: string
  type: string
  manufacturer: string
  model: string
  serial: string
  tonnage: string
  refrigerant: string
  voltage: string
  filterSize: string
}

/** Same keys as Step 2's readings form; a group renders only when at least one value exists. */
export interface PdfReadings {
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

export type CheckState = 'good' | 'issue' | null

export interface PdfConditions {
  filter: CheckState
  drain: CheckState
  ductwork: CheckState
  heating: CheckState
}

export interface PdfSignature {
  /** Data URL / path of the drawn signature; absent = signed on paper / not captured. */
  image?: string
  name: string
  /** e.g. "09/02/26 11:38 AM" */
  signedAt: string
}

export interface PdfPhoto {
  src: string
  caption?: string
}

export interface PdfJobHeader {
  workOrder: string
  date: string
  customer: string
  addressLines: string[]
  phone?: string
}

export interface ReportData extends PdfJobHeader {
  status: { color: StatusColor; label: string; description: string } | null
  /** Which of the SERVICE TYPE checklist labels are ticked (service types + complaints). */
  serviceType: string[]
  complaintDetails: string
  customerNotes: string
  equipment: PdfEquipment[]
  readings: PdfReadings | null
  conditions: PdfConditions
  findings: string[]
  repairs: string[]
  recommendations: string[]
  serviceNotes: string
  parts: string
  recommendedWork: string
  photos: PdfPhoto[]
  customerSignature: PdfSignature | null
  technicianSignature: PdfSignature | null
}

export interface InvoicePdfData extends PdfJobHeader {
  /** Sequential number assigned server-side; "Draft" until then. */
  number: string
  items: LineItem[]
  taxRate: number
  discount: number
  description: string
  equipment: PdfEquipment[]
  /** Ticked labels of the WORK PERFORMED checklist (the client's paper-invoice checklist). */
  workPerformed: string[]
}
