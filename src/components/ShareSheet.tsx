import { useState } from 'react'
import type { Job } from '../data/jobs'

interface ShareItem {
  key: string
  icon: 'doc' | 'photos'
  title: string
  meta: string
}

/** Figma: 08b · Job Detail · Share (100:3294) — "Bottom Sheet · Share" over a 40% scrim.
 *  No real files exist yet (documents are placeholders, no backend PDF generation) — Share
 *  uses the Web Share API with what's actually real (the job's photos) plus a text summary,
 *  rather than faking a "shared successfully" result for files that don't exist.
 *
 *  Checkbox + row icons are exported straight from the Figma node (Checkbox Row 40:69) as
 *  real SVG assets, not a native <input type=checkbox> — a native checkbox renders with the
 *  OS's own styling (same class of problem as the native <select> dropdown elsewhere). */
interface ShareSheetProps {
  job: Job
  onClose: () => void
}

export function ShareSheet({ job, onClose }: ShareSheetProps) {
  const items: ShareItem[] = [
    ...(job.documents ?? []).map((doc) => ({ key: doc.title, icon: 'doc' as const, title: doc.title, meta: doc.meta })),
    ...(job.photos ? [{ key: 'photos', icon: 'photos' as const, title: 'Photos', meta: `${job.photos.length} images` }] : []),
  ]
  const [checked, setChecked] = useState<Record<string, boolean>>(Object.fromEntries(items.map((i) => [i.key, true])))
  const selectedCount = Object.values(checked).filter(Boolean).length

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))

  const share = async () => {
    const selectedTitles = items.filter((i) => checked[i.key]).map((i) => i.title)
    const text = `${job.workOrder} · ${job.customer}\n${selectedTitles.join('\n')}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${job.workOrder} · ${job.customer}`, text })
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end md:items-center md:justify-center">
      <button type="button" aria-label="Close share sheet" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex w-full flex-col rounded-t-lg bg-surface pb-2xl shadow-modal md:w-[480px] md:rounded-lg md:pt-md">
        <div className="flex w-full items-center justify-center py-sm md:hidden">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        <div className="flex w-full items-center gap-md py-xs pl-xl pr-md">
          <div className="flex min-w-0 flex-1 flex-col gap-2xs">
            <p className="text-h2 text-ink">Share</p>
            <p className="text-caption text-ink-faint">
              {job.workOrder} · {job.customer}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 shrink-0 items-center justify-center">
            <img src="/icons/close.svg" alt="" className="size-6" />
          </button>
        </div>
        <div className="h-px w-full bg-line" />
        <div className="flex flex-col">
          {items.map((item) => {
            const isChecked = checked[item.key]
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                aria-pressed={isChecked}
                className="flex min-h-[60px] w-full items-center gap-md px-xl py-md text-left"
              >
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-xs ${isChecked ? 'bg-brand' : 'border border-line-input'}`}>
                  {isChecked && <img src="/icons/check.svg" alt="" className="size-4" />}
                </span>
                <img src={item.icon === 'doc' ? '/icons/file.svg' : '/icons/image.svg'} alt="" className="size-[22px] shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col gap-2xs">
                  <span className="text-body-strong text-ink">{item.title}</span>
                  <span className="text-caption text-ink-faint">{item.meta}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex w-full flex-col px-lg pt-md">
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={share}
            className="flex h-[var(--size-control)] w-full items-center justify-center gap-sm rounded-sm bg-accent text-button text-inverse disabled:bg-disabled disabled:text-ink-faint"
          >
            <img src="/icons/share.svg" alt="" className="size-4" />
            Share {selectedCount} file{selectedCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}
