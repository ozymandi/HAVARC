import { ChevronRight, FileText, RefreshCw } from 'lucide-react'

interface DocumentRowProps {
  title: string
  meta: string
  /** Figma 08e: while the server renders, the chevron becomes a refresh glyph; the meta says why. */
  state?: 'pending' | 'error' | 'ready'
  onClick?: () => void
}

export function DocumentRow({ title, meta, state = 'ready', onClick }: DocumentRowProps) {
  return (
    <button type="button" onClick={onClick} className="flex h-[68px] w-full items-center gap-sm rounded-xs bg-canvas p-md text-left transition-colors hover:bg-selected">
      <FileText size={24} strokeWidth={1.5} className="shrink-0 text-icon" />
      <div className="flex min-w-0 flex-1 flex-col gap-2xs">
        <p className="truncate text-body-strong text-ink">{title}</p>
        <p className={`truncate text-caption ${state === 'pending' ? 'text-link' : state === 'error' ? 'text-danger' : 'text-ink-faint'}`}>{meta}</p>
      </div>
      {state === 'ready' ? (
        <ChevronRight size={20} strokeWidth={1.5} className="shrink-0 text-icon-soft" />
      ) : (
        <RefreshCw size={20} strokeWidth={1.5} className={`shrink-0 ${state === 'pending' ? 'animate-spin text-link' : 'text-danger'}`} />
      )}
    </button>
  )
}
