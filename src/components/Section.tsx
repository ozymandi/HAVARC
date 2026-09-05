import type { ReactNode } from 'react'

/** Recurring pattern across Job Detail / Steps / Invoice: an uppercase section label
 *  above a white card (Card, 16:10 — no stroke, bg surface, radius/xs, Shadow/Card). */
interface SectionProps {
  label: string
  children: ReactNode
  padded?: boolean
}

export function Section({ label, children, padded = true }: SectionProps) {
  return (
    <div className="flex w-full flex-col gap-sm">
      <p className="text-section text-brand">{label}</p>
      <div className={`w-full rounded-xs bg-surface shadow-card ${padded ? 'p-xs' : ''}`}>{children}</div>
    </div>
  )
}
