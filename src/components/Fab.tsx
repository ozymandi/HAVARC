import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

/** Figma: FAB (30:10) — "Floating action button (New job). Size size/fab (56), fill
 *  color/bg/accent, stroke color/border/accent hairline, Shadow/FAB. Icon swappable." */
interface FabProps {
  icon?: ReactNode
  label: string
  onClick?: () => void
}

export function Fab({ icon, label, onClick }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-2xl right-xl flex size-[var(--size-fab)] items-center justify-center rounded-full border-[length:var(--stroke-hairline)] border-accent-line bg-accent text-inverse shadow-fab"
    >
      {icon ?? <Plus size={28} strokeWidth={1.5} />}
    </button>
  )
}
