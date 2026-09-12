import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { resetPasswordRedirect, supabase } from '../lib/supabase'

/** Figma: 01c · Reset password (100:2953). Sends the Supabase recovery email; the link in
 *  it opens `/reset-password` with a session for that user (01e). Supabase deliberately
 *  answers the same way for unknown emails, so the next screen always says "we sent". */
export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const address = email.trim()
    if (!address) return setError('Enter your email.')
    setBusy(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: resetPasswordRedirect() })
    setBusy(false)
    if (resetError) return setError(resetError.message)
    navigate('/forgot-password/check-email', { state: { email: address } })
  }

  return (
    <AuthLayout label="RESET PASSWORD">

      <form noValidate className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card" onSubmit={submit}>
        <div className="flex flex-col gap-md">
          <p className="text-body text-ink-soft">Enter the email you use to sign in. We&apos;ll send a link to set a new password.</p>
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="owner@havarc.com"
            required
            error={error || undefined}
          />
        </div>
        <div className="flex flex-col gap-md">
          <Button type="submit" variant="primary" disabled={busy}>
            Send reset link
          </Button>
          <Button type="button" variant="text" icon={<ArrowLeft size={16} strokeWidth={1.5} />} onClick={() => navigate('/login')}>
            Back to sign in
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
