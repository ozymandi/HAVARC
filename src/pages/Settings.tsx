import { Building2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { TopBar } from '../components/TopBar'

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/** Figma: 09 · Settings (100:4600). Everything here is local state — no company-profile
 *  or invoice-defaults backend exists yet, so nothing persists across a reload. */
export function Settings() {
  const navigate = useNavigate()

  const [logo, setLogo] = useState<string | null>('/brand/logo-pdf.png')
  const [companyName, setCompanyName] = useState("Hav' Arc Heating and Air")
  const [tagline, setTagline] = useState('Getting the job done right the first time.')
  const [phone, setPhone] = useState('678-750-0411')
  const [email, setEmail] = useState('hav.arcservices@gmail.com')
  const [address, setAddress] = useState('202 Spring Cir, Stockbridge, GA 30281')

  const [defaultTaxRate, setDefaultTaxRate] = useState(0)
  const [laborRate, setLaborRate] = useState(80)
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('649')
  const [invoicePrefix, setInvoicePrefix] = useState('')
  const [invoiceFooter, setInvoiceFooter] = useState('We appreciate your business! If you have any questions, please contact us at 678-750-0411.')

  const changeLogo = async (file: File | undefined) => {
    if (!file) return
    setLogo(await readFileAsDataUrl(file))
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar variant="child" title="Settings" onBack={() => navigate(-1)} />

      <div className="app-col flex flex-1 flex-col gap-lg p-lg">
        <div className="flex w-full flex-col gap-lg md:flex-row md:items-stretch">
        <Section label="COMPANY & BRANDING" className="md:min-w-0 md:flex-1">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full items-center gap-md">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[13px] brand-gradient">
                {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <Building2 size={28} strokeWidth={1.5} className="text-inverse opacity-70" />}
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
            <FormField label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <FormField label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            <div className="flex w-full flex-col gap-sm">
              <FormField label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <FormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <FormField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </Section>

        <Section label="INVOICE DEFAULTS" className="md:min-w-0 md:flex-1" cardClassName="md:flex-1">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full gap-2xs">
              <FormField
                className="min-w-0 flex-1"
                label="Default tax rate %"
                type="number"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
              />
              <FormField
                className="min-w-0 flex-1"
                label="Labor rate $/hr"
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(Number(e.target.value))}
              />
            </div>
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Next invoice #" value={nextInvoiceNumber} onChange={(e) => setNextInvoiceNumber(e.target.value)} />
              <FormField className="min-w-0 flex-1" label="Invoice prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="e.g. INV-" />
            </div>
            <FormField label="Invoice footer note" type="textarea" value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} />
          </div>
        </Section>
        </div>

        <Section label="ACCOUNT" cardClassName="md:w-[calc(50%-8px)]">
          <div className="flex w-full flex-col gap-md p-md">
            <FormField label="Signed in as" value="owner@havarc.com" disabled />
            <Button variant="secondary" className="w-full" onClick={() => navigate('/settings/change-password')}>
              Change password
            </Button>
            <Button variant="text" icon={<LogOut size={16} strokeWidth={1.5} />} className="w-full" onClick={() => navigate('/login')}>
              Sign out
            </Button>
          </div>
        </Section>

        <p className="mt-auto w-full text-center text-caption text-ink-faint">Version 1.0.0 · Last sync 2 min ago</p>
      </div>
    </div>
  )
}
