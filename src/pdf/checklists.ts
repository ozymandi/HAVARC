import type { PdfReadings } from './types'

/** Fixed checklists printed on the PDFs. The Service Report lists mirror the Step 1–3 chip
 *  options exactly (same labels, so a tick in the app is a tick on paper); WORK PERFORMED
 *  is the client's paper-invoice checklist (Figma PDF · Invoice · Page 2), which has no
 *  in-app counterpart yet — see `sampleReport.ts` for how ticks are derived. */

export const SERVICE_TYPE_ITEMS = [
  'Diagnostic / Service Call',
  'Preventive Maintenance',
  'No Cooling',
  'No Heating',
  'Water Leak',
  'Airflow Issue',
  'Noise / Vibration',
  'Thermostat / Controls',
]

export const CONDITION_ITEMS: { key: 'filter' | 'drain' | 'ductwork' | 'heating'; good: string; issue: string }[] = [
  { key: 'filter', good: 'Filter Good', issue: 'Filter Dirty' },
  { key: 'drain', good: 'Drain Good', issue: 'Drain Clogged' },
  { key: 'ductwork', good: 'Ductwork Good', issue: 'Duct Leakage' },
  { key: 'heating', good: 'Heating Good', issue: 'Heating Needs Attn' },
]

export const FINDINGS_ITEMS = [
  'No Defects Found',
  'Failed / Weak Capacitor',
  'Failed / Burned Contactor',
  'Blower Motor Issue',
  'Condenser Fan Motor Issue',
  'Compressor Issue',
  'Low Refrigerant',
  'Leak Suspected',
  'Dirty Evaporator Coil',
  'Dirty Condenser Coil',
  'Clogged Drain',
  'Electrical / Wiring',
]

export const REPAIRS_ITEMS = ['Diagnostic Only', 'Electrical Repair', 'Drain Repair', 'Refrigerant Added', 'Leak Search', 'Coil Cleaning', 'Part Replaced', 'No Repair Performed']

export const RECOMMENDATION_ITEMS = ['No Further Action', 'Repair Recommended', 'Estimate Required', 'Parts Required', 'Return Visit Required', 'Replacement Recommended']

export const WORK_PERFORMED_ITEMS = [
  'Cleaned O/D Coil',
  'Checked Coils',
  'Checked Refrigerant',
  'Checked Belts',
  'Checked Motors',
  'Amp Check',
  'Volt Check',
  'Checked thermostat',
  'Checked air filter',
  'Changed air filter',
  'Cleaned I.D. Coil',
  'Checked for Ref. Leaks',
  'Checked Pulleys',
  'Lubricated Motor/Bearings',
  'Checked Safety Controls',
  'Checked Electrical Connections',
  'Checked Heat Exchange',
  'Adjusted Refrigerant',
  'Vacuum Burners',
  'Replace Thermocouple',
  'Checked pilot',
  'Outdoor temp',
  'Indoor temp',
  'Subcool',
  'Superheat Degrees F',
  'RA temp',
  'SA temp',
  'Head PSIG',
  'Suction PSIG',
]

export const READINGS_GROUPS: { title: string; rows: { key: keyof PdfReadings; label: string }[] }[] = [
  {
    title: 'AIRFLOW / TEMP',
    rows: [
      { key: 'returnAir', label: 'Return Air °F' },
      { key: 'supplyAir', label: 'Supply Air °F' },
      { key: 'tempSplit', label: 'Temp Split °F' },
      { key: 'returnStatic', label: 'Return Static' },
      { key: 'supplyStatic', label: 'Supply Static' },
      { key: 'totalStatic', label: 'Total Static' },
    ],
  },
  {
    title: 'ELECTRICAL',
    rows: [
      { key: 'incomingV', label: 'Incoming V' },
      { key: 'compressorA', label: 'Compressor A' },
      { key: 'condFanA', label: 'Cond. Fan A' },
      { key: 'blowerA', label: 'Blower A' },
      { key: 'capRatedMfd', label: 'Cap Rated MFD' },
      { key: 'capActualMfd', label: 'Cap Actual MFD' },
    ],
  },
  {
    title: 'REFRIGERANT',
    rows: [
      { key: 'suctionPsig', label: 'Suction PSIG' },
      { key: 'headPsig', label: 'Head PSIG' },
      { key: 'outdoorF', label: 'Outdoor °F' },
      { key: 'superheat', label: 'Superheat °F' },
      { key: 'subcooling', label: 'Subcooling °F' },
      { key: 'refrigerantAdded', label: 'Added (lbs)' },
    ],
  },
]
