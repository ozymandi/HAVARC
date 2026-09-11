import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'

/** Figma: 01e · Set new password (100:2997). Reached in real life via the emailed reset
 *  link (a token-bearing URL, not app navigation) — no auth backend yet to issue or verify
 *  that token, so this route is only reachable directly for now. Validation is real. */
export function SetNewPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const isValid = password.length >= 8 && /\d/.test(password)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return setError('Password must be at least 8 characters and include a number.')
    if (password !== confirm) return setError('Passwords do not match.')
    setError('')
    navigate('/login')
  }

  return (
    <AuthLayout label="SET NEW PASSWORD">

      <form className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card" onSubmit={submit}>
        <div className="flex flex-col gap-md">
          <p className="text-caption text-ink-faint">Signed in as owner@havarc.com</p>
          <FormField
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error && !isValid ? error : undefined}
          />
          <FormField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={error && isValid && password !== confirm ? error : undefined}
          />
          <p className="text-caption text-ink-faint">At least 8 characters, including a number.</p>
        </div>
        <Button type="submit" variant="primary">
          Save password
        </Button>
      </form>
    </AuthLayout>
  )
}
