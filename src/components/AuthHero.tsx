/** Shared hero used by Login and the forgot-password chain (01 Login 100:2911, 01c Reset
 *  password 100:2953, 01d Check your email 100:2974, 01e Set new password 100:2997) —
 *  identical on all four, just factored out instead of copy-pasted a fourth time. */
export function AuthHero() {
  return (
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
  )
}
