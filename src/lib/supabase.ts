import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  throw new Error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).')
}

/** Single browser client. The publishable (anon) key only ever reaches data through RLS,
 *  which requires a signed-in user — every table is "authenticated full access", so the
 *  session is the whole permission model. Sessions persist in localStorage and refresh
 *  themselves, which is what keeps the installed PWA signed in between visits. */
export const supabase = createClient(url, anonKey)

/** Where the password-reset email link lands. Must be listed under Auth → URL Configuration →
 *  Redirect URLs in the Supabase project, otherwise Supabase falls back to its Site URL. */
export const resetPasswordRedirect = () => `${window.location.origin}/reset-password`
