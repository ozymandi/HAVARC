import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Figma: Button (13:74) — "Primary CTA / Secondary outline / Accent (orange) / Text.
 *  Height = size/control (48). Label + optional leading icon via Show Icon + Icon swap." */
type Style = 'primary' | 'secondary' | 'accent' | 'text'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Style
  icon?: ReactNode
}

const base =
  'inline-flex h-[var(--size-control)] items-center justify-center gap-sm rounded-sm px-lg ' +
  'text-button transition-colors disabled:pointer-events-none'

const variantClass: Record<Style, string> = {
  primary:
    'brand-gradient text-inverse ' +
    'hover:bg-brand-strong hover:[background-image:none] active:bg-brand-strong active:[background-image:none] ' +
    'disabled:bg-disabled disabled:[background-image:none] disabled:text-ink-faint',
  secondary:
    'border-[length:var(--stroke-regular)] border-brand bg-surface text-brand ' +
    'hover:bg-selected active:bg-selected ' +
    'disabled:border-transparent disabled:bg-disabled disabled:text-ink-faint',
  accent:
    'bg-accent text-inverse hover:opacity-90 active:opacity-85 disabled:bg-disabled disabled:text-ink-faint',
  text: 'bg-transparent text-brand hover:bg-selected active:bg-selected disabled:text-ink-faint',
}

/** CTA button. Sizes itself to its label — wrap in a full-width container at the call site
 *  (most rows already are `flex flex-col` with FILL children) rather than forcing w-full here. */
export function Button({ variant = 'primary', icon, className = '', children, ...props }: ButtonProps) {
  return (
    <button type="button" className={`${base} ${variantClass[variant]} ${className}`} {...props}>
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  )
}
