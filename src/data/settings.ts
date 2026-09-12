import { useAsync } from '../hooks/useAsync'
import { supabase } from '../lib/supabase'

/** The single `settings` row (id = true), as stored. */
export interface CompanySettings {
  company_name: string
  tagline: string | null
  phone: string | null
  email: string | null
  address: string | null
  logo_path: string | null
  default_tax_rate: number
  labor_rate: number
  next_invoice_number: number
  invoice_prefix: string
  invoice_footer: string | null
  notify_email: string | null
}

const COLUMNS =
  'company_name, tagline, phone, email, address, logo_path, default_tax_rate, labor_rate, next_invoice_number, invoice_prefix, invoice_footer, notify_email'

export async function fetchSettings(): Promise<CompanySettings> {
  const { data, error } = await supabase.from('settings').select(COLUMNS).eq('id', true).single()
  if (error) throw error
  return data as unknown as CompanySettings
}

export async function saveSettings(patch: Partial<CompanySettings>): Promise<void> {
  const { error } = await supabase.from('settings').update(patch).eq('id', true)
  if (error) throw error
}

/** Logo lives in the private `documents` bucket under `branding/`; the page shows it via a
 *  short-lived signed URL (the PDF generator will read the same path server-side). */
export async function uploadLogo(file: File): Promise<string> {
  const ext = file.type === 'image/svg+xml' ? 'svg' : 'png'
  const path = `branding/logo.${ext}`
  const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  await saveSettings({ logo_path: path })
  return path
}

export async function logoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 60)
  if (error) throw error
  return data.signedUrl
}

export const useSettings = () => useAsync(fetchSettings, 'settings')
