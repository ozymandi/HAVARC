/** Figma: Totals Row (17:42) — "Subtotal / Tax / Discount rows (Regular) and the
 *  emphasized TOTAL row." */
interface TotalsRowProps {
  label: string
  amount: string
  emphasis?: 'regular' | 'total'
}

export function TotalsRow({ label, amount, emphasis = 'regular' }: TotalsRowProps) {
  if (emphasis === 'total') {
    return (
      <div className="flex h-11 w-full items-center gap-sm rounded-sm bg-brand p-md">
        <p className="flex-1 text-body text-inverse">{label}</p>
        <p className="text-h2 text-inverse">{amount}</p>
      </div>
    )
  }
  return (
    <div className="flex h-11 w-full items-center gap-sm rounded-sm px-md py-sm">
      <p className="flex-1 text-body text-ink-soft">{label}</p>
      <p className="text-body-strong text-ink">{amount}</p>
    </div>
  )
}
