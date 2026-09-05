import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Figma: Signature Pad (17:69) — "Canvas for customer / technician signature. Height =
 *  size/signature (155). Pair with a 'Clear' text button." Real freehand capture via
 *  Pointer Events (mouse + touch + pen in one API), not a placeholder. */
interface SignaturePadProps {
  onChange?: (dataUrl: string | null) => void
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  // Size the canvas's backing store for the container's actual pixel size (incl. DPR) once
  // mounted, so strokes stay crisp and coordinates line up with the pointer position.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#172530'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = e.currentTarget.getContext('2d')
    const { x, y } = point(e)
    ctx?.beginPath()
    ctx?.moveTo(x, y)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = e.currentTarget.getContext('2d')
    const { x, y } = point(e)
    ctx?.lineTo(x, y)
    ctx?.stroke()
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    setHasSignature(true)
    onChange?.(canvasRef.current?.toDataURL() ?? null)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange?.(null)
  }

  return (
    <div className="relative flex h-[155px] w-full flex-col justify-end gap-md overflow-hidden rounded-xs border border-line-subtle bg-surface py-md pl-lg pr-sm">
      {!hasSignature && <p className="text-caption text-ink-faint">Sign here</p>}
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="absolute inset-0 h-full w-full touch-none"
      />
      <div className="pointer-events-none h-px w-full border-t border-dashed border-line-dashed" />
      {hasSignature && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear signature"
          className="absolute right-[7px] top-[7px] flex size-8 items-center justify-center rounded-full bg-canvas"
        >
          <X size={18} strokeWidth={1.5} className="text-icon" />
        </button>
      )}
    </div>
  )
}
