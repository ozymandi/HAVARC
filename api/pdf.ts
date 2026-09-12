import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generatePdfs } from './_pdf.js'

/* POST /api/pdf  { jobId, kinds?: ('report'|'invoice')[] }
 * Caller must be a signed-in app user (Supabase access token as Bearer); the work itself
 * runs with the service key. Chromium comes from @sparticuz/chromium (Linux, serverless). */

const KINDS = ['report', 'invoice'] as const

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: 'Server is missing Supabase configuration' })

  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Sign in required' })
  const {
    data: { user },
  } = await createClient(supabaseUrl, anonKey, { auth: { persistSession: false } }).auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Sign in required' })

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { jobId?: string; kinds?: string[] }
  const jobId = body?.jobId
  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) return res.status(400).json({ error: 'jobId required' })
  const kinds = (body.kinds ?? [...KINDS]).filter((k): k is (typeof KINDS)[number] => (KINDS as readonly string[]).includes(k))
  if (kinds.length === 0) return res.status(400).json({ error: 'No document kinds requested' })

  const chromium = (await import('@sparticuz/chromium')).default
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? ''
  const origin = process.env.PDF_ORIGIN ?? `https://${host}`

  try {
    const documents = await generatePdfs({
      supabaseUrl,
      serviceKey,
      jobId,
      kinds,
      origin,
      executablePath: await chromium.executablePath(),
      launchArgs: chromium.args,
    })
    return res.status(200).json({ documents })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
