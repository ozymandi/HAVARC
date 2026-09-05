import type { LineItem } from '../components/LineItemRow'

/** Editable invoice contents (line items + totals inputs + description). Kept out of the
 *  editor's component file so Vite fast-refresh keeps working there (component-only exports). */
export interface InvoiceData {
  items: LineItem[]
  taxRate: number
  discount: number
  description: string
}

export const EMPTY_INVOICE: InvoiceData = { items: [], taxRate: 0, discount: 0, description: '' }
