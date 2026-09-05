import { ArrowLeft, FileText } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthHero } from '../components/AuthHero'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'

/** Figma: 01c · Reset password (100:2953). No auth backend yet, so "Send reset link"
 *  doesn't send anything — it just advances to the Check-your-email screen, carrying the
 *  entered email along via router state for that screen to display. */
export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AuthHero />

      <div className="flex flex-1 flex-col justify-between gap-2xl px-lg py-3xl">
        <div className="flex flex-1 flex-col gap-lg">
          <p className="text-section text-brand">RESET PASSWORD</p>

          <form
            noValidate
            className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card"
            onSubmit={(e) => {
              e.preventDefault()
              navigate('/forgot-password/check-email', { state: { email } })
            }}
          >
            <div className="flex flex-col gap-md">
              <p className="text-body text-ink-soft">Enter the email you use to sign in. We&apos;ll send a link to set a new password.</p>
              <FormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@havarc.com" required />
            </div>
            <div className="flex flex-col gap-md">
              <Button type="submit" variant="primary">
                Send reset link
              </Button>
              <Button type="button" variant="text" icon={<ArrowLeft size={16} strokeWidth={1.5} />} onClick={() => navigate('/login')}>
                Back to sign in
              </Button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-center gap-md text-ink-faint">
          <FileText size={12} strokeWidth={1.5} className="opacity-30" />
          <span className="text-caption">HAV&apos;ARC app</span>
        </div>
      </div>
    </div>
  )
}
