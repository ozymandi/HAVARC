import { X } from 'lucide-react'

interface PhotoLightboxProps {
  src: string | null
  onClose: () => void
}

/** Full-screen tap-to-view preview for a captured photo (Job Detail). */
export function PhotoLightbox({ src, onClose }: PhotoLightboxProps) {
  if (!src) return null
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/90" onClick={onClose}>
      <img src={src} alt="" className="max-h-full max-w-full object-contain" />
      <button type="button" onClick={onClose} aria-label="Close preview" className="absolute right-lg top-11 flex size-10 items-center justify-center rounded-full bg-black/40 text-inverse">
        <X size={24} strokeWidth={1.5} />
      </button>
    </div>
  )
}
