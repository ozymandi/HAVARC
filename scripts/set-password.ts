import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

/* Sets an app login's password directly (Admin API), for a client who sent us the password
 * they want instead of using "Forgot password?":
 *   npx tsx scripts/set-password.ts <email> "<password>"
 * Reads VITE_SUPABASE_URL / SUPABASE_SECRET_KEY from .env.local. Run it from a terminal (the
 * agent sandbox blocks it). The password rule is the app's: 8+ characters with a digit. */

const env: Record<string, string> = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => l.split('=', 2).map((s) => s.trim()) as [string, string]),
)
const [email, password] = process.argv.slice(2)
if (!email || !password) throw new Error('usage: npx tsx scripts/set-password.ts <email> "<password>"')
if (password.length < 8 || !/\d/.test(password)) throw new Error('password must be 8+ characters with a digit')

const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 })
if (error) throw error
const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) throw new Error(`no user ${email}`)
const { error: updErr } = await db.auth.admin.updateUserById(user.id, { password })
if (updErr) throw updErr
console.log(`password set for ${email}: ${password.length} characters, starts "${password.slice(0, 3)}…", ends "…${password.slice(-2)}"`)
