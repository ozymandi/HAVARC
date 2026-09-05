import { Info } from 'lucide-react'

/** Figma: "customer-notes" (218:4685) — per-customer access notes, auto-filled from the
 *  customer record. Shown on Job Detail and in the Service Report PDF, never the Invoice. */
export function CustomerNotesCallout({ notes }: { notes: string }) {
  return (
    <div className="flex w-full items-start gap-sm rounded-xs bg-warning-soft p-md">
      <Info size={18} strokeWidth={1.5} className="mt-[1px] shrink-0 text-accent-ink" />
      <div className="flex flex-1 flex-col gap-2xs">
        <p className="text-label text-accent-ink">CUSTOMER NOTES</p>
        <p className="text-caption text-ink">{notes}</p>
      </div>
    </div>
  )
}
