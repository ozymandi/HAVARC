/** Figma: Bottom Nav (18:127) — "Step navigation for the 4-step form. First/Middle:
 *  Back + Next. Last: Back + Complete. Autosave — no explicit Save." Back on the First
 *  step is muted (there's nowhere to go back to — it behaves like exiting to Jobs);
 *  on Middle/Last it's a normal active secondary button that returns to the prior step. */
interface BottomNavProps {
  isFirst?: boolean
  isLast?: boolean
  onBack: () => void
  onNext: () => void
  nextDisabled?: boolean
}

export function BottomNav({ isFirst = false, isLast = false, onBack, onNext, nextDisabled }: BottomNavProps) {
  return (
    <div className="flex w-full shrink-0 gap-2xs border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
      <button
        type="button"
        onClick={onBack}
        className={
          'h-[var(--size-control)] flex-1 rounded-sm text-button ' +
          (isFirst ? 'bg-disabled text-ink-faint' : 'border-[length:var(--stroke-regular)] border-brand bg-surface text-brand')
        }
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="h-[var(--size-control)] flex-1 rounded-sm brand-gradient text-button text-inverse disabled:bg-disabled disabled:[background-image:none] disabled:text-ink-faint"
      >
        {isLast ? 'Complete' : 'Next'}
      </button>
    </div>
  )
}
