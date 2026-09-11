/** Shared hero used by Login and the forgot-password chain (01 Login 100:2911, 01c Reset
 *  password 100:2953, 01d Check your email 100:2974, 01e Set new password 100:2997) —
 *  identical on all four, just factored out instead of copy-pasted a fourth time.
 *
 *  Desktop (01 · Login 320:9916): the hero becomes the left half of a 50/50 split, full
 *  viewport height, lockup at the top (120px down) and the tagline pinned to the bottom.
 *  The phone hero image (390×299) is swapped for the desktop half-hero export (720×1024). */
export function AuthHero() {
  return (
    <div className="relative flex h-[299px] shrink-0 flex-col items-center justify-end gap-5xl overflow-hidden brand-gradient px-md pb-xl pt-11 md:h-auto md:min-h-svh md:w-1/2 md:justify-between md:pt-[120px]">
      <img
        src="/images/login-hero-bg.webp"
        srcSet="/images/login-hero-bg.webp 1x, /images/login-hero-bg@2x.webp 2x"
        alt=""
        className="absolute inset-0 h-full w-full object-cover md:hidden"
      />
      <img
        src="/images/hero_desk_half.webp"
        srcSet="/images/hero_desk_half.webp 1x, /images/hero_desk_half@2x.webp 2x"
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover md:block"
      />
      <img src="/brand/header-lockup-big.svg" alt="HAV'ARC Heating and Air" className="relative h-[122px] w-[172px]" />
      <p className="relative rounded-full bg-[var(--alpha-white-05)] px-lg py-[10px] text-caption text-inverse opacity-70">
        Getting the job done right the first time.
      </p>
    </div>
  )
}
