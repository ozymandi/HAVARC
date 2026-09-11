import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { AuthHero } from './AuthHero'

/** Shell for the auth screens: hero + section label + card + "HAV'ARC app" footnote.
 *  Phone: hero on top, content below (01 · Login 100:2911). Desktop (320:9916): 50/50 split,
 *  hero left, content right with 100px side padding, the 520px card centered vertically and
 *  the footnote pinned to the bottom. Yaroslav's call: the forgot-password screens follow
 *  the same split as Login, so all four share this one layout. */
interface AuthLayoutProps {
  label: string
  children: ReactNode
}

export function AuthLayout({ label, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-canvas md:flex-row">
      <AuthHero />

      <div className="flex flex-1 flex-col justify-between gap-2xl px-lg py-3xl md:min-h-svh md:w-1/2 md:flex-none md:px-3xl lg:px-[100px]">
        <div className="flex flex-1 flex-col gap-lg md:mx-auto md:w-full md:max-w-[520px] md:justify-center">
          <p className="text-section text-brand">{label}</p>
          {children}
        </div>

        <div className="flex items-center justify-center gap-md text-ink-faint">
          <FileText size={12} strokeWidth={1.5} className="opacity-30" />
          <span className="text-caption">HAV&apos;ARC app</span>
        </div>
      </div>
    </div>
  )
}
