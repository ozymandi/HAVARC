import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { supabase } from '../lib/supabase'

/** Figma: 01e · Set new password (100:2997). Reached via the emailed recovery link, which
 *  lands here already signed in as that user (RequireAuth sends expired links to Login).
 *  Saving updates the password, then signs this browser out — the copy on 01d tells the
 *  user to go back to the installed app and sign in there with the new password. */
export function SetNewPassword() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const isValid = password.length >= 8 && /\d/.test(password)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return setError('Password must be at least 8 characters and include a number.')
    if (password !== confirm) return setError('Passwords do not match.')
    setError('')
    setServerError('')
    setBusy(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setBusy(false)
      return setServerError(updateError.message)
    }
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout label="SET NEW PASSWORD">

      <form className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card" onSubmit={submit}>
        <div className="flex flex-col gap-md">
          <p className="text-caption text-ink-faint">Signed in as {session?.user.email}</p>
          <FormField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error && !isValid ? error : undefined}
          />
          <FormField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={(error && isValid && password !== confirm ? error : undefined) || serverError || undefined}
          />
          <p className="text-caption text-ink-faint">At least 8 characters, including a number.</p>
        </div>
        <Button type="submit" variant="primary" disabled={busy}>
          Save password
        </Button>
      </form>
    </AuthLayout>
  )
}
