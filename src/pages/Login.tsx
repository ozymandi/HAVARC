import { FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthHero } from '../components/AuthHero'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'

/** Figma: 01 · Login (100:2911), hero 100:2915. No auth backend yet, so submitting just
 *  goes to Jobs — not a real sign-in, but a working stub consistent with the rest of the
 *  app's "no backend" stand-ins (Step 4 Complete, Invoice save, etc.). */
export function Login() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AuthHero />

      <div className="flex flex-1 flex-col justify-between gap-2xl px-lg py-3xl">
        <div className="flex flex-1 flex-col gap-lg">
          <p className="text-section text-brand">SIGN IN</p>

          <form
            noValidate
            className="flex flex-col gap-2xl rounded-xs bg-surface p-md shadow-card"
            onSubmit={(e) => {
              e.preventDefault()
              navigate('/jobs')
            }}
          >
            <div className="flex flex-col gap-md">
              <FormField label="Email" type="email" placeholder="owner@havarc.com" />
              <FormField label="Password" type="password" placeholder="••••••••••" />
            </div>
            <div className="flex flex-col gap-md">
              <Button type="submit" variant="primary">
                Sign in
              </Button>
              <Button type="button" variant="text" onClick={() => navigate('/forgot-password')}>
                Forgot password?
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
