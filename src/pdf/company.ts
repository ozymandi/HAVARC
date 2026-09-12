import { createContext } from 'react'

/** Company block printed on every PDF: contacts in the hero, the footer line and the
 *  closing note. Name / contacts / note come from Settings; the slogan is brand copy. */
export interface PdfCompany {
  name: string
  phone: string
  email: string
  address: string
  /** Settings → "Invoice footer note". The first sentence is set in the emphasised style. */
  footerNote: string
  slogan: string[]
}

export const DEFAULT_COMPANY: PdfCompany = {
  name: "HAV' ARC Heating and Air",
  phone: '678-750-0411',
  email: 'hav.arcservices@gmail.com',
  address: '202 Spring Cir, Stockbridge, GA 30281',
  footerNote: 'We appreciate your business! If you have any questions, please contact us at 678-750-0411.',
  slogan: ['QUALITY SERVICE.', 'COMFORT YOU CAN COUNT ON.'],
}

/** The PDF primitives read the company from here; PdfPreview and the print route provide it. */
export const CompanyContext = createContext<PdfCompany>(DEFAULT_COMPANY)

export interface CompanySettingsLike {
  company_name: string
  phone: string | null
  email: string | null
  address: string | null
  invoice_footer: string | null
}

export const companyFromSettings = (s: CompanySettingsLike): PdfCompany => ({
  ...DEFAULT_COMPANY,
  name: s.company_name || DEFAULT_COMPANY.name,
  phone: s.phone || DEFAULT_COMPANY.phone,
  email: s.email || DEFAULT_COMPANY.email,
  address: s.address || DEFAULT_COMPANY.address,
  footerNote: s.invoice_footer || DEFAULT_COMPANY.footerNote,
})

/** "We appreciate your business! If you have…" → ["WE APPRECIATE YOUR BUSINESS!", "If you have…"] */
export const splitFooterNote = (note: string): [string, string] => {
  const m = note.match(/^(.*?[.!?])\s+(.*)$/s)
  return m ? [m[1].toUpperCase(), m[2]] : [note.toUpperCase(), '']
}
