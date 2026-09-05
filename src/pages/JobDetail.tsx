import { MoreHorizontal, Share } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { CustomerNotesCallout } from '../components/CustomerNotesCallout'
import { DocumentRow } from '../components/DocumentRow'
import { PhotoTile } from '../components/PhotoTile'
import { Section } from '../components/Section'
import { StatusBanner } from '../components/StatusBanner'
import { TopBar } from '../components/TopBar'
import { MOCK_JOBS } from '../data/mockJobs'

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

  if (!job) return <Navigate to="/jobs" replace />

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      {/* Figma: Top Bar action here is "more" (08c · Job Detail · Menu, Action Menu 71:2182)
          — the menu itself (edit / delete) isn't built yet, just the correct icon. */}
      <TopBar variant="child" title={job.workOrder} onBack={() => navigate(-1)} action={<MoreHorizontal size={24} strokeWidth={1.5} />} />

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

        {job.photoCount !== undefined && (
          <Section label={`PHOTOS · ${job.photoCount}`}>
            <div className="flex w-full gap-xs">
              {Array.from({ length: job.photoCount }).map((_, i) => (
                <PhotoTile key={i} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {job.documents && (
        <div className="flex w-full shrink-0 border-t border-line bg-surface px-lg pb-2xl pt-md shadow-nav">
          <Button variant="primary" icon={<Share size={16} strokeWidth={1.5} />} className="w-full">
            Share PDFs
          </Button>
        </div>
      )}
    </div>
  )
}
