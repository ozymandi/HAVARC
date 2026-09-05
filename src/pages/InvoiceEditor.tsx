import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { InvoiceItemSheet } from '../components/InvoiceItemSheet'
import { LineItemRow, type LineItem } from '../components/LineItemRow'
import { Section } from '../components/Section'
import { TotalsRow } from '../components/TotalsRow'
import { TopBar } from '../components/TopBar'
import { EMPTY_INVOICE, type InvoiceData } from '../data/invoice'
import { MOCK_JOBS } from '../data/mockJobs'

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
}

/** Figma: 07 · Invoice Editor (100:4375). Controlled: the caller owns the invoice data, so
 *  the same screen serves both an existing job (route `/jobs/:id/invoice`, see
 *  `InvoiceEditorPage`) and the in-progress draft on Step 4, where it renders as an overlay
 *  so Step 4's own unsaved fields survive. Add/Edit item open the 07b/07c bottom sheets. */
export function InvoiceEditor({ workOrder, billTo, value, onChange, onBack, onSave }: InvoiceEditorProps) {
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

      <div className="flex flex-1 flex-col gap-lg p-lg">
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

        <Section label="LINE ITEMS">
          <div className="flex w-full flex-col gap-md p-md">
            {items.length > 0 && (
              <div className="flex w-full flex-col gap-2xs">
                {items.map((item) => (
                  <LineItemRow key={item.id} item={item} onEdit={() => setSheet({ mode: 'edit', item })} onDelete={() => removeItem(item.id)} />
                ))}
              </div>
            )}
            <Button variant="secondary" icon={<Plus size={16} strokeWidth={1.5} />} className="w-full" onClick={() => setSheet({ mode: 'add' })}>
              Add item
            </Button>
          </div>
        </Section>

        <Section label="TOTALS">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Tax rate %" type="number" value={taxRate} onChange={(e) => patch({ taxRate: Number(e.target.value) })} />
              <FormField className="min-w-0 flex-1" label="Discount $" type="number" value={discount} onChange={(e) => patch({ discount: Number(e.target.value) })} />
            </div>
            <div className="flex w-full flex-col gap-2xs">
              <TotalsRow label="Subtotal" amount={money(subtotal)} />
              <TotalsRow label={`Tax (${taxRate.toFixed(2)}%)`} amount={money(tax)} />
              <TotalsRow label="Discount" amount={`−${money(discount)}`} />
              <TotalsRow label="TOTAL" amount={money(total)} emphasis="total" />
            </div>
          </div>
        </Section>

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

      <div className="sticky bottom-0 flex w-full shrink-0 gap-2xs border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
        <Button variant="secondary" className="flex-1" disabled title="PDF rendering is server-side work, not built yet">
          Preview PDF
        </Button>
        <Button variant="primary" icon={<FileText size={16} strokeWidth={1.5} />} className="flex-1" onClick={onSave}>
          Save invoice
        </Button>
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

/** Route `/jobs/:id/invoice` — reached from Job Detail's Invoice document row. The seed
 *  line items are the Figma sample invoice; a real job's items come from the backend. */
export function InvoiceEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = MOCK_JOBS.find((j) => j.id === id)

  const [invoice, setInvoice] = useState<InvoiceData>(() => ({
    ...EMPTY_INVOICE,
    items: [
      { id: 'item-1', description: 'Labor', qty: 3.5, unitPrice: 80, customerPaid: false },
      { id: 'item-2', description: 'Refrigerant', qty: 1, unitPrice: 115, customerPaid: false },
      { id: 'item-3', description: 'Contactor', qty: 1, unitPrice: 179, customerPaid: false },
      { id: 'item-4', description: 'Thermostat', qty: 1, unitPrice: 450, customerPaid: true },
      { id: 'item-5', description: 'Disconnect', qty: 1, unitPrice: 250, customerPaid: true },
    ],
  }))

  if (!job) return <Navigate to="/jobs" replace />

  return (
    <InvoiceEditor
      workOrder={job.workOrder}
      billTo={{ customer: job.customer, address: job.address, phone: job.phone, invoiceNumber: job.invoiceNumber }}
      value={invoice}
      onChange={setInvoice}
      onBack={() => navigate(-1)}
      onSave={() => navigate(`/jobs/${job.id}`)}
    />
  )
}
