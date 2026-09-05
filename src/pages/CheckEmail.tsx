import { ArrowLeft, FileText, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthHero } from '../components/AuthHero'
import { Button } from '../components/Button'

const RESEND_SECONDS = 47

/** Figma: 01d · Check your email (100:2974). Real countdown, not a static "0:47" label —
 *  ticks down every second and the resend button becomes active at 0. No backend to
 *  actually resend anything yet, so clicking it just restarts the countdown. */
export function CheckEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email || 'your email'

  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AuthHero />

      <div className="flex flex-1 flex-col justify-between gap-2xl px-lg py-3xl">
        <div className="flex flex-1 flex-col gap-lg">
          <p className="text-section text-brand">CHECK YOUR EMAIL</p>

          <div className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card">
            <div className="flex flex-col items-center gap-md">
              <div className="flex size-16 items-center justify-center rounded-full bg-selected">
                <Mail size={30} strokeWidth={1.5} className="text-link" />
              </div>
              <p className="text-center text-body text-ink">We sent a reset link to {email}. It expires in 1 hour.</p>
              <p className="text-center text-caption text-ink-faint">
                The link opens in your browser. After saving a new password, return to the HAV&apos;ARC app on your home screen.
              </p>
            </div>
            <div className="flex flex-col gap-md">
              <Button
                type="button"
                variant="primary"
                disabled={secondsLeft > 0}
                onClick={() => setSecondsLeft(RESEND_SECONDS)}
                className="w-full"
              >
                {secondsLeft > 0 ? `Resend in 0:${secondsLeft.toString().padStart(2, '0')}` : 'Resend'}
              </Button>
              <Button type="button" variant="text" icon={<ArrowLeft size={16} strokeWidth={1.5} />} onClick={() => navigate('/login')}>
                Back to sign in
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-md text-ink-faint">
          <FileText size={12} strokeWidth={1.5} className="opacity-30" />
          <span className="text-caption">HAV&apos;ARC app</span>
        </div>
      </div>
    </div>
  )
}
