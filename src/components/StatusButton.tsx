import { Check } from 'lucide-react'
import type { StatusColor } from './StatusBanner'

/** Figma: Status Button (14:63) — "Final system status selector. Left-aligned, radius/sm.
 *  Selected: 1.5px stroke color/status/{color}-border + check top-right." Interactive
 *  4-color grid used on Step 4; StatusBanner (read-only, no picker) covers Job Detail. */
const STATUS_OPTIONS: { color: StatusColor; label: string; description: string }[] = [
  { color: 'green', label: 'Green', description: 'Operating Normally' },
  { color: 'yellow', label: 'Yellow', description: 'Repairs Recommended' },
  { color: 'orange', label: 'Orange', description: 'Limited Operation' },
  { color: 'red', label: 'Red', description: 'Not Operational' },
]

const bgClass: Record<StatusColor, string> = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  orange: 'bg-status-orange',
  red: 'bg-status-red',
}

const borderClass: Record<StatusColor, string> = {
  green: 'border-status-green-line',
  yellow: 'border-status-yellow-line',
  orange: 'border-status-orange-line',
  red: 'border-status-red-line',
}

interface StatusButtonGridProps {
  value: StatusColor | null
  onChange: (color: StatusColor) => void
}

export function StatusButtonGrid({ value, onChange }: StatusButtonGridProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-2xs md:grid-cols-4">
      {STATUS_OPTIONS.map(({ color, label, description }) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={
              `relative flex h-[72px] flex-col justify-center rounded-sm p-md text-left status-pattern ${bgClass[color]} ` +
              (selected ? `border-[length:var(--stroke-regular)] ${borderClass[color]}` : '')
            }
          >
            <p className="text-status text-inverse">{label.toUpperCase()}</p>
            <p className={`text-status-sm text-inverse ${selected ? 'opacity-80' : 'opacity-70'}`}>{description}</p>
            {selected && <Check size={18} strokeWidth={2} className="absolute right-[8.5px] top-[8.5px] text-inverse" />}
          </button>
        )
      })}
    </div>
  )
}
