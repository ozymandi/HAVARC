import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer-core'
import type { Database } from '../src/lib/database.types.js'
import { companyFromSettings } from '../src/pdf/company.js'
import { buildInvoiceData, buildReportData, encodePdfPayload, type PdfKind, type PdfPayload, type PdfSource } from '../src/pdf/data.js'
import { PDF_JOB_SELECT, one, type PdfJobRow } from '../src/pdf/query.js'
import { sendDocumentsEmail, smtpConfigured } from './_email.js'

/* Server-side PDF generation (backend plan, step 6). Loads the job with the service key,
 * builds the same template data the app uses, renders the app's own /print routes in
 * headless Chrome, stores the files in the private `documents` bucket and records them in
 * the `documents` table. Files starting with "_" are not deployed as functions. */

export interface GenerateOptions {
  supabaseUrl: string
  serviceKey: string
  jobId: string
  kinds: PdfKind[]
  /** Origin that serves the app (and so the /print routes and fonts), e.g. https://havarc.vercel.app */
  origin: string
  executablePath: string
  launchArgs?: string[]
}

export interface GeneratedDocument {
  kind: PdfKind
  path: string
  size: number
}

const SIGNED_URL_TTL = 15 * 60
const KIND_LABEL: Record<PdfKind, string> = { report: 'Service Report', invoice: 'Invoice' }

export async function generatePdfs(opts: GenerateOptions): Promise<GeneratedDocument[]> {
  const started = Date.now()
  const log = (stage: string) => console.log(`pdf ${opts.jobId.slice(0, 8)} ${stage} +${Date.now() - started}ms`)
  const service = createClient<Database>(opts.supabaseUrl, opts.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  /** Job Detail treats a `pending` row untouched for 2 minutes as dead; touching the rows at
   *  each stage keeps a slow (cold-start) run from being shown as failed while it works. */
  const heartbeat = async (kinds: PdfKind[]) => {
    await service.from('documents').upsert(kinds.map((kind) => ({ job_id: opts.jobId, kind, status: 'pending' as const, error: null })), { onConflict: 'job_id,kind' })
  }
  await heartbeat(opts.kinds)
  const { source, notifyEmail } = await loadSource(service, opts.jobId)
  log('source loaded')
  const rendered = new Map<PdfKind, Uint8Array>()

  const browser = await puppeteer.launch({
    executablePath: opts.executablePath,
    args: opts.launchArgs ?? [],
    headless: true,
    defaultViewport: { width: 612, height: 792, deviceScaleFactor: 1 },
  })
  log('browser launched')
  const results: GeneratedDocument[] = []
  try {
    for (const kind of opts.kinds) {
      try {
        await heartbeat([kind])
        const pdf = await renderKind(browser, opts.origin, kind, source)
        log(`${kind} rendered (${pdf.byteLength} bytes)`)
        const path = `${opts.jobId}/${kind}.pdf`
        const { error: uploadError } = await service.storage.from('documents').upload(path, pdf, { contentType: 'application/pdf', upsert: true })
        if (uploadError) throw uploadError
        const { error: rowError } = await service
          .from('documents')
          .upsert({ job_id: opts.jobId, kind, status: 'ready', storage_path: path, size_bytes: pdf.byteLength, error: null }, { onConflict: 'job_id,kind' })
        if (rowError) throw rowError
        rendered.set(kind, pdf)
        results.push({ kind, path, size: pdf.byteLength })
        log(`${kind} stored`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await service.from('documents').upsert({ job_id: opts.jobId, kind, status: 'error', error: message }, { onConflict: 'job_id,kind' })
        throw new Error(`${KIND_LABEL[kind]}: ${message}`)
      }
    }
  } finally {
    await browser.close()
    log('browser closed')
  }

  // Step 8 part 2: the finished documents go to the office (Settings → notify email).
  // Never fatal — a mail problem must not turn a generated PDF into an error row.
  if (notifyEmail && smtpConfigured()) {
    try {
      await emailDocuments(service, opts, source, notifyEmail, rendered)
      log('email sent')
    } catch (err) {
      console.error('documents email failed', err)
    }
  } else if (notifyEmail) {
    console.warn('documents email skipped: SMTP_USER / SMTP_PASS / SMTP_SENDER not set')
  }
  return results
}

/** Attaches both PDFs (the ones just rendered, the other one from Storage) and stamps
 *  documents.emailed_at on the rows that went out. */
async function emailDocuments(
  service: SupabaseClient<Database>,
  opts: GenerateOptions,
  source: PdfSource,
  to: string,
  rendered: Map<PdfKind, Uint8Array>,
): Promise<void> {
  const wo = source.job.work_order.replace(/[^\w.-]+/g, '-')
  const number = one(source.job.invoice)?.number
  const attachments: { kind: PdfKind; filename: string; content: Uint8Array }[] = []
  for (const kind of ['report', 'invoice'] as PdfKind[]) {
    let content = rendered.get(kind)
    if (!content) {
      const { data } = await service.storage.from('documents').download(`${opts.jobId}/${kind}.pdf`)
      if (!data) continue
      content = new Uint8Array(await data.arrayBuffer())
    }
    attachments.push({
      kind,
      filename: kind === 'report' ? `${wo}-service-report.pdf` : `${wo}-invoice${number ? `-${number.replace(/[^\w.-]+/g, '-')}` : ''}.pdf`,
      content,
    })
  }
  if (attachments.length === 0) return
  await sendDocumentsEmail({ to, job: source.job, company: source.company, origin: opts.origin, attachments })
  const { error } = await service
    .from('documents')
    .update({ emailed_at: new Date().toISOString() })
    .eq('job_id', opts.jobId)
    .in('kind', attachments.map((a) => a.kind))
  if (error) throw error
}

async function loadSource(service: SupabaseClient<Database>, jobId: string): Promise<{ source: PdfSource; notifyEmail: string | null }> {
  const [{ data: job, error }, { data: settings, error: settingsError }] = await Promise.all([
    service.from('jobs').select(PDF_JOB_SELECT).eq('id', jobId).single(),
    service.from('settings').select('company_name, phone, email, address, invoice_footer, notify_email').eq('id', true).single(),
  ])
  if (error) throw error
  if (settingsError) throw settingsError
  const row = job as unknown as PdfJobRow

  const photoPaths = row.photos.map((p) => p.storage_path)
  const photoUrls: Record<string, string> = {}
  if (photoPaths.length) {
    const { data, error: urlError } = await service.storage.from('photos').createSignedUrls(photoPaths, SIGNED_URL_TTL)
    if (urlError) throw urlError
    for (const u of data) if (u.path && u.signedUrl) photoUrls[u.path] = u.signedUrl
  }
  const signed = async (path: string | null) => {
    if (!path) return null
    const { data, error: urlError } = await service.storage.from('signatures').createSignedUrl(path, SIGNED_URL_TTL)
    if (urlError) throw urlError
    return data.signedUrl
  }
  return {
    source: {
      job: row,
      photoUrls,
      customerSignatureUrl: await signed(row.customer_signature_path),
      technicianSignatureUrl: await signed(row.technician_signature_path),
      company: companyFromSettings(settings),
    },
    notifyEmail: settings.notify_email?.trim() || null,
  }
}

async function renderKind(browser: Awaited<ReturnType<typeof puppeteer.launch>>, origin: string, kind: PdfKind, source: PdfSource): Promise<Uint8Array> {
  const payload: PdfPayload =
    kind === 'report'
      ? { kind, company: source.company, report: buildReportData(source) }
      : { kind, company: source.company, invoice: buildInvoiceData(source) }
  const page = await browser.newPage()
  try {
    await page.goto(`${origin}/print/${kind}#data=${encodePdfPayload(payload)}`, { waitUntil: 'networkidle0', timeout: 30_000 })
    await page.waitForFunction('window.__pdfReady === true', { timeout: 15_000 })
    // Templates are 612×792 CSS px ("Letter at 72 dpi"); Chrome prints at 96 dpi, so 4/3
    // makes each sheet exactly one US Letter page.
    return await page.pdf({ format: 'letter', printBackground: true, scale: 4 / 3, margin: { top: 0, right: 0, bottom: 0, left: 0 } })
  } finally {
    await page.close()
  }
}
