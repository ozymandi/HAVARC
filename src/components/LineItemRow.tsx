import { Trash2 } from 'lucide-react'

/** Figma: Line Item (17:35) — "Invoice editor row: description + amount, qty × unit price,
 *  delete. Customer Paid shows price but $0.00 amount (excluded from totals)."
 *
 *  Description/qty/price are real inline-editable fields (borderless until focus, so it
 *  still reads like the static Figma row at rest) rather than a separate view/edit mode or
 *  a dedicated "Edit item" screen — one row does both jobs. */
export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
  customerPaid: boolean
}

interface LineItemRowProps {
  item: LineItem
  onChange: (item: LineItem) => void
  onDelete: () => void
}

const money = (n: number) => `$${n.toFixed(2)}`

export function LineItemRow({ item, onChange, onDelete }: LineItemRowProps) {
  const amount = item.customerPaid ? 0 : item.qty * item.unitPrice
  const set = <K extends keyof LineItem>(key: K, v: LineItem[K]) => onChange({ ...item, [key]: v })

  return (
    <div className="flex w-full flex-col gap-md rounded-xs border border-line-subtle bg-surface py-md pl-lg pr-sm shadow-card">
      <div className="flex w-full items-center gap-sm">
        <input
          value={item.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Description"
          className={`min-w-0 flex-1 border-0 bg-transparent text-body-strong focus:outline-none ${item.customerPaid ? 'text-ink' : 'text-ink'}`}
        />
        <p className={`shrink-0 text-body-strong ${item.customerPaid ? 'text-ink-faint' : 'text-ink'}`}>{money(amount)}</p>
      </div>
      <div className="flex w-full items-center gap-sm">
        <div className="flex min-w-0 flex-1 items-center gap-2xs text-caption text-ink-faint">
          <input
            type="number"
            value={item.qty}
            onChange={(e) => set('qty', Number(e.target.value))}
            className="w-10 border-0 bg-transparent text-caption text-ink-faint focus:outline-none"
          />
          <span>×</span>
          <span>$</span>
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => set('unitPrice', Number(e.target.value))}
            className="w-16 border-0 bg-transparent text-caption text-ink-faint focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => set('customerPaid', !item.customerPaid)}
          className={`shrink-0 rounded-full px-sm py-2xs text-label ${item.customerPaid ? 'bg-warning-soft text-warning' : 'text-ink-faint'}`}
        >
          Customer Paid
        </button>
        <button type="button" onClick={onDelete} aria-label="Delete item" className="shrink-0 text-icon-soft">
          <Trash2 size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
