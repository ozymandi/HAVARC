import { FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'

/** Figma: 01 · Login (100:2911), hero 100:2915. No auth backend yet, so submitting just
 *  goes to Jobs — not a real sign-in, but a working stub consistent with the rest of the
 *  app's "no backend" stand-ins (Step 4 Complete, Invoice save, etc.). */
export function Login() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <div className="relative flex h-[299px] shrink-0 flex-col items-center justify-end gap-5xl overflow-hidden brand-gradient px-md pb-xl pt-11">
        <img
          src="/images/login-hero-bg.webp"
          srcSet="/images/login-hero-bg.webp 1x, /images/login-hero-bg@2x.webp 2x"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <img src="/brand/header-lockup-big.svg" alt="HAV'ARC Heating and Air" className="relative h-[122px] w-[172px]" />
        <p className="relative rounded-full bg-[var(--alpha-white-05)] px-lg py-[10px] text-caption text-inverse opacity-70">
          Getting the job done right the first time.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2xl px-lg py-3xl">
        <div className="flex flex-1 flex-col gap-lg">
          <p className="text-section text-brand">SIGN IN</p>

          <form
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
              <Button type="button" variant="text">
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
