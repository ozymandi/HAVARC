import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ChoiceChip } from '../components/ChoiceChip'
import { Dialog } from '../components/Dialog'
import { Fab } from '../components/Fab'
import { InstallSheet } from '../components/InstallSheet'
import { JobCard, type JobStatus } from '../components/JobCard'
import { SyncBanner } from '../components/SyncBanner'
import { TopBar } from '../components/TopBar'
import { clearDraft } from '../data/draft'
import { useJobs } from '../data/jobs'
import { resolveConflict, runSync, useSyncState } from '../data/sync'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

type Filter = 'all' | JobStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
]

export function Jobs() {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const [filter, setFilter] = useState<Filter>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { data: allJobs, loading, error, reload } = useJobs()
  const sync = useSyncState()

  // The list is a projection of server + outbox: re-read it whenever the queue changes
  // size or a sync pass finishes (the hook already loads once on mount).
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) reload()
    mounted.current = true
  }, [sync.pending, sync.lastSyncAt, reload])
  const conflict = sync.conflict
  const jobsWord = `${sync.pending} ${sync.pending === 1 ? 'job' : 'jobs'}`
  const newJob = () => {
    clearDraft() // a draft left behind by "Keep draft & exit" is resumed via Edit job, not here
    navigate('/jobs/new')
  }

  const jobs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (allJobs ?? [])
      .filter((j) => filter === 'all' || j.status === filter)
      .filter((j) => !q || j.workOrder.toLowerCase().includes(q) || j.customer.toLowerCase().includes(q) || j.meta.toLowerCase().includes(q))
  }, [allJobs, filter, query])

  const today = jobs.filter((j) => j.group === 'today')
  const earlier = jobs.filter((j) => j.group === 'earlier')

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar variant="root" onAction={() => navigate('/settings')} />
      {/* Figma 02e Syncing / 02f Sync error; offline wins over both. */}
      {!online && <SyncBanner state="offline" message="Offline — changes are saved on this device and will sync when connected" />}
      {online && sync.status === 'syncing' && <SyncBanner state="syncing" message={`Syncing ${jobsWord}…`} />}
      {online && sync.status === 'error' && <SyncBanner state="error" message={`Couldn't sync ${jobsWord}. Tap to retry.`} onRetry={() => void runSync()} />}
      {online && sync.status === 'idle' && error && <SyncBanner state="error" message="Couldn't load jobs — tap to retry" onRetry={reload} />}

      <div className="app-col flex flex-1 flex-col gap-lg px-lg pb-5xl pt-lg">
        {searchOpen ? (
          <div className="flex items-center gap-sm">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Work order, customer or address"
              className="h-[var(--size-control)] flex-1 rounded-xs border-[length:var(--stroke-hairline)] border-line-input bg-surface px-md text-body text-ink placeholder:text-ink-faint focus:border-line-focus focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false)
                setQuery('')
              }}
              className="text-button text-brand"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-sm">
              <h1 className="text-h1 flex-1 text-ink">Jobs</h1>
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search jobs" className="flex size-11 items-center justify-center text-icon">
                <Search size={24} strokeWidth={1.5} />
              </button>
              {/* Desktop (02 · Jobs 320:14793): the FAB is replaced by an accent "New job" button here. */}
              <div className="hidden md:block">
                <Button variant="accent" icon={<Plus size={16} strokeWidth={1.5} />} className="w-[160px]" onClick={newJob}>
                  New job
                </Button>
              </div>
            </div>
            <div className="flex gap-2xs md:w-[358px]">
              {FILTERS.map((f) => (
                <ChoiceChip key={f.value} label={f.label} selected={filter === f.value} onClick={() => setFilter(f.value)} />
              ))}
            </div>
          </>
        )}

        {loading || error ? null : jobs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center gap-2xl pt-3xl text-center">
            {query || filter !== 'all' ? (
              <img src="/images/illustrations/no-matches.webp" srcSet="/images/illustrations/no-matches.webp 1x, /images/illustrations/no-matches@2x.webp 2x" alt="" className="h-auto w-[188px]" />
            ) : (
              <img src="/images/illustrations/no-jobs.webp" srcSet="/images/illustrations/no-jobs.webp 1x, /images/illustrations/no-jobs@2x.webp 2x" alt="" className="h-auto w-[246px]" />
            )}
            <div>
              <p className="text-h1 text-ink">{query || filter !== 'all' ? 'No matches' : 'No jobs yet'}</p>
              <p className="text-body text-ink-faint">
                {query || filter !== 'all'
                  ? `Nothing found for "${query}". Try a work order number, customer name or address.`
                  : 'Create your first service call. Drafts are saved on this device and sync automatically.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <div className="flex flex-col gap-sm">
                <p className="text-label text-ink-faint">TODAY</p>
                <div className="flex flex-col gap-2xs">
                  {today.map((j) => (
                    <JobCard key={j.id} workOrder={j.workOrder} customer={j.customer} meta={j.meta} status={j.status} onClick={() => navigate(`/jobs/${j.id}`)} />
                  ))}
                </div>
              </div>
            )}
            {earlier.length > 0 && (
              <div className="flex flex-col gap-sm">
                <p className="text-label text-ink-faint">EARLIER</p>
                <div className="flex flex-col gap-2xs">
                  {earlier.map((j) => (
                    <JobCard key={j.id} workOrder={j.workOrder} customer={j.customer} meta={j.meta} status={j.status} onClick={() => navigate(`/jobs/${j.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="md:hidden">
        <Fab label="New job" onClick={newJob} />
      </div>
      <InstallSheet />

      {/* Figma 02g · Jobs · Sync conflict: the same job was edited on the other device. */}
      {conflict && (
        <Dialog
          icon={
            <img
              src="/images/illustrations/dialog-sync.webp"
              srcSet="/images/illustrations/dialog-sync.webp 1x, /images/illustrations/dialog-sync@2x.webp 2x"
              alt=""
              className="h-[140px] w-auto"
            />
          }
          title="Sync conflict"
          message={`${conflict.draft.workOrder || 'This job'} · ${conflict.draft.customer} was also edited on another device. Which version should be kept?`}
          primaryLabel="Keep my version"
          onPrimary={() => void resolveConflict(conflict.jobId, 'mine')}
          secondaryLabel="Use the other version"
          onSecondary={() => void resolveConflict(conflict.jobId, 'theirs')}
        />
      )}
    </div>
  )
}
