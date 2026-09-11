import { Camera, Image, X } from 'lucide-react'

/** Figma: Photo Tile (17:60) — "Photo grid cell (3 per row). Add = dashed camera tile;
 *  Filled = thumbnail with remove button." No real photo captured yet in this project's
 *  data, so the "filled" state is a placeholder icon, not a real thumbnail. */
interface FilledPhotoTileProps {
  src?: string
  onRemove?: () => void
  onView?: () => void
}

/** `onRemove` is only passed while creating/editing a job (Step 4) — a completed, read-only
 *  Job Detail passes neither, so the remove button doesn't render there at all. `onView`
 *  opens a bigger preview (e.g. Job Detail tapping a captured photo). */
export function PhotoTile({ src, onRemove, onView }: FilledPhotoTileProps) {
  return (
    <div className="relative h-[104px] flex-1 md:aspect-square md:h-auto md:flex-none md:basis-[calc((100%-16px)/3)]">
      <button
        type="button"
        onClick={onView}
        disabled={!onView}
        className="flex h-full w-full items-center justify-center rounded-xs bg-canvas p-md disabled:cursor-default"
      >
        {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full rounded-xs object-cover" /> : <Image size={32} strokeWidth={1.5} className="text-icon opacity-20" />}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute right-1 top-1 flex items-center rounded-full bg-brand p-2xs text-inverse"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}

export function AddPhotoTile({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[104px] flex-1 flex-col items-center justify-center gap-xs rounded-xs border-[length:var(--stroke-hairline)] border-dashed border-line-dashed bg-surface p-md text-brand md:aspect-square md:h-auto md:flex-none md:basis-[calc((100%-16px)/3)]"
    >
      <Camera size={24} strokeWidth={1.5} />
      <p className="text-label">Add photo</p>
    </button>
  )
}
