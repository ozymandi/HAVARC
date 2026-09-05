/** Figma: Choice Chip (14:6) — "Tap-to-toggle option (replaces checkboxes). Min height 44
 *  (touch), label wraps. Selected = blue tint + focus border." */
interface ChoiceChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

export function ChoiceChip({ label, selected = false, onClick }: ChoiceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        'min-h-11 flex-1 rounded-xs border-solid px-sm py-md text-chip text-center ' +
        (selected
          ? 'border-[length:var(--stroke-regular)] border-line-focus bg-selected text-link'
          : 'border-[length:var(--stroke-hairline)] border-line bg-surface text-ink')
      }
    >
      {label}
    </button>
  )
}
