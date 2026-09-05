import { Pencil, Trash2 } from 'lucide-react'

/** Figma: Action Menu (71:2182) — "Anchored overflow menu (⋯). Rows: icon + label;
 *  destructive row in danger color." Used from Job Detail's "more" button (08c). */
interface ActionMenuProps {
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

export function ActionMenu({ onEdit, onDelete, onClose }: ActionMenuProps) {
  return (
    <>
      <button type="button" aria-label="Close menu" className="brand-gradient fixed inset-0 z-20 opacity-[85%]" onClick={onClose} />
      <div className="fixed right-lg top-[92px] z-20 flex w-52 flex-col rounded-md bg-surface py-xs shadow-modal">
        <button type="button" onClick={onEdit} className="flex min-h-11 w-full items-center gap-md px-lg text-left">
          <Pencil size={20} strokeWidth={1.5} className="text-icon" />
          <span className="text-body-strong text-ink">Edit job</span>
        </button>
        <button type="button" onClick={onDelete} className="flex min-h-11 w-full items-center gap-md px-lg text-left">
          <Trash2 size={20} strokeWidth={1.5} className="text-danger" />
          <span className="text-body-strong text-danger">Delete job</span>
        </button>
      </div>
    </>
  )
}
