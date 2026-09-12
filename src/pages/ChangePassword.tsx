import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { TopBar } from '../components/TopBar'
import { resetPasswordRedirect, supabase } from '../lib/supabase'

/** Figma: 09b · Settings · Change password (100:4645). Supabase has no "verify current
 *  password" call, so the current password is checked by signing in with it again (same
 *  user, so the session just refreshes), then the new one is saved. "Forgot current
 *  password?" sends the recovery email to the signed-in address. */
export function ChangePassword() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const email = session?.user.email ?? ''
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isValidNew = next.length >= 8 && /\d/.test(next)

  const submit = async () => {
    if (!current) return setError('Enter your current password.')
    if (!isValidNew) return setError('New password must be at least 8 characters and include a number.')
    if (next !== confirm) return setError('New password and confirmation do not match.')
    setError('')
    setBusy(true)
    const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: current })
    if (checkError) {
      setBusy(false)
      setCurrent('')
      return setError('Current password is incorrect.')
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: next })
    setBusy(false)
    if (updateError) return setError(updateError.message)
    navigate('/settings')
  }

  const forgot = async () => {
    setBusy(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetPasswordRedirect() })
    setBusy(false)
    if (resetError) return setError(resetError.message)
    navigate('/forgot-password/check-email', { state: { email } })
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar variant="child" title="Change password" onBack={() => navigate(-1)} />

      <div className="app-col flex flex-1 flex-col gap-lg p-lg">
        <Section label="PASSWORD">
          <div className="flex w-full flex-col gap-md p-md">
            <p className="text-caption text-ink-faint">Signed in as {email}</p>
            <FormField
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              error={error && !current ? error : undefined}
            />
            <FormField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              error={error && current && !isValidNew ? error : undefined}
            />
            <FormField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={error && current && isValidNew ? error : undefined}
            />
            <p className="text-caption text-ink-faint">
              At least 8 characters, including a number. You stay signed in on this device; other devices will need to sign in again.
            </p>
            <Button variant="primary" className="w-full" disabled={busy} onClick={() => void submit()}>
              Update password
            </Button>
            <Button variant="text" className="w-full" disabled={busy} onClick={() => void forgot()}>
              Forgot current password?
            </Button>
          </div>
        </Section>
      </div>
    </div>
  )
}
