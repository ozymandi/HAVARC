import { Check, X } from 'lucide-react'

/** Figma: Bottom Sheet Picker (35:23) — "Single-select picker replacing native <select> on
 *  iOS/Android. Drag handle, title, X to dismiss, Picker Option rows, safe-area bottom
 *  padding. Attach to bottom of screen over a 40% black scrim." */
interface BottomSheetPickerProps {
  title: string
  options: string[]
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

export function BottomSheetPicker({ title, options, value, onChange, onClose }: BottomSheetPickerProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end">
      <button type="button" aria-label="Close picker" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-lg bg-surface pb-2xl shadow-modal">
        <div className="flex w-full items-center justify-center py-sm">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        <div className="flex w-full items-center gap-md py-xs pl-xl pr-md">
          <p className="flex-1 text-h2 text-ink">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center text-icon">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
        <div className="h-px w-full bg-line" />
        <div className="flex flex-col overflow-y-auto">
          {options.map((option) => {
            const selected = option === value
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  onClose()
                }}
                className={`flex h-[52px] w-full shrink-0 items-center gap-md px-xl text-left ${selected ? 'bg-selected' : 'bg-surface'}`}
              >
                <span className={`flex-1 text-body ${selected ? 'text-body-strong text-link' : 'text-ink'}`}>{option}</span>
                {selected && <Check size={22} strokeWidth={1.5} className="shrink-0 text-link" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
