import { Plus, Share, SquarePlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './Button'

/** Figma: 01f · Install on iPhone (100:3019) — "Bottom Sheet · Install" over a 40% scrim.
 *  iOS Safari has no install prompt of its own, so the app explains the three manual steps
 *  once. Shown only on iPhone/iPad Safari when not already running from the Home Screen;
 *  "Got it" hides it for good, "Remind me later" snoozes it for a week. Android/Chrome
 *  fire `beforeinstallprompt` themselves, as the sheet's footnote says. */

const STORAGE_KEY = 'havarc.install-sheet'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

const isIosSafari = () => {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return ios && safari
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const shouldShow = () => {
  if (!isIosSafari() || isStandalone()) return false
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'done') return false
    if (stored?.startsWith('later:')) return Date.now() - Number(stored.slice(6)) > SNOOZE_MS
  } catch {
    // storage unavailable (private mode) — just show it
  }
  return true
}

const remember = (value: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore
  }
}

const STEPS = [
  { text: 'Tap the Share button in Safari', icon: Share },
  { text: 'Scroll and choose “Add to Home Screen”', icon: SquarePlus },
  { text: 'Tap “Add” in the top right corner', icon: Plus },
]

export function InstallSheet() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (shouldShow()) setOpen(true)
  }, [])

  if (!open) return null

  const close = (value: string) => {
    remember(value)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => close(`later:${Date.now()}`)} />
      <div className="relative flex w-full flex-col rounded-t-lg bg-surface pb-3xl shadow-modal">
        <div className="flex w-full items-center justify-center py-sm">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        <div className="flex w-full flex-col gap-lg px-xl pt-xs">
          <div className="flex w-full items-center gap-md">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md brand-gradient">
              <img src="/brand/logo-pdf.png" srcSet="/brand/logo-pdf.png 1x, /brand/logo-pdf@2x.png 2x" alt="" className="size-8" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2xs">
              <p className="text-h2 text-ink">Add HAV’ARC to your Home Screen</p>
              <p className="text-caption text-ink-faint">Works offline and opens like a regular app</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-sm">
            {STEPS.map((step, i) => (
              <div key={i} className="flex w-full items-center gap-md rounded-md bg-canvas p-md">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-label text-inverse">{i + 1}</span>
                <p className="min-w-0 flex-1 text-body text-ink">{step.text}</p>
                <step.icon size={22} strokeWidth={1.5} className="shrink-0 text-icon" />
              </div>
            ))}
          </div>

          <p className="text-caption text-ink-faint">You only need to do this once. On Android, Chrome will offer “Install app” automatically.</p>

          <div className="flex w-full flex-col gap-sm">
            <Button variant="primary" className="w-full" onClick={() => close('done')}>
              Got it
            </Button>
            <Button variant="text" className="w-full" onClick={() => close(`later:${Date.now()}`)}>
              Remind me later
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
