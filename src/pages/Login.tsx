import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'

/** Figma: 01 · Login (100:2911), hero 100:2915. No auth backend yet, so submitting just
 *  goes to Jobs — not a real sign-in, but a working stub consistent with the rest of the
 *  app's "no backend" stand-ins (Step 4 Complete, Invoice save, etc.). */
export function Login() {
  const navigate = useNavigate()

  return (
    <AuthLayout label="SIGN IN">

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
    </AuthLayout>
  )
}
