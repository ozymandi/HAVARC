import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { generatePdfs } from '../api/_pdf'

/* Local run of the PDF function against the Vite dev server, with the desktop Chrome:
 *   npx tsx scripts/pdf-local.ts <jobId> [outDir]
 * Reads VITE_SUPABASE_URL / SUPABASE_SECRET_KEY from .env.local; CHROME_PATH overrides the
 * browser. Writes the same files to Storage as production and copies them to outDir. */

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => l.split('=', 2).map((s) => s.trim())),
)
const [jobArg, outDir = '.'] = process.argv.slice(2)
if (!jobArg) throw new Error('job id or work order required')

const service = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
const jobId = /^[0-9a-f-]{36}$/i.test(jobArg)
  ? jobArg
  : ((await service.from('jobs').select('id').eq('work_order', jobArg).single()).data?.id as string | undefined)
if (!jobId) throw new Error(`No job ${jobArg}`)

const executablePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const origin = process.env.PDF_ORIGIN ?? 'http://localhost:5173'

const documents = await generatePdfs({
  supabaseUrl: env.VITE_SUPABASE_URL,
  serviceKey: env.SUPABASE_SECRET_KEY,
  jobId,
  kinds: ['report', 'invoice'],
  origin,
  executablePath,
})

for (const doc of documents) {
  const { data, error } = await service.storage.from('documents').download(doc.path)
  if (error || !data) throw error ?? new Error('download failed')
  const file = join(outDir, `${jobId.slice(0, 8)}-${doc.kind}.pdf`)
  writeFileSync(file, Buffer.from(await data.arrayBuffer()))
  console.log(doc.kind, doc.size, 'bytes →', file)
}
