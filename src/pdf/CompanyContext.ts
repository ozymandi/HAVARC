import { createContext } from 'react'
import { DEFAULT_COMPANY, type PdfCompany } from './company.js'

/** The PDF primitives read the company from here; PdfPreview and the print route provide it.
 *  Kept apart from company.ts so the Vercel function's import graph stays React-free. */
export const CompanyContext = createContext<PdfCompany>(DEFAULT_COMPANY)
