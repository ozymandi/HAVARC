import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplashLogo } from '../components/SplashLogo'

/** Figma: 00 · Login (166:8077) — full-bleed brand splash, shown briefly on cold start
 *  while session/auth state is checked (auth wiring lands with the Supabase backend).
 *
 *  Layout follows the Figma frame: the logo is centered in the full screen height and the
 *  tagline pill sits at the bottom (flex-1 spacer + bottom padding instead of Figma's fixed
 *  412px gap, which only holds on its exact 844px canvas). The logo plays a one-shot intro (SplashLogo.tsx: petals draw + fill, then the two text rows rise
 *  in staggered) — the timeout below is long enough for that ~1.6s animation to finish
 *  before navigating away, longer than the old static 1200ms display.
 *
 *  There's no real session to check yet, so this just times out to Login after a beat —
 *  once Supabase auth exists, this becomes "check session, then route to /login or /jobs". */
export function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login', { replace: true }), 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="relative flex h-svh flex-col items-center overflow-hidden px-md pb-2xl">
      <img src="/images/login-big-hero-bg.webp" srcSet="/images/login-big-hero-bg.webp 1x, /images/login-big-hero-bg@2x.webp 2x" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative flex flex-1 items-center justify-center">
        <SplashLogo />
      </div>
      <p className="relative rounded-full bg-[var(--alpha-white-05)] px-lg py-[10px] text-caption text-inverse opacity-70">
        Getting the job done right the first time.
      </p>
    </div>
  )
}
