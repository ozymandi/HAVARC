import type { StatusColor } from '../components/StatusBanner'

/** The four final-system-status options (Figma Status Button 14:63). Shared by the Step 4
 *  picker and by Job Detail / PDFs, which turn a stored `final_status` back into its label. */
export const STATUS_OPTIONS: { color: StatusColor; label: string; description: string }[] = [
  { color: 'green', label: 'Green', description: 'Operating Normally' },
  { color: 'yellow', label: 'Yellow', description: 'Repairs Recommended' },
  { color: 'orange', label: 'Orange', description: 'Limited Operation' },
  { color: 'red', label: 'Red', description: 'Not Operational' },
]

export const statusOption = (color: StatusColor) => STATUS_OPTIONS.find((o) => o.color === color) ?? STATUS_OPTIONS[0]
