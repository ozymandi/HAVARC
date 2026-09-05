import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'

/** Figma: Sync Banner (58:78) — "Connectivity / sync status strip under the top bar.
 *  Offline (amber), Syncing (blue), Error (red, tap to retry)." */
type SyncState = 'offline' | 'syncing' | 'error'

interface SyncBannerProps {
  state: SyncState
  message: string
  onRetry?: () => void
}

const stateClass: Record<SyncState, string> = {
  offline: 'bg-warning-soft text-warning',
  syncing: 'bg-selected text-link',
  error: 'bg-danger-soft text-danger',
}

const icon: Record<SyncState, typeof WifiOff> = {
  offline: WifiOff,
  syncing: RefreshCw,
  error: AlertCircle,
}

export function SyncBanner({ state, message, onRetry }: SyncBannerProps) {
  const Icon = icon[state]
  const isError = state === 'error'

  return (
    <button
      type="button"
      disabled={!isError}
      onClick={isError ? onRetry : undefined}
      className={`flex h-10 w-full items-center gap-lg px-lg text-caption disabled:pointer-events-none ${stateClass[state]}`}
    >
      <Icon size={18} strokeWidth={1.5} className={state === 'syncing' ? 'animate-spin' : ''} />
      <span className="flex-1 text-left">{message}</span>
    </button>
  )
}
