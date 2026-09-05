import { Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { readDraft } from '../data/draft'
import { EMPTY_INVOICE, type InvoiceData } from '../data/invoice'
import { MOCK_JOBS } from '../data/mockJobs'
import { invoiceForJob, reportForJob, SAMPLE_INVOICE_ITEMS } from '../data/sampleReport'
import { invoicePages } from '../pdf/InvoicePdf'
import { PDF_HEIGHT, PDF_WIDTH, PdfSheet } from '../pdf/primitives'
import { serviceReportPages } from '../pdf/ServiceReport'

/** In-app preview of the PDF templates (routes `/jobs/:id/report` and `/jobs/:id/invoice/pdf`).
 *  The 612×792 sheets are scaled down to the phone width on screen; the print icon opens the
 *  browser's print dialog where "Save as PDF" produces the real US Letter document (print
 *  CSS in index.css). Server-side generation will render these same components. */
export function PdfPreview({ kind }: { kind: 'report' | 'invoice' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = MOCK_JOBS.find((j) => j.id === id)
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
  }, [])

  if (!job) return <Navigate to="/jobs" replace />

  // The invoice editor keeps its edits in the draft store under the job id, so the preview
  // shows what was just edited rather than the seed rows.
  const invoice = readDraft<InvoiceData>(`invoice.${job.id}`, { ...EMPTY_INVOICE, items: SAMPLE_INVOICE_ITEMS })
  const pages = kind === 'report' ? serviceReportPages(reportForJob(job)) : invoicePages(invoiceForJob(job, invoice))
  const title = kind === 'report' ? `Service Report · ${job.workOrder}` : `Invoice · ${job.workOrder}`

  return (
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
  )
}
