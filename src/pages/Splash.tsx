import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplashLogo } from '../components/SplashLogo'

/** Figma: 00 · Login (166:8077) — full-bleed brand splash, shown briefly on cold start
 *  while session/auth state is checked (auth wiring lands with the Supabase backend).
 *
 *  Logo is vertically centered (Figma's fixed 412px gap to the tagline was sized for its
 *  exact 844px canvas and reads as "pinned to the bottom" on other screen heights) and
 *  plays a one-shot intro (SplashLogo.tsx: petals draw + fill, then the two text rows rise
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
    <div className="relative flex h-svh flex-col items-center justify-center gap-3xl overflow-hidden px-md">
      <img src="/images/login-big-hero-bg.webp" srcSet="/images/login-big-hero-bg.webp 1x, /images/login-big-hero-bg@2x.webp 2x" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <SplashLogo />
      <p className="relative rounded-full bg-[var(--alpha-white-05)] px-lg py-[10px] text-caption text-inverse opacity-70">
        Getting the job done right the first time.
      </p>
    </div>
  )
}
