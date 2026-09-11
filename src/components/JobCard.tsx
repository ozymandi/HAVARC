import { ChevronRight } from 'lucide-react'

/** Figma: Job Card (16:48) — "Row in the jobs list. Work order + status badge, customer,
 *  address/date meta, chevron." Badge (16:9): Draft / Completed / Pending sync. */
export type JobStatus = 'draft' | 'completed' | 'pending'

interface JobCardProps {
  workOrder: string
  customer: string
  meta: string
  status: JobStatus
  onClick?: () => void
}

const badgeClass: Record<JobStatus, string> = {
  draft: 'bg-warning-soft text-warning',
  completed: 'bg-success-soft text-success',
  pending: 'bg-selected text-link',
}

const badgeLabel: Record<JobStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
  pending: 'Pending sync',
}

export function JobCard({ workOrder, customer, meta, status, onClick }: JobCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-md rounded-xs bg-surface py-md pl-lg pr-sm text-left shadow-card transition-colors hover:bg-selected"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-sm">
        <div className="flex w-full items-center gap-sm">
          <p className="text-body-strong text-brand">{workOrder}</p>
          <span className={`rounded-full px-md py-2xs text-label ${badgeClass[status]}`}>{badgeLabel[status]}</span>
        </div>
        <div className="flex w-full flex-col gap-[2px]">
          <p className="text-body text-ink">{customer}</p>
          <p className="text-caption text-ink-faint">{meta}</p>
        </div>
      </div>
      <ChevronRight size={20} strokeWidth={1.5} className="mt-1 shrink-0 text-icon-soft" />
    </button>
  )
}
