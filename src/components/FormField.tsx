import { Calendar, ChevronDown, Clock } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

/** Figma: Form Field (15:92) — "Label + input. Type: Text / Select / Textarea.
 *  State: Default (placeholder), Filled, Focus, Error (with message), Disabled."
 *
 *  Default vs Filled is just placeholder-vs-value color, which native `::placeholder`
 *  already handles, and Focus is a real `:focus` state — modelling both as props would
 *  make callers track state React already gives for free. Only `error` and `disabled`
 *  are genuine props here. */

interface Shared {
  label: string
  error?: string
  id?: string
  className?: string
}

type TextFieldProps = Shared &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time'
  }
type SelectFieldProps = Shared &
  SelectHTMLAttributes<HTMLSelectElement> & { type: 'select'; children: ReactNode }
type TextareaFieldProps = Shared & TextareaHTMLAttributes<HTMLTextAreaElement> & { type: 'textarea' }

export type FormFieldProps = TextFieldProps | SelectFieldProps | TextareaFieldProps

const fieldClass = (error: boolean, textarea: boolean) =>
  `peer w-full rounded-xs border-[length:var(--stroke-hairline)] bg-surface px-md text-body text-ink ` +
  `placeholder:text-ink-faint focus:border-line-focus focus:outline-none disabled:bg-disabled disabled:text-ink-faint ` +
  (textarea ? 'min-h-[92px] resize-y py-md ' : 'h-[var(--size-control)] ') +
  (error ? 'border-line-error bg-danger-soft' : 'border-line-input')

export function FormField({ label, error, id, className = '', ...props }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      <label htmlFor={fieldId} className="text-label text-ink-soft">
        {label}
      </label>

      {props.type === 'select' ? (
        <div className="relative">
          <select id={fieldId} className={`${fieldClass(!!error, false)} appearance-none pr-3xl`} {...props}>
            {props.children}
          </select>
          <ChevronDown
            size={20}
            className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-icon-soft peer-disabled:text-ink-faint"
          />
        </div>
      ) : props.type === 'textarea' ? (
        <textarea id={fieldId} className={fieldClass(!!error, true)} {...props} />
      ) : props.type === 'date' || props.type === 'time' ? (
        /* Native pickers (system calendar / clock on phones) behind our own icon: the browser's
           tiny indicator is hidden by the `native-picker` rules in index.css. */
        <div className="relative">
          <input id={fieldId} className={`${fieldClass(!!error, false)} native-picker pr-3xl`} {...props} />
          {props.type === 'date' ? (
            <Calendar size={20} strokeWidth={1.5} className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-icon-soft" />
          ) : (
            <Clock size={20} strokeWidth={1.5} className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-icon-soft" />
          )}
        </div>
      ) : (
        <input id={fieldId} className={fieldClass(!!error, false)} {...props} />
      )}

      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  )
}

/** Same look as FormField's "select" state, but opens a `BottomSheetPicker` instead of a
 *  native <select> — the OS-native dropdown (esp. on Android) doesn't match the Figma
 *  design at all. Use for any single-select field that needs the custom bottom sheet. */
interface PickerFieldProps {
  label: string
  value: string
  placeholder?: string
  onClick: () => void
  className?: string
}

export function PickerField({ label, value, placeholder = 'Select', onClick, className = '' }: PickerFieldProps) {
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      <p className="text-label text-ink-soft">{label}</p>
      <button
        type="button"
        onClick={onClick}
        className="relative flex h-[var(--size-control)] w-full items-center rounded-xs border-[length:var(--stroke-hairline)] border-line-input bg-surface px-md pr-3xl text-left text-body"
      >
        <span className={value ? 'text-ink' : 'text-ink-faint'}>{value || placeholder}</span>
        <ChevronDown size={20} className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-icon-soft" />
      </button>
    </div>
  )
}
