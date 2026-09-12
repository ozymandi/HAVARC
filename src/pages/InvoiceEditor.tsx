import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { InvoiceItemSheet } from '../components/InvoiceItemSheet'
import { LineItemRow, type LineItem } from '../components/LineItemRow'
import { Section } from '../components/Section'
import { SyncBanner } from '../components/SyncBanner'
import { TotalsRow } from '../components/TotalsRow'
import { TopBar } from '../components/TopBar'
import { useDraftState } from '../data/draft'
import { EMPTY_INVOICE, type InvoiceData } from '../data/invoice'
import { saveInvoice, useJob } from '../data/jobs'

const money = (n: number) => `$${n.toFixed(2)}`

// Prefixed and randomized (not a shared incrementing counter) so a freshly-added item's id
// can never collide with the hardcoded seed rows or with items added in an earlier visit
// within the same session — a plain module-level counter restarting at 1 did collide with
// the seed data's "item-1".."item-5" ids, causing a duplicate-key error.
const newId = () => `new-${crypto.randomUUID()}`

interface BillTo {
  customer: string
  address: string
  phone?: string
  invoiceNumber?: string
}

type Sheet = null | { mode: 'add' } | { mode: 'edit'; item: LineItem }

interface InvoiceEditorProps {
  workOrder: string
  billTo: BillTo
  value: InvoiceData
  onChange: (next: InvoiceData) => void
  onBack: () => void
  onSave: () => void
  /** Opens the PDF preview; absent while the job has no id yet (Step 4 draft). */
  onPreview?: () => void
}

/** Figma: 07 · Invoice Editor (100:4375). Controlled: the caller owns the invoice data, so
 *  the same screen serves both an existing job (route `/jobs/:id/invoice`, see
 *  `InvoiceEditorPage`) and the in-progress draft on Step 4, where it renders as an overlay
 *  so Step 4's own unsaved fields survive. Add/Edit item open the 07b/07c bottom sheets. */
export function InvoiceEditor({ workOrder, billTo, value, onChange, onBack, onSave, onPreview }: InvoiceEditorProps) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const { items, taxRate, discount, description } = value
  const patch = (next: Partial<InvoiceData>) => onChange({ ...value, ...next })

  const addItem = (item: Omit<LineItem, 'id'>) => patch({ items: [...items, { ...item, id: newId() }] })
  const updateItem = (id: string, item: Omit<LineItem, 'id'>) => patch({ items: items.map((i) => (i.id === id ? { ...item, id } : i)) })
  const removeItem = (id: string) => patch({ items: items.filter((i) => i.id !== id) })

  const subtotal = items.reduce((sum, i) => sum + (i.customerPaid ? 0 : i.qty * i.unitPrice), 0)
  const tax = subtotal * (taxRate / 100)
  const total = Math.max(0, subtotal + tax - discount)

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar variant="child" title={`Invoice · ${workOrder}`} onBack={onBack} />

      <div className="app-col flex flex-1 flex-col gap-lg p-lg">
        <Section label="BILL TO">
          <div className="flex w-full flex-col gap-2xs rounded-xs bg-canvas p-md text-caption">
            <div className="flex w-full gap-sm">
              <p className="w-24 shrink-0 text-label text-ink-faint">Customer</p>
              <p className="text-ink">{billTo.customer}</p>
            </div>
            <div className="flex w-full gap-sm">
              <p className="w-24 shrink-0 text-label text-ink-faint">Address</p>
              <p className="text-ink">{billTo.address}</p>
            </div>
            {billTo.phone && (
              <div className="flex w-full gap-sm">
                <p className="w-24 shrink-0 text-label text-ink-faint">Phone</p>
                <p className="text-ink">{billTo.phone}</p>
              </div>
            )}
            <div className="flex w-full gap-sm">
              <p className="w-24 shrink-0 text-label text-ink-faint">Invoice #</p>
              <p className="text-ink">{billTo.invoiceNumber ?? 'Draft'}</p>
            </div>
          </div>
        </Section>

        <div className="flex w-full flex-col gap-lg md:flex-row md:items-stretch">
        <Section label="LINE ITEMS" className="md:min-w-0 md:flex-1" cardClassName="md:flex md:flex-1 md:flex-col">
          <div className="flex w-full flex-1 flex-col gap-md p-md">
            {items.length > 0 && (
              <div className="flex w-full flex-col gap-2xs">
                {items.map((item) => (
                  <LineItemRow key={item.id} item={item} onEdit={() => setSheet({ mode: 'edit', item })} onDelete={() => removeItem(item.id)} />
                ))}
              </div>
            )}
            <div className="flex w-full md:mt-auto md:justify-end">
              <Button variant="secondary" icon={<Plus size={16} strokeWidth={1.5} />} className="w-full md:w-auto md:min-w-[200px]" onClick={() => setSheet({ mode: 'add' })}>
                Add item
              </Button>
            </div>
          </div>
        </Section>

        <Section label="TOTALS" className="md:min-w-0 md:flex-1" cardClassName="md:flex md:flex-1 md:flex-col">
          <div className="flex w-full flex-1 flex-col gap-md p-md">
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Tax rate %" type="number" value={taxRate} onChange={(e) => patch({ taxRate: Number(e.target.value) })} />
              <FormField className="min-w-0 flex-1" label="Discount $" type="number" value={discount} onChange={(e) => patch({ discount: Number(e.target.value) })} />
            </div>
            <div className="flex w-full flex-1 flex-col gap-2xs">
              <TotalsRow label="Subtotal" amount={money(subtotal)} />
              <TotalsRow label={`Tax (${taxRate.toFixed(2)}%)`} amount={money(tax)} />
              <TotalsRow label="Discount" amount={`−${money(discount)}`} />
              <div className="md:mt-auto md:pt-md">
                <TotalsRow label="TOTAL" amount={money(total)} emphasis="total" />
              </div>
            </div>
          </div>
        </Section>
        </div>

        <Section label="DESCRIPTION OF WORK">
          <div className="flex w-full flex-col gap-md p-md">
            <FormField
              label="Shown on invoice"
              type="textarea"
              value={description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Pre-filled from technician notes — edit freely"
            />
            <p className="text-caption text-ink-faint">Pre-filled from technician notes — edit freely</p>
          </div>
        </Section>
      </div>

      <div className="sticky bottom-0 w-full shrink-0 border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
        <div className="app-col flex gap-2xs md:justify-center">
        <Button variant="secondary" className="flex-1 md:min-w-[200px] md:flex-none" disabled={!onPreview} onClick={onPreview} title={onPreview ? undefined : "Available once the job is completed"}>
          Preview PDF
        </Button>
        <Button variant="primary" icon={<FileText size={16} strokeWidth={1.5} />} className="flex-1 md:min-w-[200px] md:flex-none" onClick={onSave}>
          Save invoice
        </Button>
        </div>
      </div>

      {sheet?.mode === 'add' && (
        <InvoiceItemSheet
          onClose={() => setSheet(null)}
          onSave={(item) => {
            addItem(item)
            setSheet(null)
          }}
        />
      )}
      {sheet?.mode === 'edit' && (
        <InvoiceItemSheet
          item={sheet.item}
          onClose={() => setSheet(null)}
          onSave={(item) => {
            updateItem(sheet.item.id, item)
            setSheet(null)
          }}
          onDelete={() => {
            removeItem(sheet.item.id)
            setSheet(null)
          }}
        />
      )}
    </div>
  )
}

/** Route `/jobs/:id/invoice` — reached from Job Detail's Invoice document row. Starts
 *  from the stored invoice; Save writes it back and returns to the job. */
export function InvoiceEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: job, loading } = useJob(id)
  const [saveFailed, setSaveFailed] = useState(false)

  // Kept in the draft store (keyed by job id) rather than component state so the PDF
  // preview route shows the edited items, not the stored rows.
  const [edits, setEdits] = useDraftState<InvoiceData | null>(`invoice.${id}`, null)

  if (loading) return null
  if (!job) return <Navigate to="/jobs" replace />
  const invoice = edits ?? job.invoice ?? EMPTY_INVOICE

  const save = async () => {
    setSaveFailed(false)
    try {
      await saveInvoice(job.id, invoice)
      setEdits(null)
      navigate(`/jobs/${job.id}`)
    } catch {
      setSaveFailed(true)
    }
  }

  return (
    <>
      {saveFailed && <SyncBanner state="error" message="Couldn't save the invoice — tap to retry" onRetry={() => void save()} />}
      <InvoiceEditor
        workOrder={job.workOrder}
        billTo={{ customer: job.customer, address: job.address, phone: job.phone, invoiceNumber: job.invoiceNumber }}
        value={invoice}
        onChange={setEdits}
        onBack={() => navigate(-1)}
        onSave={() => void save()}
        onPreview={() => navigate(`/jobs/${job.id}/invoice/pdf`)}
      />
    </>
  )
}
