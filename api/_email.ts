import nodemailer from 'nodemailer'
import type { PdfCompany } from '../src/pdf/company.js'
import type { PdfKind } from '../src/pdf/data.js'
import type { PdfJobRow } from '../src/pdf/query.js'
import { one } from '../src/pdf/query.js'

/* Backend plan, step 8 part 2: once a job's PDFs are generated they are emailed to the
 * address in Settings (notify_email) through the same Brevo SMTP relay that sends the
 * auth emails. Credentials come from SMTP_USER / SMTP_PASS / SMTP_SENDER (same names as
 * supabase/config.toml uses); without them the step is skipped, never fatal. */

export interface DocumentsEmail {
  to: string
  job: PdfJobRow
  company: PdfCompany
  /** Where the app is served from (kept for future links; the logo uses LOGO_URL). */
  origin: string
  attachments: { kind: PdfKind; filename: string; content: Uint8Array }[]
}

/** Same lockup as the password-reset email, always from the public app — a local run or a
 *  protected preview deployment would otherwise hand Gmail an address it cannot load. */
const LOGO_URL = `${process.env.APP_PUBLIC_URL ?? 'https://havarc.vercel.app'}/brand/header-lockup-big@3x.png`

const money = (n: number) => `$${n.toFixed(2)}`
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

const STATUS_LABEL: Record<string, string> = {
  green: 'Green · Operating Normally',
  yellow: 'Yellow · Repairs Recommended',
  orange: 'Orange · Limited Operation',
  red: 'Red · Not Operational',
}

export function smtpConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_SENDER)
}

export async function sendDocumentsEmail(mail: DocumentsEmail): Promise<void> {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  const { job, company } = mail
  const inv = one(job.invoice)
  const subtotal = (inv?.items ?? []).reduce((sum, i) => sum + (i.customer_paid ? 0 : i.qty * i.unit_price), 0)
  const total = inv ? Math.max(0, subtotal + subtotal * (inv.tax_rate / 100) - inv.discount) : 0
  const [y, m, d] = job.job_date.split('-')
  const rows: [string, string][] = [
    ['Customer', job.customer_name],
    ['Address', job.address],
    ['Date', `${m}/${d}/${y}`],
    ['Technician', job.technician],
    ['Final status', job.final_status ? STATUS_LABEL[job.final_status] : '—'],
    ['Invoice', inv?.number ? `#${inv.number} · ${money(total)}` : 'Draft'],
  ]
  const subject = `${company.name} · Service Report & Invoice · ${job.work_order} · ${job.customer_name}`

  await transport.sendMail({
    from: { name: company.name, address: process.env.SMTP_SENDER as string },
    to: mail.to,
    subject,
    text: [
      `${job.work_order} · ${job.customer_name}`,
      ...rows.map(([k, v]) => `${k}: ${v}`),
      '',
      `Attached: ${mail.attachments.map((a) => a.filename).join(', ')}`,
    ].join('\n'),
    html: html(mail, rows),
    attachments: mail.attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content), contentType: 'application/pdf' })),
  })
}

/** Same look as the password-reset email (supabase/templates/recovery.html). */
const html = (mail: DocumentsEmail, rows: [string, string][]) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(mail.job.work_order)}</title></head>
<body style="margin:0;padding:0;background:#eef3f7;font-family:Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#172530;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3f7;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td align="center" style="background:#12365a;padding:28px 24px;">
    <img src="${LOGO_URL}" width="172" height="122" alt="${esc(mail.company.name)}" style="display:block;width:172px;height:122px;margin:0 auto;">
  </td></tr>
  <tr><td style="padding:28px 24px 4px;">
    <div style="font-size:20px;line-height:28px;font-weight:600;color:#172530;">Service Report &amp; Invoice</div>
    <div style="font-size:14px;line-height:20px;color:#9aabba;">${esc(mail.job.work_order)} · ${esc(mail.job.customer_name)}</div>
  </td></tr>
  <tr><td style="padding:16px 24px 8px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3f7;border-radius:8px;">
      ${rows
        .map(
          ([k, v]) => `<tr><td style="padding:8px 12px 0;font-size:11px;line-height:16px;letter-spacing:0.06em;text-transform:uppercase;color:#9aabba;white-space:nowrap;width:110px;vertical-align:top;">${esc(k)}</td><td style="padding:8px 12px 0;font-size:14px;line-height:20px;color:#172530;">${esc(v)}</td></tr>`,
        )
        .join('')}
      <tr><td colspan="2" style="padding:8px;"></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:12px 24px 28px;font-size:13px;line-height:20px;color:#9aabba;">
    Attached: ${mail.attachments.map((a) => esc(a.filename)).join(', ')}.
  </td></tr>
</table>
<div style="max-width:480px;padding:16px 8px 0;font-size:12px;line-height:18px;color:#9aabba;">${esc(mail.company.name)} &middot; ${esc(mail.company.address)} &middot; ${esc(mail.company.phone)}</div>
</td></tr></table>
</body></html>`
