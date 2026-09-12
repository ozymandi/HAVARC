import { MoreHorizontal, Share } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActionMenu } from '../components/ActionMenu'
import { Button } from '../components/Button'
import { CustomerNotesCallout } from '../components/CustomerNotesCallout'
import { Dialog } from '../components/Dialog'
import { DocumentRow } from '../components/DocumentRow'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { PhotoTile } from '../components/PhotoTile'
import { Section } from '../components/Section'
import { ShareSheet } from '../components/ShareSheet'
import { StatusBanner } from '../components/StatusBanner'
import { SyncBanner } from '../components/SyncBanner'
import { TopBar } from '../components/TopBar'
import { openStoredDocument, requestPdfs } from '../data/documents'
import { loadJobIntoDraft } from '../data/jobDraft'
import { deleteJob, useJob } from '../data/jobs'
import { useSyncState } from '../data/sync'

const badgeClass: Record<'draft' | 'completed' | 'pending', string> = {
  draft: 'bg-warning-soft text-warning',
  completed: 'bg-success-soft text-success',
  pending: 'bg-selected text-link',
}

const badgeLabel = { draft: 'Draft', completed: 'Completed', pending: 'Pending sync' } as const

/** Figma: 08 · Job Detail (100:3229). Summary/status/documents/photos only render once the
 *  job has gone through Step 4 · Complete Service Call — a draft or pending job simply
 *  doesn't have that data yet. Documents appear once the PDF generator has written them
 *  (backend step 6), so until then completed jobs have no Documents section or Share button. */
export function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: job, loading, error, reload } = useJob(id)
  const sync = useSyncState()
  // Pending sync → Completed happens here without leaving the screen.
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) reload()
    mounted.current = true
  }, [sync.pending, sync.lastSyncAt, reload])
  // While the server is rendering PDFs (08e), poll until every row is ready or failed.
  const generating = !!job?.documents?.some((d) => d.status === 'pending')
  useEffect(() => {
    if (!generating) return
    const timer = setInterval(reload, 3000)
    return () => clearInterval(timer)
  }, [generating, reload])
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const [editFailed, setEditFailed] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  if (!loading && !error && !job) return <Navigate to="/jobs" replace />
  if (!job) {
    return (
      <div className="flex min-h-svh flex-col bg-canvas">
        <TopBar variant="child" title="" onBack={() => navigate(-1)} />
        {error && <SyncBanner state="error" message="Couldn't load this job — tap to retry" onRetry={reload} />}
      </div>
    )
  }

  const edit = async () => {
    setEditFailed(false)
    try {
      await loadJobIntoDraft(job.id)
      navigate('/jobs/new')
    } catch {
      setEditFailed(true)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteFailed(false)
    try {
      await deleteJob(job.id)
      navigate('/jobs', { replace: true })
    } catch {
      setDeleting(false)
      setConfirmingDelete(false)
      setDeleteFailed(true)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      {/* Figma: 08c · Job Detail · Menu (Action Menu 71:2182) — "more" opens Edit/Delete. */}
      <TopBar
        variant="child"
        title={job.workOrder}
        onBack={() => navigate(-1)}
        action={<MoreHorizontal size={24} strokeWidth={1.5} />}
        onAction={() => setMenuOpen(true)}
      />
      {deleteFailed && <SyncBanner state="error" message="Couldn't delete this job — tap to retry" onRetry={() => setConfirmingDelete(true)} />}
      {editFailed && <SyncBanner state="error" message="Couldn't open this job for editing — tap to retry" onRetry={() => void edit()} />}

      <div className="app-col flex flex-1 flex-col gap-lg p-lg pb-5xl">
        {/* Desktop (320:15062): head block and status banner side by side (358px each, banner
            bottom-aligned), then Service summary | Documents in one row. */}
        <div className="flex w-full flex-col gap-lg md:flex-row md:items-end">
          <div className="flex flex-col gap-xs md:w-[358px] md:shrink-0">
            <p className="text-h1 text-ink">{job.customer}</p>
            <p className="text-body text-ink-soft">{job.address}</p>
            <div className="flex items-center gap-sm">
              <span className={`rounded-full px-md py-2xs text-label ${badgeClass[job.status]}`}>{badgeLabel[job.status]}</span>
              {job.completedMeta && <p className="text-caption text-ink-faint">{job.completedMeta}</p>}
            </div>
            {job.customerNotes && <CustomerNotesCallout notes={job.customerNotes} />}
          </div>

          {job.finalStatus && (
            <div className="w-full md:w-[358px] md:shrink-0">
              <StatusBanner color={job.finalStatus.color} label={job.finalStatus.label} description={job.finalStatus.description} />
            </div>
          )}
        </div>

        {(job.summary || job.documents) && (
        <div className="flex w-full flex-col gap-lg md:flex-row md:items-stretch">
        {job.summary && (
          <Section label="SERVICE SUMMARY" className="md:min-w-0 md:flex-1" cardClassName="md:flex-1">
            <div className="flex w-full flex-col gap-2xs rounded-xs bg-canvas p-md text-caption">
              {job.summary.map((row) => (
                <div key={row.label} className="flex w-full items-start gap-sm">
                  <p className="w-24 shrink-0 text-label text-ink-faint">{row.label}</p>
                  <p className="min-w-0 flex-1 text-ink">{row.value}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {job.documents && (
          <Section label="DOCUMENTS" className="md:min-w-0 md:flex-1" cardClassName="md:flex-1">
            <div className="flex w-full flex-col gap-2xs">
              {job.documents.map((doc) => (
                <DocumentRow
                  key={doc.kind}
                  title={doc.title}
                  meta={doc.meta}
                  state={doc.status}
                  onClick={
                    doc.status === 'ready' && doc.path
                      ? () => void openStoredDocument(doc.path as string).catch(() => reload())
                      : doc.status === 'error'
                        ? () => void requestPdfs(job.id, [doc.kind]).then(reload)
                        : undefined
                  }
                />
              ))}
            </div>
          </Section>
        )}
        </div>
        )}

        {job.photos && (
          <Section label={`PHOTOS · ${job.photos.length}`}>
            <div className="flex w-full gap-xs">
              {job.photos.map((photo, i) => (
                <PhotoTile key={i} src={photo} onView={() => setPreview(photo)} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {job.documents && (
        <div className="w-full shrink-0 border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
          <div className="app-col flex md:justify-end">
            <Button
              variant="primary"
              icon={<Share size={16} strokeWidth={1.5} />}
              className="w-full md:w-auto md:min-w-[200px]"
              disabled={job.documents.some((d) => d.status !== 'ready')}
              onClick={() => setShareOpen(true)}
            >
              Share PDFs
            </Button>
          </div>
        </div>
      )}

      {shareOpen && <ShareSheet job={job} onClose={() => setShareOpen(false)} />}

      {menuOpen && (
        <ActionMenu
          onEdit={() => {
            setMenuOpen(false)
            void edit()
          }}
          onDelete={() => {
            setMenuOpen(false)
            setConfirmingDelete(true)
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {confirmingDelete && (
        <Dialog
          icon={
            <img
              src="/images/illustrations/dialog-delete.webp"
              srcSet="/images/illustrations/dialog-delete.webp 1x, /images/illustrations/dialog-delete@2x.webp 2x"
              alt=""
              className="h-[140px] w-auto"
            />
          }
          title="Delete this job?"
          message={`${job.workOrder} · ${job.customer}, its service report, invoice and photos will be permanently removed on all devices.`}
          primaryLabel={deleting ? 'Deleting…' : 'Delete job'}
          onPrimary={() => {
            if (!deleting) void confirmDelete()
          }}
          secondaryLabel="Cancel"
          onSecondary={() => {
            if (!deleting) setConfirmingDelete(false)
          }}
        />
      )}

      <PhotoLightbox src={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
