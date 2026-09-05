import { ChevronLeft, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

/** Figma: Top Bar (18:57) — "Navy top bar for list / detail / settings screens. Child shows
 *  back arrow. Optional right action icon (swap). Top padding includes 44px safe-area."
 *
 *  Root = app-level screens (Jobs list): logo + optional action.
 *  Child = drilled-in screens: back + title + optional action. */
type TopBarProps =
  | { variant?: 'root'; action?: ReactNode; onAction?: () => void }
  | { variant: 'child'; title: string; onBack: () => void; action?: ReactNode; onAction?: () => void }

export function TopBar(props: TopBarProps) {
  return (
    <div className="sticky top-0 z-[5] flex h-[100px] shrink-0 items-center overflow-hidden brand-gradient px-md pt-11">
      {/* Decorative gradient layer, pre-flattened and cropped to the bar's exact size. */}
      <img
        src="/images/header.webp"
        srcSet="/images/header.webp 1x, /images/header@2x.webp 2x"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {props.variant === 'child' ? (
        <div className="relative flex flex-1 items-center gap-sm">
          <button type="button" onClick={props.onBack} aria-label="Back" className="shrink-0 text-inverse">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <p className="text-h2 flex-1 text-inverse opacity-80">{props.title}</p>
          {props.action && (
            <button type="button" onClick={props.onAction} className="shrink-0 text-inverse">
              {props.action}
            </button>
          )}
        </div>
      ) : (
        <div className="relative flex flex-1 items-center justify-between">
          <img src="/brand/header-lockup.svg" alt="HAV'ARC" className="h-[34px] w-[133px]" />
          {props.action ?? (
            <button type="button" onClick={props.onAction} className="shrink-0 text-inverse">
              <Settings size={24} strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
