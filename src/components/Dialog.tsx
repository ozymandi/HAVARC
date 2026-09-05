import type { ReactNode } from 'react'
import { Button } from './Button'

/** Figma: Dialog (44:35) — "Centered modal (326 wide) over 40% scrim. Success icon, Title,
 *  Message; primary/secondary Button instances. Show secondary toggles the text button."
 *
 *  `icon` is a slot rather than a fixed illustration — the Figma reference uses a bespoke
 *  multi-part success illustration that isn't exported as an asset yet; pass a Lucide icon
 *  or similar until Yaroslav provides one (see [[ask-before-graphics]]). */
interface DialogProps {
  icon?: ReactNode
  title: string
  message: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export function Dialog({ icon, title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }: DialogProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-xl">
      <div className="flex w-full max-w-[326px] flex-col items-center gap-5xl rounded-sm bg-surface px-2xl py-5xl shadow-modal">
        <div className="flex w-full flex-col items-center gap-lg text-center">
          {icon}
          <div className="flex w-full flex-col items-center gap-sm">
            <p className="text-h1 text-ink">{title}</p>
            <p className="text-body text-ink-soft">{message}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-sm">
          <Button variant="primary" className="w-full" onClick={onPrimary}>
            {primaryLabel}
          </Button>
          {secondaryLabel && (
            <Button variant="text" className="w-full" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
