import { useState } from 'react'
import { documentUrl } from '../data/documents'
import type { Job } from '../data/jobs'

interface ShareItem {
  key: string
  icon: 'doc' | 'photos'
  title: string
  meta: string
  /** Files behind the row: one PDF, or every photo of the job. */
  files: { url: string; name: string; type: string }[]
}

/** Figma: 08b · Job Detail · Share (100:3294) — "Bottom Sheet · Share" over a 40% scrim.
 *  Shares the real files: the generated PDFs from Storage and the job's photos. Phones get
 *  the system share sheet (Web Share API with files — Messages, Mail, WhatsApp, AirDrop…);
 *  a browser without file sharing (desktop) downloads the selected files instead.
 *
 *  Checkbox + row icons are exported straight from the Figma node (Checkbox Row 40:69) as
 *  real SVG assets, not a native <input type=checkbox> — a native checkbox renders with the
 *  OS's own styling (same class of problem as the native <select> dropdown elsewhere). */
interface ShareSheetProps {
  job: Job
  onClose: () => void
}

const safeName = (s: string) => s.replace(/[^\w.-]+/g, '-')

export function ShareSheet({ job, onClose }: ShareSheetProps) {
  const wo = safeName(job.workOrder)
  const items: ShareItem[] = [
    ...(job.documents ?? [])
      .filter((doc) => doc.status === 'ready' && doc.path)
      .map((doc) => ({
        key: doc.kind,
        icon: 'doc' as const,
        title: doc.title,
        meta: doc.meta,
        files: [
          {
            url: doc.path as string,
            name: doc.kind === 'report' ? `${wo}-service-report.pdf` : `${wo}-invoice${job.invoiceNumber ? `-${safeName(job.invoiceNumber)}` : ''}.pdf`,
            type: 'application/pdf',
          },
        ],
      })),
    ...(job.photos?.length
      ? [
          {
            key: 'photos',
            icon: 'photos' as const,
            title: 'Photos',
            meta: `${job.photos.length} image${job.photos.length === 1 ? '' : 's'}`,
            files: job.photos.map((url, i) => ({ url, name: `${wo}-photo-${i + 1}.jpg`, type: 'image/jpeg' })),
          },
        ]
      : []),
  ]
  const [checked, setChecked] = useState<Record<string, boolean>>(Object.fromEntries(items.map((i) => [i.key, true])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const selectedCount = Object.values(checked).filter(Boolean).length

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))

  const share = async () => {
    setBusy(true)
    setError('')
    try {
      const selected = items.filter((i) => checked[i.key])
      const files = await Promise.all(
        selected.flatMap((item) =>
          item.files.map(async (f) => {
            // PDFs are addressed by Storage path (signed here); photos already carry a signed URL.
            const url = item.icon === 'doc' ? await documentUrl(f.url) : f.url
            const response = await fetch(url)
            if (!response.ok) throw new Error(`${f.name}: ${response.status}`)
            return new File([await response.blob()], f.name, { type: f.type })
          }),
        ),
      )
      const title = `${job.workOrder} · ${job.customer}`
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files })) {
        try {
          await navigator.share({ files, title, text: title })
        } catch (err) {
          if ((err as { name?: string }).name === 'AbortError') return // user closed the system sheet
          throw err
        }
      } else {
        for (const file of files) download(file)
      }
      onClose()
    } catch {
      setError("Couldn't load the files. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
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
        <div className="flex w-full flex-col gap-sm px-lg pt-md">
          {error && <p className="text-caption text-danger">{error}</p>}
          <button
            type="button"
            disabled={selectedCount === 0 || busy}
            onClick={() => void share()}
            className="flex h-[var(--size-control)] w-full items-center justify-center gap-sm rounded-sm bg-accent text-button text-inverse disabled:bg-disabled disabled:text-ink-faint"
          >
            <img src="/icons/share.svg" alt="" className="size-4" />
            {busy ? 'Preparing…' : `Share ${selectedCount} file${selectedCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Desktop fallback: a plain download per file. */
const download = (file: File) => {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
