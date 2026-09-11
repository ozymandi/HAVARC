import type { ReactNode } from 'react'

/** Recurring pattern across Job Detail / Steps / Invoice: an uppercase section label
 *  above a white card (Card, 16:10 — no stroke, bg surface, radius/xs, Shadow/Card). */
interface SectionProps {
  label: string
  children: ReactNode
  padded?: boolean
  /** Extra classes on the wrapper — e.g. `md:flex-1` when two sections share a desktop row. */
  className?: string
  /** Extra classes on the card — e.g. `md:flex-1` so the card stretches to the row height. */
  cardClassName?: string
}

export function Section({ label, children, padded = true, className = '', cardClassName = '' }: SectionProps) {
  return (
    <div className={`flex w-full flex-col gap-sm ${className}`}>
      <p className="text-section text-brand">{label}</p>
      <div className={`w-full rounded-xs bg-surface shadow-card ${padded ? 'p-xs' : ''} ${cardClassName}`}>{children}</div>
    </div>
  )
}
