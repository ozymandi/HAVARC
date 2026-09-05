import { MoreHorizontal, Share } from 'lucide-react'
import { useState } from 'react'
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
import { TopBar } from '../components/TopBar'
import { MOCK_JOBS, removeJob } from '../data/mockJobs'

const badgeClass: Record<'draft' | 'completed' | 'pending', string> = {
  draft: 'bg-warning-soft text-warning',
  completed: 'bg-success-soft text-success',
  pending: 'bg-selected text-link',
}

const badgeLabel = { draft: 'Draft', completed: 'Completed', pending: 'Pending sync' } as const

/** Figma: 08 · Job Detail (100:3229). Summary/status/documents/photos only render once the
 *  job has gone through Step 4 · Complete Service Call — a draft or pending job simply
 *  doesn't have that data yet. */
export function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = MOCK_JOBS.find((j) => j.id === id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  if (!job) return <Navigate to="/jobs" replace />

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

      <div className="flex flex-1 flex-col gap-lg p-lg pb-5xl">
        <div className="flex flex-col gap-xs">
          <p className="text-h1 text-ink">{job.customer}</p>
          <p className="text-body text-ink-soft">{job.address}</p>
          <div className="flex items-center gap-sm">
            <span className={`rounded-full px-md py-2xs text-label ${badgeClass[job.status]}`}>{badgeLabel[job.status]}</span>
            {job.completedMeta && <p className="text-caption text-ink-faint">{job.completedMeta}</p>}
          </div>
          {job.customerNotes && <CustomerNotesCallout notes={job.customerNotes} />}
        </div>

        {job.finalStatus && <StatusBanner color={job.finalStatus.color} label={job.finalStatus.label} description={job.finalStatus.description} />}

        {job.summary && (
          <Section label="SERVICE SUMMARY">
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
          <Section label="DOCUMENTS">
            <div className="flex w-full flex-col gap-2xs">
              {job.documents.map((doc) => (
                <DocumentRow
                  key={doc.title}
                  title={doc.title}
                  meta={doc.meta}
                  onClick={doc.title.startsWith('Invoice') ? () => navigate(`/jobs/${job.id}/invoice`) : undefined}
                />
              ))}
            </div>
          </Section>
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
        <div className="flex w-full shrink-0 border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
          <Button variant="primary" icon={<Share size={16} strokeWidth={1.5} />} className="w-full" onClick={() => setShareOpen(true)}>
            Share PDFs
          </Button>
        </div>
      )}

      {shareOpen && <ShareSheet job={job} onClose={() => setShareOpen(false)} />}

      {menuOpen && (
        <ActionMenu
          onEdit={() => {
            // Editing a completed job would need Step 1-4 pre-filled from its existing
            // data, which isn't a capability yet — left as a stub until that's built.
            setMenuOpen(false)
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
          primaryLabel="Delete job"
          onPrimary={() => {
            removeJob(job.id)
            navigate('/jobs')
          }}
          secondaryLabel="Cancel"
          onSecondary={() => setConfirmingDelete(false)}
        />
      )}

      <PhotoLightbox src={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
