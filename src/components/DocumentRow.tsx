import { ChevronRight, FileText } from 'lucide-react'

interface DocumentRowProps {
  title: string
  meta: string
  onClick?: () => void
}

export function DocumentRow({ title, meta, onClick }: DocumentRowProps) {
  return (
    <button type="button" onClick={onClick} className="flex h-[68px] w-full items-center gap-sm rounded-xs bg-canvas p-md text-left transition-colors hover:bg-selected">
      <FileText size={24} strokeWidth={1.5} className="shrink-0 text-icon" />
      <div className="flex min-w-0 flex-1 flex-col gap-2xs">
        <p className="truncate text-body-strong text-ink">{title}</p>
        <p className="truncate text-caption text-ink-faint">{meta}</p>
      </div>
      <ChevronRight size={20} strokeWidth={1.5} className="shrink-0 text-icon-soft" />
    </button>
  )
}
