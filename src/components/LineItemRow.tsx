import { Trash2 } from 'lucide-react'
import type { KeyboardEvent, MouseEvent } from 'react'

/** Figma: Line Item (17:35) — "Invoice editor row: description + amount, qty × unit price,
 *  delete. Customer Paid shows price but $0.00 amount (excluded from totals)."
 *
 *  Read-only row, exactly as the Figma component: tapping it opens the Edit item sheet
 *  (07c), the trash icon deletes in place. Earlier this row had inline-editable inputs
 *  instead of the sheet — that was a code-side shortcut, not the design. */
export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
  customerPaid: boolean
}

interface LineItemRowProps {
  item: LineItem
  onEdit: () => void
  onDelete: () => void
}

const money = (n: number) => `$${n.toFixed(2)}`

export function LineItemRow({ item, onEdit, onDelete }: LineItemRowProps) {
  const amount = item.customerPaid ? 0 : item.qty * item.unitPrice

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEdit()
    }
  }
  const remove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={onKeyDown}
      className="flex w-full cursor-pointer flex-col gap-md rounded-xs border border-line-subtle bg-surface py-md pl-lg pr-sm text-left shadow-card transition-colors hover:bg-selected"
    >
      <div className="flex w-full items-center gap-sm">
        <p className="min-w-0 flex-1 truncate text-body-strong text-ink">{item.description}</p>
        <p className={`shrink-0 text-body-strong ${item.customerPaid ? 'text-ink-faint' : 'text-ink'}`}>{money(amount)}</p>
      </div>
      <div className="flex w-full items-center gap-sm">
        <p className="min-w-0 flex-1 text-caption text-ink-faint">
          {item.qty} × {money(item.unitPrice)}
        </p>
        {item.customerPaid && <span className="shrink-0 rounded-full bg-warning-soft px-sm py-2xs text-label text-warning">Customer Paid</span>}
        <button type="button" onClick={remove} aria-label="Delete item" className="shrink-0 text-icon-soft">
          <Trash2 size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
