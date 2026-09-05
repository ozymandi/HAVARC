import { Plus, Trash2, User, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'
import { ChoiceChip } from './ChoiceChip'
import { FormField } from './FormField'
import type { LineItem } from './LineItemRow'

/** Figma: 07b · Invoice · Add item (100:4434) and 07c · Invoice · Edit item (100:4520) —
 *  "Bottom Sheet · Add item / Edit item" over a 40% black scrim, same shell as the other
 *  sheets (handle, title + X, body). Add has the QUICK ADD chip row and "Add to invoice";
 *  Edit drops the chips and gets "Save changes" + a text-style "Delete item".
 *
 *  Quick-add presets: Figma's hint is that a chip fills name + price from the rates in
 *  Settings, but Settings only has a labor rate today (and no shared store), so Labor uses
 *  that default; Refrigerant/Contactor use the sample invoice's prices; Capacitor and
 *  Service call have no known price anywhere in the design — they fill the name only and
 *  leave the price for the technician. Real rates land with the Settings backend. */
const QUICK_ADD: { label: string; unitPrice: number }[] = [
  { label: 'Labor', unitPrice: 80 },
  { label: 'Refrigerant', unitPrice: 115 },
  { label: 'Capacitor', unitPrice: 0 },
  { label: 'Contactor', unitPrice: 179 },
  { label: 'Service call', unitPrice: 0 },
]

const money = (n: number) => `$${n.toFixed(2)}`

interface InvoiceItemSheetProps {
  /** Present = Edit item (07c); absent = Add item (07b). */
  item?: LineItem
  onClose: () => void
  onSave: (item: Omit<LineItem, 'id'>) => void
  onDelete?: () => void
}

export function InvoiceItemSheet({ item, onClose, onSave, onDelete }: InvoiceItemSheetProps) {
  const editing = !!item
  const [description, setDescription] = useState(item?.description ?? '')
  const [qty, setQty] = useState(item ? String(item.qty) : '1')
  const [unitPrice, setUnitPrice] = useState(item ? item.unitPrice.toFixed(2) : '')
  const [customerPaid, setCustomerPaid] = useState(item?.customerPaid ?? false)

  const qtyValue = Number(qty) || 0
  const priceValue = Number(unitPrice) || 0
  const amount = customerPaid ? 0 : qtyValue * priceValue
  const canSave = description.trim().length > 0 && qtyValue > 0

  const quickAdd = (preset: (typeof QUICK_ADD)[number]) => {
    setDescription(preset.label)
    setQty('1')
    if (preset.unitPrice > 0) setUnitPrice(preset.unitPrice.toFixed(2))
  }

  const save = () => {
    if (!canSave) return
    onSave({ description: description.trim(), qty: qtyValue, unitPrice: priceValue, customerPaid })
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-lg bg-surface pb-3xl shadow-modal">
        <div className="flex w-full items-center justify-center py-sm">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        <div className="flex w-full items-center pb-sm pl-xl pr-md">
          <p className="flex-1 text-h2 text-ink">{editing ? 'Edit item' : 'Add item'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 shrink-0 items-center justify-center text-icon">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex w-full flex-col gap-lg px-lg pt-xs">
          {!editing && (
            <div className="flex w-full flex-col gap-sm">
              <p className="text-label text-ink-faint">QUICK ADD</p>
              <div className="flex w-full flex-wrap gap-2xs">
                {QUICK_ADD.map((preset) => (
                  <ChoiceChip key={preset.label} label={preset.label} hug selected={description === preset.label} onClick={() => quickAdd(preset)} />
                ))}
              </div>
            </div>
          )}

          <FormField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter value" />
          <div className="flex w-full gap-2xs">
            <FormField className="min-w-0 flex-1" label="Quantity" type="number" inputMode="decimal" min={0} step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
            <FormField
              className="min-w-0 flex-1"
              label="Unit price $"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex w-full items-center rounded-md bg-canvas p-md">
            <p className="flex-1 text-body text-ink-soft">Amount</p>
            <p className="text-body-strong text-ink">{money(amount)}</p>
          </div>

          <button
            type="button"
            onClick={() => setCustomerPaid((v) => !v)}
            aria-pressed={customerPaid}
            className="flex min-h-[60px] w-full items-center gap-md rounded-md bg-canvas px-xl py-md text-left"
          >
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-xs ${customerPaid ? 'bg-brand' : 'border-[1.5px] border-line-strong bg-surface'}`}>
              {customerPaid && <img src="/icons/check.svg" alt="" className="size-4" />}
            </span>
            <User size={22} strokeWidth={1.5} className="shrink-0 text-icon-soft" />
            <span className="flex min-w-0 flex-1 flex-col gap-2xs">
              <span className="text-body-strong text-ink">Customer paid</span>
              <span className="text-caption text-ink-faint">Shown on invoice, excluded from total</span>
            </span>
          </button>

          {editing ? (
            <>
              <Button variant="primary" className="w-full" disabled={!canSave} onClick={save}>
                Save changes
              </Button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-[var(--size-control)] w-full items-center justify-center gap-sm rounded-sm px-lg text-button text-danger active:bg-danger-soft"
              >
                <Trash2 size={16} strokeWidth={1.5} />
                <span>Delete item</span>
              </button>
            </>
          ) : (
            <Button variant="primary" icon={<Plus size={16} strokeWidth={1.5} />} className="w-full" disabled={!canSave} onClick={save}>
              Add to invoice
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
