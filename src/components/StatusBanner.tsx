/** Figma: Status Button (14:63) — read-only rendering, as used on Job Detail to show the
 *  job's final recorded system status (the interactive 4-color picker itself belongs to
 *  Step 4 · Complete Service Call, built separately when that screen is implemented). */
export type StatusColor = 'green' | 'yellow' | 'orange' | 'red'

interface StatusBannerProps {
  color: StatusColor
  label: string
  description: string
}

const bgClass: Record<StatusColor, string> = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  orange: 'bg-status-orange',
  red: 'bg-status-red',
}

export function StatusBanner({ color, label, description }: StatusBannerProps) {
  return (
    <div className={`flex h-[72px] w-full flex-col justify-center rounded-sm p-md ${bgClass[color]}`}>
      <p className="text-status text-inverse">{label.toUpperCase()}</p>
      <p className="text-status-sm text-inverse opacity-70">{description}</p>
    </div>
  )
}
