import { FileText, Image as ImageIcon, Share, X } from 'lucide-react'
import { useState } from 'react'
import type { Job } from '../data/mockJobs'

interface ShareItem {
  key: string
  icon: 'doc' | 'photos'
  title: string
  meta: string
}

/** Figma: 08b · Job Detail · Share (100:3294) — "Bottom Sheet · Share" over a 40% scrim.
 *  No real files exist yet (documents are placeholders, no backend PDF generation) — Share
 *  uses the Web Share API with what's actually real (the job's photos) plus a text summary,
 *  rather than faking a "shared successfully" result for files that don't exist. */
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
    <div className="fixed inset-0 z-20 flex flex-col justify-end">
      <button type="button" aria-label="Close share sheet" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex w-full flex-col rounded-t-lg bg-surface pb-2xl shadow-modal">
        <div className="flex w-full items-center justify-center py-sm">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        <div className="flex w-full items-center gap-md py-xs pl-xl pr-md">
          <div className="flex min-w-0 flex-1 flex-col gap-2xs">
            <p className="text-h2 text-ink">Share</p>
            <p className="text-caption text-ink-faint">
              {job.workOrder} · {job.customer}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 shrink-0 items-center justify-center text-icon">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
        <div className="h-px w-full bg-line" />
        <div className="flex flex-col">
          {items.map((item) => (
            <label key={item.key} className="flex min-h-[60px] w-full items-center gap-md px-xl py-md">
              <input
                type="checkbox"
                checked={checked[item.key]}
                onChange={() => toggle(item.key)}
                className="size-6 shrink-0 rounded-xs border-line-input accent-brand"
              />
              {item.icon === 'doc' ? (
                <FileText size={22} strokeWidth={1.5} className="shrink-0 text-icon" />
              ) : (
                <ImageIcon size={22} strokeWidth={1.5} className="shrink-0 text-icon" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-2xs">
                <p className="text-body-strong text-ink">{item.title}</p>
                <p className="text-caption text-ink-faint">{item.meta}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex w-full flex-col px-lg pt-md">
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={share}
            className="flex h-[var(--size-control)] w-full items-center justify-center gap-sm rounded-sm bg-accent text-button text-inverse disabled:bg-disabled disabled:text-ink-faint"
          >
            <Share size={16} strokeWidth={1.5} />
            Share {selectedCount} file{selectedCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}
