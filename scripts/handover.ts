import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

/* Handover, our side (task.md "On approval", steps 1–2), against the live project:
 *   npx tsx scripts/handover.ts            # dry run: prints what would change, changes nothing
 *   npx tsx scripts/handover.ts --apply    # does it
 * Reads VITE_SUPABASE_URL / SUPABASE_SECRET_KEY from .env.local (same as pdf-local.ts).
 * Run it from a terminal — the agent sandbox blocks it, like config:push.
 *   1. Auth: creates the client's logins (confirmed, random password — each person then uses
 *      "Forgot password?" in the app), deletes the test login owner@havarc.com.
 *   2. Data: every job (cascades to equipment, readings, findings, photos, invoices, documents),
 *      every customer, every object in the photos / signatures / documents buckets.
 *   3. Settings: invoice prefix and next number from the client (2026-09-16). */

const env: Record<string, string> = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => l.split('=', 2).map((s) => s.trim()) as [string, string]),
)
const apply = process.argv.includes('--apply')
const NEW_USERS = ['tholloway@havarcservices.com', 'ddial@havarcservices.com']
const REMOVE_USERS = ['owner@havarc.com']
const SETTINGS = { invoice_prefix: 'INV-', next_invoice_number: 1234 }
const BUCKETS = ['photos', 'signatures', 'documents']

const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
function fail(what: string, error: { message: string } | null): asserts error is null {
  if (error) throw new Error(`${what}: ${error.message}`)
}
console.log(apply ? '== APPLY ==' : '== DRY RUN (add --apply to execute) ==')

// 1. Auth users
const { data: userPage, error: listErr } = await db.auth.admin.listUsers({ perPage: 1000 })
fail('list users', listErr)
const users = userPage.users
console.log('users now:', users.map((u) => u.email).join(', '))
for (const email of NEW_USERS) {
  if (users.some((u) => u.email === email)) {
    console.log(`  keep   ${email} (exists)`)
    continue
  }
  console.log(`  create ${email}`)
  if (apply) {
    const { error } = await db.auth.admin.createUser({ email, password: randomBytes(24).toString('base64url'), email_confirm: true })
    fail(`create ${email}`, error)
  }
}
for (const email of REMOVE_USERS) {
  const u = users.find((x) => x.email === email)
  if (!u) continue
  console.log(`  delete ${email}`)
  if (apply) fail(`delete ${email}`, (await db.auth.admin.deleteUser(u.id)).error)
}

// 2. Data
const { data: jobs, error: jobsErr } = await db.from('jobs').select('id, work_order')
fail('list jobs', jobsErr)
const { data: customers, error: custErr } = await db.from('customers').select('id, name')
fail('list customers', custErr)
console.log(`jobs to delete (${jobs.length}):`, jobs.map((j) => j.work_order).join(', ') || '—')
console.log(`customers to delete (${customers.length}):`, customers.map((c) => c.name).join(', ') || '—')
for (const bucket of BUCKETS) {
  const { data: folders, error } = await db.storage.from(bucket).list('', { limit: 1000 })
  fail(`list ${bucket}`, error)
  const paths: string[] = []
  for (const f of folders) {
    if (f.id) {
      paths.push(f.name) // a file at the root
      continue
    }
    const { data: files, error: e2 } = await db.storage.from(bucket).list(f.name, { limit: 1000 })
    fail(`list ${bucket}/${f.name}`, e2)
    paths.push(...files.filter((x) => x.id).map((x) => `${f.name}/${x.name}`))
  }
  console.log(`${bucket}: ${paths.length} object(s) to delete`)
  if (apply && paths.length) fail(`empty ${bucket}`, (await db.storage.from(bucket).remove(paths)).error)
}
if (apply) {
  if (jobs.length) fail('delete jobs', (await db.from('jobs').delete().in('id', jobs.map((j) => j.id))).error)
  if (customers.length) fail('delete customers', (await db.from('customers').delete().in('id', customers.map((c) => c.id))).error)
}

// 3. Settings
const { data: settings, error: setErr } = await db.from('settings').select('id, invoice_prefix, next_invoice_number, notify_email')
fail('read settings', setErr)
for (const s of settings) {
  console.log(`settings ${s.id}: prefix "${s.invoice_prefix}" → "${SETTINGS.invoice_prefix}", next ${s.next_invoice_number} → ${SETTINGS.next_invoice_number}, notify_email stays ${s.notify_email}`)
  if (apply) fail('update settings', (await db.from('settings').update(SETTINGS).eq('id', s.id)).error)
}
console.log(apply ? 'done' : 'nothing changed')
