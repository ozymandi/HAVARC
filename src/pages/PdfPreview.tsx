import { Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { fetchPdfSource } from '../data/documents'
import { readDraft } from '../data/draft'
import type { InvoiceData } from '../data/invoice'
import { useAsync } from '../hooks/useAsync'
import { CompanyContext } from '../pdf/company'
import { buildInvoiceData, buildReportData } from '../pdf/data'
import { invoicePages } from '../pdf/InvoicePdf'
import { PDF_HEIGHT, PDF_WIDTH, PdfSheet } from '../pdf/primitives'
import { serviceReportPages } from '../pdf/ServiceReport'

/** In-app preview of a job's PDFs (routes `/jobs/:id/report` and `/jobs/:id/invoice/pdf`),
 *  built from the stored job with the same templates and data mapping as the server.
 *  The 612×792 sheets are scaled down to the phone width; the print icon opens the
 *  browser's print dialog. */
export function PdfPreview({ kind }: { kind: 'report' | 'invoice' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: source, loading } = useAsync(() => (id ? fetchPdfSource(id) : Promise.resolve(null)), `pdf:${id ?? ''}`)
  const stackRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / PDF_WIDTH))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [source]) // the stack only mounts once the job has loaded

  if (loading) return null
  if (!source) return <Navigate to="/jobs" replace />

  // The invoice editor keeps unsaved edits in the draft store under the job id, so the
  // preview shows what is being edited rather than the stored rows.
  const edits = readDraft<InvoiceData | null>(`invoice.${source.job.id}`, null)
  const invoice = buildInvoiceData(source)
  const pages =
    kind === 'report'
      ? serviceReportPages(buildReportData(source))
      : invoicePages(edits ? { ...invoice, items: edits.items, taxRate: edits.taxRate, discount: edits.discount, description: edits.description } : invoice)
  const title = kind === 'report' ? `Service Report · ${source.job.work_order}` : `Invoice · ${source.job.work_order}`

  return (
    <CompanyContext.Provider value={source.company}>
      <div className="flex min-h-svh flex-col bg-surface-alt">
        <div className="print-hidden">
          <TopBar variant="child" title={title} onBack={() => navigate(-1)} action={<Printer size={24} strokeWidth={1.5} />} onAction={() => window.print()} />
        </div>
        <div className="pdf-stack flex flex-1 flex-col p-lg">
          <div ref={stackRef} className="flex w-full flex-col items-center gap-lg">
            {pages.map((page, i) => (
              <div key={i} className="pdf-scale shrink-0" style={{ width: PDF_WIDTH * scale, height: PDF_HEIGHT * scale }}>
                <PdfSheet style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>{page}</PdfSheet>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CompanyContext.Provider>
  )
}
