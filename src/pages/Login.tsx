import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { authUrlError, supabase } from '../lib/supabase'

/** Figma: 01 · Login (100:2911), hero 100:2915; 01b · Wrong password (100:2932) is the
 *  password field in its error state with the message below it. Supabase answers a wrong
 *  email and a wrong password with the same "Invalid login credentials", which is exactly
 *  what the design copy says. Anything else (offline, server down) shows the raw reason. */
export function Login() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/jobs" replace />

  // Reached from a reset link Supabase rejected (expired, or a newer request replaced it).
  const linkNotice = authUrlError
    ? authUrlError.code === 'otp_expired'
      ? 'That password reset link has expired or was already used. Request a new one below.'
      : authUrlError.description.replace(/\+/g, ' ') || 'That sign-in link is no longer valid.'
    : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (signInError) {
      setError(signInError.message.includes('Invalid login credentials') ? 'Incorrect email or password. Please try again.' : signInError.message)
      return
    }
    navigate('/jobs', { replace: true })
  }

  return (
    <AuthLayout label="SIGN IN">

      <form noValidate className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card" onSubmit={submit}>
        <div className="flex flex-col gap-md">
          {linkNotice && <p className="text-caption text-danger">{linkNotice}</p>}
          <FormField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@havarc.com" />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="••••••••••"
            error={error || undefined}
          />
        </div>
        <div className="flex flex-col gap-md">
          <Button type="submit" variant="primary" disabled={busy}>
            Sign in
          </Button>
          <Button type="button" variant="text" onClick={() => navigate('/forgot-password')}>
            Forgot password?
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
