import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { CompanyContext } from '../pdf/company'
import { decodePdfPayload } from '../pdf/data'
import { invoicePages } from '../pdf/InvoicePdf'
import { PdfSheet } from '../pdf/primitives'
import { serviceReportPages } from '../pdf/ServiceReport'

declare global {
  interface Window {
    /** Set once fonts and images are in — the PDF renderer waits for it before printing. */
    __pdfReady?: boolean
  }
}

/** Routes `/print/report` and `/print/invoice`: the bare sheets, 1:1, no app chrome, for
 *  headless Chrome on the server. All data arrives in the URL hash (`#data=…`, built by the
 *  function from the stored job), so this page needs no session and makes no queries. */
export function PrintPage() {
  const { kind } = useParams()
  const payload = useMemo(() => decodePdfPayload(window.location.hash), [])

  useEffect(() => {
    if (!payload) return
    const settle = async () => {
      await document.fonts.ready
      await Promise.all(
        [...document.images].map(
          (img) =>
            img.complete ||
            new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            }),
        ),
      )
      window.__pdfReady = true
    }
    void settle()
  }, [payload])

  if (!payload || payload.kind !== kind) return <p className="p-lg text-body text-ink">No document data.</p>
  const pages = payload.kind === 'report' && payload.report ? serviceReportPages(payload.report) : payload.invoice ? invoicePages(payload.invoice) : []

  return (
    <CompanyContext.Provider value={payload.company}>
      <div className="print-page flex flex-col bg-surface">
        {pages.map((page, i) => (
          <PdfSheet key={i}>{page}</PdfSheet>
        ))}
      </div>
    </CompanyContext.Provider>
  )
}
