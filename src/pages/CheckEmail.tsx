import { ArrowLeft, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { resetPasswordRedirect, supabase } from '../lib/supabase'

const RESEND_SECONDS = 47

/** Figma: 01d · Check your email (100:2974). Real countdown — ticks down every second and
 *  the resend button becomes active at 0. Resend sends the recovery email again for the
 *  address carried over from the previous screen, then restarts the countdown. */
export function CheckEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [error, setError] = useState('')

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const resend = async () => {
    if (!email) return navigate('/forgot-password')
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetPasswordRedirect() })
    if (resetError) return setError(resetError.message)
    setSecondsLeft(RESEND_SECONDS)
  }

  return (
    <AuthLayout label="CHECK YOUR EMAIL">

      <div className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card">
        <div className="flex flex-col items-center gap-md">
          <div className="flex size-16 items-center justify-center rounded-full bg-selected">
            <Mail size={30} strokeWidth={1.5} className="text-link" />
          </div>
          <p className="text-center text-body text-ink">We sent a reset link to {email ?? 'your email'}. It expires in 1 hour.</p>
          <p className="text-center text-caption text-ink-faint">
            The link opens in your browser. After saving a new password, return to the HAV&apos;ARC app on your home screen.
          </p>
          {error && <p className="text-center text-caption text-danger">{error}</p>}
        </div>
        <div className="flex flex-col gap-md">
          <Button type="button" variant="primary" disabled={secondsLeft > 0} onClick={() => void resend()} className="w-full">
            {secondsLeft > 0 ? `Resend in 0:${secondsLeft.toString().padStart(2, '0')}` : 'Resend'}
          </Button>
          <Button type="button" variant="text" icon={<ArrowLeft size={16} strokeWidth={1.5} />} onClick={() => navigate('/login')}>
            Back to sign in
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}
