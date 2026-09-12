import type { LineItem } from '../components/LineItemRow'
import type { InvoicePdfData, PdfEquipment, ReportData } from '../pdf/types'
import type { InvoiceData } from './invoice'
import type { Job } from './jobs'

/** The worked example from the Figma PDF templates (WO-10031 · Brenda Johnson). Until jobs
 *  carry full step data from the backend, a job's PDFs are this sample with the job's own
 *  header fields (work order, customer, address, phone, notes, status, photos, invoice #)
 *  swapped in — so every mock job previews as a complete, realistic document. */

const SAMPLE_EQUIPMENT: PdfEquipment[] = [
  { unitId: 'RTU-1', location: 'Roof', type: 'RTU', manufacturer: 'RUUD', model: 'UAKA-037JAZ', serial: '5429-M109609450', tonnage: '3', refrigerant: 'R-410A', voltage: '208/230V · 1Ø', filterSize: '20 × 25 × 1' },
  { unitId: 'AHU-1', location: 'Mechanical room', type: 'Air Handler', manufacturer: 'Carrier', model: 'FB4CNP036', serial: 'X1234567', tonnage: '3', refrigerant: 'R-410A', voltage: '208/230V · 1Ø', filterSize: '16 × 25 × 1' },
]

export const SAMPLE_REPORT: ReportData = {
  workOrder: 'WO-10031',
  date: '09/02/2026',
  customer: 'Brenda Johnson',
  addressLines: ['1997 Ashley Pl', 'Riverdale, GA 30296-2448'],
  phone: '770-994-8768',
  status: { color: 'yellow', label: 'Yellow', description: 'Repairs Recommended' },
  serviceType: ['Diagnostic / Service Call', 'No Cooling'],
  complaintDetails: 'No cooling on the rooftop unit since Monday. Thermostat reads 82°F, fan runs but no cold air.',
  customerNotes: 'Gate code 4471#. Key box by the side door. Dog in the backyard — call before entering.',
  equipment: SAMPLE_EQUIPMENT,
  readings: {
    returnAir: '76',
    supplyAir: '57',
    tempSplit: '19',
    returnStatic: '0.32',
    supplyStatic: '0.41',
    totalStatic: '0.73',
    incomingV: '238',
    compressorA: '14.2',
    condFanA: '1.8',
    blowerA: '4.1',
    capRatedMfd: '45',
    capActualMfd: '38',
    suctionPsig: '118',
    headPsig: '330',
    outdoorF: '91',
    superheat: '12',
    subcooling: '9',
    refrigerantAdded: '1.0',
  },
  conditions: { filter: 'issue', drain: 'good', ductwork: 'good', heating: 'good' },
  findings: ['Failed / Weak Capacitor', 'Low Refrigerant'],
  repairs: ['Refrigerant Added', 'Part Replaced'],
  recommendations: ['Repair Recommended', 'Estimate Required'],
  serviceNotes: 'Capacitor reading 38/45 MFD — replaced. System was 1 lb low on R-410A; charged to 9°F subcooling. Cooling restored, 19°F split.',
  parts: '1 × 45/5 MFD capacitor · 1 lb R-410A',
  recommendedWork: 'Leak search on suction line; condenser coil cleaning at next PM.',
  // The four sample photos Yaroslav put in public/photo, captioned as on the Figma page 4.
  photos: [
    { src: '/photo/photo-1513694203232-719a280e022f.avif', caption: 'Condenser coil before cleaning' },
    { src: '/photo/photo-1583847268964-b28dc8f51f92.avif', caption: 'Failed 45/5 MFD capacitor' },
    { src: '/photo/photo-1598928506311-c55ded91a20c.avif', caption: 'Gauge readings after charge' },
    { src: '/photo/photo-1616047006789-b7af5afb8c20.avif', caption: 'Unit label — RTU-1' },
  ],
  customerSignature: { name: 'Brenda Johnson', signedAt: '09/02/26 11:38 AM' },
  technicianSignature: { name: 'T. Holloway', signedAt: '09/02/26 11:40 AM' },
}

export const SAMPLE_INVOICE_ITEMS: LineItem[] = [
  { id: 'item-1', description: 'Labor', qty: 3.5, unitPrice: 80, customerPaid: false },
  { id: 'item-2', description: 'Refrigerant', qty: 1, unitPrice: 115, customerPaid: false },
  { id: 'item-3', description: 'Contactor', qty: 1, unitPrice: 179, customerPaid: false },
  { id: 'item-4', description: 'Thermostat', qty: 1, unitPrice: 450, customerPaid: true },
  { id: 'item-5', description: 'Disconnect', qty: 1, unitPrice: 250, customerPaid: true },
]

export const SAMPLE_INVOICE_DESCRIPTION =
  'Bad thermostat, contactor, and disconnect. Added 1 lb of refrigerant. Customer needs emergency portable cooling if repairs cannot be done.'

const SAMPLE_WORK_PERFORMED = [
  'Cleaned O/D Coil',
  'Checked Coils',
  'Checked Refrigerant',
  'Checked Motors',
  'Amp Check',
  'Volt Check',
  'Checked air filter',
  'Changed air filter',
  'Checked Safety Controls',
  'Checked Electrical Connections',
  'Adjusted Refrigerant',
]

/** "1997 Ashley Pl, Riverdale GA" → ["1997 Ashley Pl", "Riverdale GA"] for the hero table. */
const splitAddress = (address: string) => {
  const i = address.indexOf(',')
  return i === -1 ? [address] : [address.slice(0, i).trim(), address.slice(i + 1).trim()]
}

const dateFromMeta = (job: Job) => {
  const m = job.meta.match(/(\d{2})\/(\d{2})\/(\d{2})$/)
  return m ? `${m[1]}/${m[2]}/20${m[3]}` : SAMPLE_REPORT.date
}

export function reportForJob(job: Job): ReportData {
  return {
    ...SAMPLE_REPORT,
    workOrder: job.workOrder,
    date: dateFromMeta(job),
    customer: job.customer,
    addressLines: splitAddress(job.address),
    phone: job.phone,
    customerNotes: job.customerNotes ?? '',
    status: job.finalStatus ?? SAMPLE_REPORT.status,
    photos: job.photos ? job.photos.map((src, i) => ({ src, caption: SAMPLE_REPORT.photos[i]?.caption })) : SAMPLE_REPORT.photos,
    customerSignature: SAMPLE_REPORT.customerSignature && { ...SAMPLE_REPORT.customerSignature, name: job.customer },
  }
}

export function invoiceForJob(job: Job, invoice: InvoiceData): InvoicePdfData {
  return {
    workOrder: job.workOrder,
    date: dateFromMeta(job),
    customer: job.customer,
    addressLines: splitAddress(job.address),
    phone: job.phone,
    number: job.invoiceNumber ?? 'Draft',
    items: invoice.items,
    taxRate: invoice.taxRate,
    discount: invoice.discount,
    description: invoice.description || SAMPLE_INVOICE_DESCRIPTION,
    equipment: SAMPLE_EQUIPMENT,
    workPerformed: SAMPLE_WORK_PERFORMED,
  }
}
