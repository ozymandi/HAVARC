import { PartyPopper, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { AddPhotoTile, PhotoTile } from '../components/PhotoTile'
import { BottomNav } from '../components/BottomNav'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { SignaturePad } from '../components/SignaturePad'
import type { StatusColor } from '../components/StatusBanner'
import { StatusButtonGrid } from '../components/StatusButton'

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/** Figma: 06 · Step 4 · Complete Service Call (100:3943), success state
 *  06b · Step 4 · Job saved (100:4004, Dialog over a 40% scrim). */
export function Step4() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<StatusColor | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerSignature, setCustomerSignature] = useState<string | null>(null)
  const [techSignature, setTechSignature] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canComplete = status !== null && !!customerSignature && !!techSignature

  const addPhoto = async (file: File | undefined) => {
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    setPhotos((prev) => [...prev, dataUrl])
  }
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

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
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    void addPhoto(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                <AddPhotoTile />
              </label>
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
            <p className="text-label text-ink-soft">Customer Signature</p>
            <SignaturePad onChange={setCustomerSignature} />
            <p className="text-label text-ink-soft">Technician Signature</p>
            <SignaturePad onChange={setTechSignature} />
          </div>
        </Section>

        <Section label="FINAL REVIEW">
          <div className="flex w-full flex-col gap-md p-md">
            {/* Static for now — Steps 1–3 keep their own local state with nothing shared
                between steps yet. Wiring a real cross-step draft store is Phase-1 backend
                work (task.md: drafts/autosave), not a Step 4 concern on its own. */}
            <div className="flex w-full flex-col gap-xs rounded-md bg-canvas p-md text-caption">
              <div className="flex w-full gap-sm">
                <p className="w-[88px] shrink-0 text-label text-ink-faint">Work Order</p>
                <p className="text-ink">WO-10031 · Brenda Johnson</p>
              </div>
              <div className="flex w-full gap-sm">
                <p className="w-[88px] shrink-0 text-label text-ink-faint">Equipment</p>
                <p className="text-ink">RTU-1 · RUUD UAKA-037JAZ</p>
              </div>
              <div className="flex w-full gap-sm">
                <p className="w-[88px] shrink-0 text-label text-ink-faint">Status</p>
                <p className="text-ink">{status ? `${status.toUpperCase()} — set above` : 'Not set yet'}</p>
              </div>
            </div>
            <Button variant="secondary" icon={<Pencil size={16} strokeWidth={1.5} />} className="w-full" disabled>
              Edit invoice
            </Button>
          </div>
        </Section>
      </div>

      <BottomNav isLast onBack={() => navigate('/jobs/new/step-3')} onNext={() => setSaved(true)} nextDisabled={!canComplete} />

      {saved && (
        <Dialog
          icon={<PartyPopper size={64} strokeWidth={1.5} className="text-accent" />}
          title="Job saved"
          message="WO-10031 · Brenda Johnson is complete. The service report and invoice are being generated — they will appear in the job in a few seconds."
          primaryLabel="View job"
          onPrimary={() => navigate('/jobs/wo-10031')}
          secondaryLabel="Back to jobs"
          onSecondary={() => navigate('/jobs')}
        />
      )}
    </div>
  )
}
