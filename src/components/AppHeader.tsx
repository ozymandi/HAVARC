import { X } from 'lucide-react'

/** Figma: App Header (18:38) — "Step header: exit (X) → leaves the form to Jobs (draft
 *  autosaved), step Title, 'n of 4' chip, progress bar." Used on all 4 creation steps. */
interface AppHeaderProps {
  step: 1 | 2 | 3 | 4
  title: string
  onExit: () => void
}

export function AppHeader({ step, title, onExit }: AppHeaderProps) {
  return (
    <div className="sticky top-0 z-[5] flex w-full shrink-0 flex-col gap-md overflow-hidden brand-gradient px-lg pb-md pt-14">
      <img src="/images/header_tall.webp" srcSet="/images/header_tall.webp 1x, /images/header_tall@2x.webp 2x" alt="" className="absolute inset-0 h-full w-full object-cover" />

      <div className="relative flex w-full items-center gap-md">
        <button type="button" onClick={onExit} aria-label="Exit" className="flex size-10 shrink-0 items-center justify-center text-inverse">
          <X size={24} strokeWidth={1.5} />
        </button>
        <p className="flex-1 text-center text-h2 text-inverse opacity-80">{title}</p>
        <span className="shrink-0 rounded-full border-[length:var(--stroke-hairline)] border-[var(--alpha-white-07)] bg-[var(--alpha-white-15)] px-md py-xs text-chip text-inverse">
          {step} of 4
        </span>
      </div>

      <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-[var(--alpha-white-20)]">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
    </div>
  )
}
