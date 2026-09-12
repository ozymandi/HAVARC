import { supabase } from '../lib/supabase'
import { companyFromSettings } from '../pdf/company'
import type { PdfKind, PdfSource } from '../pdf/data'
import { PDF_JOB_SELECT, type PdfJobRow } from '../pdf/query'
import { fetchSettings } from './settings'

const SIGNED_URL_TTL = 60 * 60

/** Everything the PDF templates need for one job, loaded with the app's own session
 *  (in-app preview). The Vercel function builds the same shape with the service key. */
export async function fetchPdfSource(jobId: string): Promise<PdfSource | null> {
  const [{ data, error }, settings] = await Promise.all([
    supabase.from('jobs').select(PDF_JOB_SELECT).eq('id', jobId).maybeSingle(),
    fetchSettings(),
  ])
  if (error) throw error
  if (!data) return null
  const job = data as unknown as PdfJobRow

  const photoPaths = job.photos.map((p) => p.storage_path)
  const [photoUrls, customerSignatureUrl, technicianSignatureUrl] = await Promise.all([
    photoPaths.length ? supabase.storage.from('photos').createSignedUrls(photoPaths, SIGNED_URL_TTL) : Promise.resolve({ data: [] }),
    signed('signatures', job.customer_signature_path),
    signed('signatures', job.technician_signature_path),
  ])
  return {
    job,
    photoUrls: Object.fromEntries((photoUrls.data ?? []).flatMap((u) => (u.signedUrl && u.path ? [[u.path, u.signedUrl]] : []))),
    customerSignatureUrl,
    technicianSignatureUrl,
    company: companyFromSettings(settings),
  }
}

const signed = async (bucket: string, path: string | null): Promise<string | null> => {
  if (!path) return null
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL)
  return data?.signedUrl ?? null
}

/** Asks the server to (re)generate a job's PDFs. The `documents` rows go to `pending` first
 *  so Job Detail shows "Generating…" at once; the function flips them to `ready` / `error`.
 *  Fire-and-forget: a failed request leaves the rows pending and Job Detail offers a retry. */
export async function requestPdfs(jobId: string, kinds: PdfKind[] = ['report', 'invoice']): Promise<void> {
  await supabase
    .from('documents')
    .upsert(
      kinds.map((kind) => ({ job_id: jobId, kind, status: 'pending' as const, error: null })),
      { onConflict: 'job_id,kind' },
    )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return
  await fetch('/api/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ jobId, kinds }),
  }).catch(() => undefined)
}

/** Signed URL (one hour) for a generated PDF in the private `documents` bucket. */
export async function documentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, SIGNED_URL_TTL)
  if (error || !data) throw error ?? new Error('No URL')
  return data.signedUrl
}

/** Opens a generated PDF in a new tab. */
export async function openStoredDocument(path: string): Promise<void> {
  window.open(await documentUrl(path), '_blank', 'noopener')
}
