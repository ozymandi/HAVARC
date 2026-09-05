import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { TopBar } from './TopBar'

/** Figma: 06d · Step 4 · Customer signature (100:4271) — signing gets its own full-screen
 *  portrait page, not a small inline box (a 155px pad is too small to sign comfortably).
 *
 *  Rendered as a fixed full-screen overlay from within Step 4 rather than a real route:
 *  Step 4's other fields (status, photos, customer name, the other signature) live in that
 *  same component's local state, and there's no shared draft-job store yet (deferred to the
 *  Supabase milestone) — a real navigation away and back would unmount Step 4 and lose all
 *  of it. This gets the same dedicated full-screen signing experience without that loss. */
interface SignatureCaptureProps {
  title: string
  instructions: string
  onDone: (dataUrl: string) => void
  onCancel: () => void
}

export function SignatureCapture({ title, instructions, onDone, onCancel }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

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
    ctx.lineWidth = 2.5
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
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-canvas">
      <TopBar variant="child" title={title} onBack={onCancel} />

      <div className="flex flex-1 flex-col gap-md p-lg">
        <p className="text-body text-ink-soft">{instructions}</p>

        <div className="relative flex flex-1 flex-col justify-end overflow-hidden rounded-lg border-[1.5px] border-line-strong bg-surface">
          {!hasSignature && <p className="pointer-events-none absolute bottom-14 w-full text-center text-caption text-ink-faint">Sign here</p>}
          <canvas ref={canvasRef} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} className="absolute inset-0 h-full w-full touch-none" />
          <div className="pointer-events-none mx-6 mb-10 h-px border-t border-dashed border-line-dashed" />
        </div>

        <p className="text-caption text-ink-faint">
          {hasSignature ? `Captured ${new Date().toLocaleDateString('en-US')} · ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · saved with the service report` : ' '}
        </p>
      </div>

      <div className="flex w-full shrink-0 gap-2xs border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
        <Button variant="secondary" className="flex-1" onClick={clear}>
          Clear
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!hasSignature}
          onClick={() => {
            const dataUrl = canvasRef.current?.toDataURL()
            if (dataUrl) onDone(dataUrl)
          }}
        >
          Done
        </Button>
      </div>
    </div>
  )
}
