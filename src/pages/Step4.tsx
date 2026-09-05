import { FileText } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { AddPhotoTile, PhotoTile } from '../components/PhotoTile'
import { BottomNav } from '../components/BottomNav'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import type { Equipment } from '../components/EquipmentCard'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { SignatureCapture } from '../components/SignatureCapture'
import type { StatusColor } from '../components/StatusBanner'
import { StatusButtonGrid } from '../components/StatusButton'
import { clearDraft, readDraft, useDraftState } from '../data/draft'
import { EMPTY_INVOICE, type InvoiceData } from '../data/invoice'
import { InvoiceEditor } from './InvoiceEditor'

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

type Signer = 'customer' | 'technician' | null

const joinOr = (values: string[], fallback: string) => (values.length ? values.join(', ') : fallback)

/** Figma: 06 · Step 4 · Complete Service Call (100:3943), success state
 *  06b · Step 4 · Job saved (100:4004). */
export function Step4() {
  const navigate = useNavigate()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useDraftState<StatusColor | null>('step4.status', null)
  const [photos, setPhotos] = useDraftState<string[]>('step4.photos', [])
  const [customerName, setCustomerName] = useDraftState('step4.customerName', '')
  const [customerSignature, setCustomerSignature] = useDraftState<string | null>('step4.customerSignature', null)
  const [techSignature, setTechSignature] = useDraftState<string | null>('step4.techSignature', null)
  const [signing, setSigning] = useState<Signer>(null)
  const [saved, setSaved] = useState(false)

  // Final Review reads what the earlier steps actually captured (shared draft store).
  const workOrder = readDraft('step1.workOrder', '')
  const customer = readDraft('step1.customer', '')
  const address = readDraft('step1.address', '')
  const equipment = readDraft<Equipment[]>('step1.equipment', [])
  const findings = readDraft<string[]>('step3.findings', [])
  const repairs = readDraft<string[]>('step3.repairs', [])
  const serviceNotes = readDraft('step3.serviceNotes', '')
  const unit = equipment[0]
  const equipmentLabel = unit ? [unit.equipmentId, [unit.manufacturer, unit.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ') : ''

  // The draft invoice: description pre-fills from Step 3's service notes the first time
  // it's opened ("Pre-filled from technician notes — edit freely"), then the tech owns it.
  const [invoice, setInvoice] = useDraftState<InvoiceData>('step4.invoice', () => ({ ...EMPTY_INVOICE, description: serviceNotes }))
  const [editingInvoice, setEditingInvoice] = useState(false)

  const canComplete = status !== null && !!customerSignature && !!techSignature

  const addPhoto = async (file: File | undefined) => {
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    setPhotos((prev) => [...prev, dataUrl])
  }
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  const finish = (to: string) => {
    clearDraft()
    navigate(to)
  }

  // Same look as the Figma Signature Pad (17:69, size/signature 155): bordered box,
  // "Sign here" baseline when empty, the drawn signature centered when filled. Only the
  // interaction differs — tapping it opens the full-screen signing page instead of
  // drawing directly on this small box.
  const signatureSlot = (label: string, value: string | null, who: Exclude<Signer, null>) => (
    <div className="flex w-full flex-col gap-xs">
      <p className="text-label text-ink-soft">{label}</p>
      <button
        type="button"
        onClick={() => setSigning(who)}
        className="relative flex h-[155px] w-full flex-col items-center justify-end gap-md overflow-hidden rounded-xs border border-line-subtle bg-surface py-md pl-lg pr-sm"
      >
        {value ? <img src={value} alt={`${label} preview`} className="absolute inset-0 h-full w-full object-contain p-md" /> : <p className="text-caption text-ink-faint">Sign here</p>}
        <div className="h-px w-full border-t border-dashed border-line-dashed" />
      </button>
    </div>
  )

  const reviewRow = (label: string, value: string) => (
    <div className="flex w-full gap-sm">
      <p className="w-[88px] shrink-0 text-label text-ink-faint">{label}</p>
      <p className="min-w-0 flex-1 text-ink">{value}</p>
    </div>
  )

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AppHeader step={4} title="Complete Service Call" onExit={() => navigate('/jobs')} />

      <div className="flex flex-1 flex-col gap-lg p-lg">
        <Section label="FINAL SYSTEM STATUS">
          <div className="p-md">
            <StatusButtonGrid value={status} onChange={setStatus} />
          </div>
        </Section>

        <Section label="PHOTO DOCUMENTATION">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full gap-sm">
              {photos.map((src, i) => (
                <PhotoTile key={i} src={src} onRemove={() => removePhoto(i)} />
              ))}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  void addPhoto(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <AddPhotoTile onClick={() => photoInputRef.current?.click()} />
            </div>
            <p className="text-caption text-ink-faint">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · JPEG compressed on device before upload
            </p>
          </div>
        </Section>

        <Section label="CUSTOMER ACKNOWLEDGMENT">
          <div className="flex w-full flex-col gap-md p-md">
            <FormField
              label="Customer / Representative Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Full name"
            />
            {signatureSlot('Customer Signature', customerSignature, 'customer')}
            {signatureSlot('Technician Signature', techSignature, 'technician')}
          </div>
        </Section>

        <Section label="FINAL REVIEW">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full flex-col gap-xs rounded-md bg-canvas p-md text-caption">
              {reviewRow('Work Order', [workOrder, customer].filter(Boolean).join(' · ') || 'Not set yet')}
              {reviewRow('Equipment', equipmentLabel || 'Not set yet')}
              {reviewRow('Findings', joinOr(findings, 'Not set yet'))}
              {reviewRow('Repairs', joinOr(repairs, 'Not set yet'))}
              {reviewRow('Status', status ? `${status.toUpperCase()} — set above` : 'Not set yet')}
            </div>
            <Button variant="secondary" icon={<FileText size={16} strokeWidth={1.5} />} className="w-full" onClick={() => setEditingInvoice(true)}>
              Edit invoice
            </Button>
          </div>
        </Section>
      </div>

      <BottomNav isLast onBack={() => navigate('/jobs/new/step-3')} onNext={() => setSaved(true)} nextDisabled={!canComplete} />

      {/* Invoice editor as an overlay (not a route) for the same reason as the signature
          page: Step 4 stays mounted underneath, so nothing entered here is lost. */}
      {editingInvoice && (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-canvas">
          <InvoiceEditor
            workOrder={workOrder || 'Draft'}
            billTo={{ customer: customer || '—', address: address || '—' }}
            value={invoice}
            onChange={setInvoice}
            onBack={() => setEditingInvoice(false)}
            onSave={() => setEditingInvoice(false)}
          />
        </div>
      )}

      {signing && (
        <SignatureCapture
          title={signing === 'customer' ? 'Customer signature' : 'Technician signature'}
          instructions={
            signing === 'customer'
              ? `${customerName || 'Customer'} — please sign below to acknowledge the work performed and agree to the charges.`
              : 'Technician — please sign below to confirm the work performed.'
          }
          onCancel={() => setSigning(null)}
          onDone={(dataUrl) => {
            if (signing === 'customer') setCustomerSignature(dataUrl)
            else setTechSignature(dataUrl)
            setSigning(null)
          }}
        />
      )}

      {saved && (
        <Dialog
          icon={<img src="/images/illustrations/dialog-save.png" srcSet="/images/illustrations/dialog-save.png 1x, /images/illustrations/dialog-save@2x.png 2x" alt="" className="h-[140px] w-auto" />}
          title="Job saved"
          message={`${[workOrder, customer].filter(Boolean).join(' · ') || 'This job'} is complete. The service report and invoice are being generated — they will appear in the job in a few seconds.`}
          primaryLabel="View job"
          onPrimary={() => finish('/jobs/wo-10031')}
          secondaryLabel="Back to jobs"
          onSecondary={() => finish('/jobs')}
        />
      )}
    </div>
  )
}
