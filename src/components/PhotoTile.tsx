import { Camera, Image, X } from 'lucide-react'

/** Figma: Photo Tile (17:60) — "Photo grid cell (3 per row). Add = dashed camera tile;
 *  Filled = thumbnail with remove button." No real photo captured yet in this project's
 *  data, so the "filled" state is a placeholder icon, not a real thumbnail. */
interface FilledPhotoTileProps {
  src?: string
  onRemove?: () => void
}

export function PhotoTile({ src, onRemove }: FilledPhotoTileProps) {
  return (
    <div className="relative flex h-[104px] flex-1 items-center justify-center rounded-xs bg-canvas p-md">
      {src ? (
        <img src={src} alt="" className="absolute inset-0 h-full w-full rounded-xs object-cover" />
      ) : (
        <Image size={32} strokeWidth={1.5} className="text-icon opacity-20" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute right-1 top-1 flex items-center rounded-full bg-brand p-2xs text-inverse"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

export function AddPhotoTile({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[104px] flex-1 flex-col items-center justify-center gap-xs rounded-xs border-[length:var(--stroke-hairline)] border-dashed border-line-dashed bg-surface p-md text-brand"
    >
      <Camera size={24} strokeWidth={1.5} />
      <p className="text-label">Add photo</p>
    </button>
  )
}
