import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Figma: 00 · Login (166:8077) — full-bleed brand splash, shown briefly on cold start
 *  while session/auth state is checked (auth wiring lands with the Supabase backend).
 *
 *  Figma pins the logo and tagline with a fixed 412px gap between them, sized for the
 *  exact 844px canvas — reproduced here as a generous responsive gap instead, since a
 *  fixed pixel gap would either overflow or leave an odd void on any other screen height.
 *
 *  There's no real session to check yet, so this just times out to Login after a beat —
 *  once Supabase auth exists, this becomes "check session, then route to /login or /jobs". */
export function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login', { replace: true }), 1200)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="relative flex h-svh flex-col items-center justify-end gap-3xl overflow-hidden px-md pb-xl pt-11">
      <img src="/images/login-big-hero-bg.webp" srcSet="/images/login-big-hero-bg.webp 1x, /images/login-big-hero-bg@2x.webp 2x" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <img src="/brand/header-lockup-big.svg" alt="HAV'ARC Heating and Air" className="relative h-[122px] w-[172px]" />
      <p className="relative rounded-full bg-[var(--alpha-white-05)] px-lg py-[10px] text-caption text-inverse opacity-70">
        Getting the job done right the first time.
      </p>
    </div>
  )
}
