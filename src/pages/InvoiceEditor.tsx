import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { LineItemRow, type LineItem } from '../components/LineItemRow'
import { Section } from '../components/Section'
import { TotalsRow } from '../components/TotalsRow'
import { MOCK_JOBS } from '../data/mockJobs'
import { TopBar } from '../components/TopBar'

const money = (n: number) => `$${n.toFixed(2)}`

// Prefixed and randomized (not a shared incrementing counter) so a freshly-added item's id
// can never collide with the hardcoded seed rows below or with items added in an earlier
// visit to this page within the same session — a plain module-level counter restarting at
// 1 did collide with the seed data's "item-1".."item-5" ids, causing a duplicate-key error.
const newLineItem = (): LineItem => ({ id: `new-${crypto.randomUUID()}`, description: '', qty: 1, unitPrice: 0, customerPaid: false })

/** Figma: 07 · Invoice Editor (100:4375). Reached from Job Detail's Invoice document row. */
export function InvoiceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = MOCK_JOBS.find((j) => j.id === id)

  const [items, setItems] = useState<LineItem[]>(() => [
    { id: 'item-1', description: 'Labor', qty: 3.5, unitPrice: 80, customerPaid: false },
    { id: 'item-2', description: 'Refrigerant', qty: 1, unitPrice: 115, customerPaid: false },
    { id: 'item-3', description: 'Contactor', qty: 1, unitPrice: 179, customerPaid: false },
    { id: 'item-4', description: 'Thermostat', qty: 1, unitPrice: 450, customerPaid: true },
    { id: 'item-5', description: 'Disconnect', qty: 1, unitPrice: 250, customerPaid: true },
  ])
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [description, setDescription] = useState('')

  if (!job) return <Navigate to="/jobs" replace />

  const updateItem = (updated: LineItem) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  const removeItem = (itemId: string) => setItems((prev) => prev.filter((i) => i.id !== itemId))
  const addItem = () => setItems((prev) => [...prev, newLineItem()])

  const subtotal = items.reduce((sum, i) => sum + (i.customerPaid ? 0 : i.qty * i.unitPrice), 0)
  const tax = subtotal * (taxRate / 100)
  const total = Math.max(0, subtotal + tax - discount)

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar variant="child" title={`Invoice · ${job.workOrder}`} onBack={() => navigate(-1)} />

      <div className="flex flex-1 flex-col gap-lg p-lg">
        <Section label="BILL TO">
          <div className="flex w-full flex-col gap-2xs rounded-xs bg-canvas p-md text-caption">
            <div className="flex w-full gap-sm">
              <p className="w-24 shrink-0 text-label text-ink-faint">Customer</p>
              <p className="text-ink">{job.customer}</p>
            </div>
            <div className="flex w-full gap-sm">
              <p className="w-24 shrink-0 text-label text-ink-faint">Address</p>
              <p className="text-ink">{job.address}</p>
            </div>
            {job.phone && (
              <div className="flex w-full gap-sm">
                <p className="w-24 shrink-0 text-label text-ink-faint">Phone</p>
                <p className="text-ink">{job.phone}</p>
              </div>
            )}
            <div className="flex w-full gap-sm">
              <p className="w-24 shrink-0 text-label text-ink-faint">Invoice #</p>
              <p className="text-ink">{job.invoiceNumber ?? 'Draft'}</p>
            </div>
          </div>
        </Section>

        <Section label="LINE ITEMS">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full flex-col gap-2xs">
              {items.map((item) => (
                <LineItemRow key={item.id} item={item} onChange={updateItem} onDelete={() => removeItem(item.id)} />
              ))}
            </div>
            <Button variant="secondary" icon={<Plus size={16} strokeWidth={1.5} />} className="w-full" onClick={addItem}>
              Add item
            </Button>
          </div>
        </Section>

        <Section label="TOTALS">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full gap-2xs">
              <FormField
                className="min-w-0 flex-1"
                label="Tax rate %"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              />
              <FormField
                className="min-w-0 flex-1"
                label="Discount $"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pre-filled from technician notes — edit freely"
            />
            <p className="text-caption text-ink-faint">Pre-filled from technician notes — edit freely</p>
          </div>
        </Section>
      </div>

      <div className="flex w-full shrink-0 gap-2xs border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
        <Button variant="secondary" className="flex-1" disabled title="PDF rendering is server-side work, not built yet">
          Preview PDF
        </Button>
        <Button variant="primary" icon={<FileText size={16} strokeWidth={1.5} />} className="flex-1" onClick={() => navigate(`/jobs/${job.id}`)}>
          Save invoice
        </Button>
      </div>
    </div>
  )
}
