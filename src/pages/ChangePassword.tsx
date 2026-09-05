import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { TopBar } from '../components/TopBar'

/** Figma: 09b · Settings · Change password (100:4645). Client-side validation only — no
 *  auth backend yet to actually verify the current password or rotate the session. */
export function ChangePassword() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const isValidNew = next.length >= 8 && /\d/.test(next)

  const submit = () => {
    if (!current) return setError('Enter your current password.')
    if (!isValidNew) return setError('New password must be at least 8 characters and include a number.')
    if (next !== confirm) return setError('New password and confirmation do not match.')
    setError('')
    navigate('/settings')
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar variant="child" title="Change password" onBack={() => navigate(-1)} />

      <div className="flex flex-1 flex-col gap-lg p-lg">
        <Section label="PASSWORD">
          <div className="flex w-full flex-col gap-md p-md">
            <p className="text-caption text-ink-faint">Signed in as owner@havarc.com</p>
            <FormField label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} error={error && !current ? error : undefined} />
            <FormField
              label="New password"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              error={error && current && !isValidNew ? error : undefined}
            />
            <FormField
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={error && current && isValidNew && next !== confirm ? error : undefined}
            />
            <p className="text-caption text-ink-faint">
              At least 8 characters, including a number. You stay signed in on this device; other devices will need to sign in again.
            </p>
            <Button variant="primary" className="w-full" onClick={submit}>
              Update password
            </Button>
            <Button variant="text" className="w-full">
              Forgot current password?
            </Button>
          </div>
        </Section>
      </div>
    </div>
  )
}
