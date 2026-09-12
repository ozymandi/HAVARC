import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { SyncBanner } from '../components/SyncBanner'
import { TopBar } from '../components/TopBar'
import { logoUrl, saveSettings, uploadLogo, useSettings, type CompanySettings } from '../data/settings'
import { useAsync } from '../hooks/useAsync'
import { supabase } from '../lib/supabase'

const SAVE_DELAY_MS = 600

/** Figma: 09 · Settings (100:4600). The form is the single `settings` row; there is no
 *  Save button in the design, so edits are written back a moment after typing stops
 *  (one update per pause, not per keystroke). The logo goes to Storage and is shown via
 *  a signed URL; the bundled PDF logo stands in until one is uploaded. */
export function Settings() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: saved, error: loadError, reload } = useSettings()

  // The loaded row is the form until the first edit; edits then carry the full row.
  const [edits, setEdits] = useState<CompanySettings | null>(null)
  const form = edits ?? saved
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const { data: storedLogo } = useAsync(() => (saved?.logo_path ? logoUrl(saved.logo_path) : Promise.resolve(null)), `logo:${saved?.logo_path ?? ''}`)
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null)
  const logo = uploadedLogo ?? storedLogo

  // Debounced autosave of whatever changed since the row was loaded.
  useEffect(() => {
    if (!dirty || !form) return
    const timer = setTimeout(() => {
      const { logo_path: _logo, ...fields } = form
      saveSettings(fields).then(
        () => {
          setDirty(false)
          setSaveError(false)
        },
        () => setSaveError(true),
      )
    }, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [dirty, form])

  const patch = (changes: Partial<CompanySettings>) => {
    if (!form) return
    setEdits({ ...form, ...changes })
    setDirty(true)
  }

  const changeLogo = async (file: File | undefined) => {
    if (!file) return
    try {
      const path = await uploadLogo(file)
      setUploadedLogo(await logoUrl(path))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar variant="child" title="Settings" onBack={() => navigate(-1)} />
      {loadError && <SyncBanner state="error" message="Couldn't load settings — tap to retry" onRetry={reload} />}
      {saveError && <SyncBanner state="error" message="Couldn't save settings — tap to retry" onRetry={() => setDirty(true)} />}

      <div className="app-col flex flex-1 flex-col gap-lg p-lg">
        {form && (
          <div className="flex w-full flex-col gap-lg md:flex-row md:items-stretch">
            <Section label="COMPANY & BRANDING" className="md:min-w-0 md:flex-1">
              <div className="flex w-full flex-col gap-md p-md">
                <div className="flex w-full items-center gap-md">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[13px] brand-gradient">
                    <img src={logo ?? '/brand/logo-pdf.png'} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2xs">
                    <p className="text-body-strong text-ink">Logo for PDFs</p>
                    <p className="text-caption text-ink-faint">PNG or SVG · min 512 px</p>
                  </div>
                  <label>
                    <input type="file" accept="image/png,image/svg+xml" className="hidden" onChange={(e) => void changeLogo(e.target.files?.[0])} />
                    <span className="flex h-[var(--size-control)] cursor-pointer items-center justify-center rounded-sm px-lg text-button text-brand">Change</span>
                  </label>
                </div>
                <FormField label="Company name" value={form.company_name} onChange={(e) => patch({ company_name: e.target.value })} />
                <FormField label="Tagline" value={form.tagline ?? ''} onChange={(e) => patch({ tagline: e.target.value })} />
                <div className="flex w-full flex-col gap-sm">
                  <FormField label="Phone" type="tel" value={form.phone ?? ''} onChange={(e) => patch({ phone: e.target.value })} />
                  <FormField label="Email" type="email" value={form.email ?? ''} onChange={(e) => patch({ email: e.target.value })} />
                </div>
                <FormField label="Address" value={form.address ?? ''} onChange={(e) => patch({ address: e.target.value })} />
              </div>
            </Section>

            <Section label="INVOICE DEFAULTS" className="md:min-w-0 md:flex-1" cardClassName="md:flex-1">
              <div className="flex w-full flex-col gap-md p-md">
                <div className="flex w-full gap-2xs">
                  <FormField
                    className="min-w-0 flex-1"
                    label="Default tax rate %"
                    type="number"
                    value={form.default_tax_rate}
                    onChange={(e) => patch({ default_tax_rate: Number(e.target.value) })}
                  />
                  <FormField
                    className="min-w-0 flex-1"
                    label="Labor rate $/hr"
                    type="number"
                    value={form.labor_rate}
                    onChange={(e) => patch({ labor_rate: Number(e.target.value) })}
                  />
                </div>
                <div className="flex w-full gap-2xs">
                  <FormField
                    className="min-w-0 flex-1"
                    label="Next invoice #"
                    type="number"
                    value={form.next_invoice_number}
                    onChange={(e) => patch({ next_invoice_number: Math.max(1, Math.floor(Number(e.target.value) || 0)) })}
                  />
                  <FormField
                    className="min-w-0 flex-1"
                    label="Invoice prefix"
                    value={form.invoice_prefix}
                    onChange={(e) => patch({ invoice_prefix: e.target.value })}
                    placeholder="e.g. INV-"
                  />
                </div>
                <FormField label="Invoice footer note" type="textarea" value={form.invoice_footer ?? ''} onChange={(e) => patch({ invoice_footer: e.target.value })} />
              </div>
            </Section>
          </div>
        )}

        <Section label="ACCOUNT" cardClassName="md:w-[calc(50%-8px)]">
          <div className="flex w-full flex-col gap-md p-md">
            <FormField label="Signed in as" value={session?.user.email ?? ''} disabled readOnly />
            <Button variant="secondary" className="w-full" onClick={() => navigate('/settings/change-password')}>
              Change password
            </Button>
            <Button variant="text" icon={<LogOut size={16} strokeWidth={1.5} />} className="w-full" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </Section>

        <p className="mt-auto w-full text-center text-caption text-ink-faint">Version 1.0.0 · Last sync 2 min ago</p>
      </div>
    </div>
  )
}
