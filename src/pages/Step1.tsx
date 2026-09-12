import { AlertCircle, Building2, Clock, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'
import { Button } from '../components/Button'
import { ChoiceChip } from '../components/ChoiceChip'
import { Dialog } from '../components/Dialog'
import { EMPTY_EQUIPMENT, EquipmentCard, type Equipment } from '../components/EquipmentCard'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { useDraftState } from '../data/draft'
import { useCustomers, type Customer } from '../data/customers'
import { fetchNextWorkOrder } from '../data/jobs'
import { exitDraft } from './stepExit'

const SERVICE_TYPES = ['Preventive Maintenance', 'Diagnostic / Repair Call']
const COMPLAINTS = ['No Cooling', 'No Heating', 'Water Leak', 'Airflow Issue', 'Noise / Vibration', 'Thermostat / Controls']

const nowLabel = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const todayLabel = () => new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

/** Figma: 03 · Step 1 · Service Call & Equipment (100:3579), validation 03d (182:3282),
 *  discard confirm 03e (100:4142). Next doesn't advance yet — Step 2 isn't built. The
 *  draft itself isn't persisted anywhere yet (no backend), so "Keep draft & exit" doesn't
 *  actually save anything at this stage — it just matches the confirmed copy/flow. */
export function Step1() {
  const navigate = useNavigate()

  const [workOrder, setWorkOrder] = useDraftState('step1.workOrder', '')
  const [date, setDate] = useDraftState('step1.date', todayLabel)
  const [technician, setTechnician] = useDraftState('step1.technician', 'T. Holloway')
  const [showErrors, setShowErrors] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [unitSuite, setUnitSuite] = useDraftState('step1.unitSuite', '')
  const [customer, setCustomer] = useDraftState('step1.customer', '')
  const [customerFocused, setCustomerFocused] = useState(false)
  const [address, setAddress] = useDraftState('step1.address', '')
  const [arrival, setArrival] = useDraftState('step1.arrival', '')
  const [departure, setDeparture] = useDraftState('step1.departure', '')
  const [customerNotes, setCustomerNotes] = useDraftState('step1.customerNotes', '')
  const [serviceType, setServiceType] = useDraftState('step1.serviceType', '')
  const [complaints, setComplaints] = useDraftState<string[]>('step1.complaints', [])
  const [complaintDetails, setComplaintDetails] = useDraftState('step1.complaintDetails', '')
  const [equipment, setEquipment] = useDraftState<Equipment[]>('step1.equipment', [EMPTY_EQUIPMENT('unit-1')])

  // The next work-order number comes from the jobs table; only fill it while the draft
  // has none, so a number the technician typed (or a resumed draft) is never overwritten.
  useEffect(() => {
    if (workOrder) return
    let active = true
    fetchNextWorkOrder().then(
      (next) => {
        if (active) setWorkOrder((prev) => prev || next)
      },
      () => {},
    )
    return () => {
      active = false
    }
  }, [workOrder, setWorkOrder])

  const { data: customers } = useCustomers()

  const toggleComplaint = (c: string) => setComplaints((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const updateEquipment = (id: string, value: Equipment) => setEquipment((prev) => prev.map((u) => (u.id === id ? value : u)))
  const removeEquipment = (id: string) => setEquipment((prev) => prev.filter((u) => u.id !== id))
  const addEquipment = () => setEquipment((prev) => [...prev, EMPTY_EQUIPMENT(`unit-${prev.length + 1}`)])

  const customerMatches = customer.trim() ? (customers ?? []).filter((c) => c.name.toLowerCase().includes(customer.trim().toLowerCase())) : []
  const showSuggestions = customerFocused && customer.trim().length > 0

  const selectCustomer = (c: Customer) => {
    setCustomer(c.name)
    setAddress(c.address)
    if (c.notes) setCustomerNotes(c.notes) // per-customer notes auto-fill every work order (client decision)
    setCustomerFocused(false)
  }

  const missing = {
    workOrder: !workOrder.trim(),
    date: !date.trim(),
    technician: !technician.trim(),
    customer: !customer.trim(),
    address: !address.trim(),
  }
  const missingCount = Object.values(missing).filter(Boolean).length
  const requiredError = (field: keyof typeof missing) => (showErrors && missing[field] ? 'Required' : undefined)

  const handleNext = () => {
    if (missingCount > 0) {
      setShowErrors(true)
      return
    }
    navigate('/jobs/new/step-2')
  }

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AppHeader step={1} title="Service Call & Equipment" onExit={() => setShowDiscard(true)} />

      <div className="app-col flex flex-1 flex-col gap-2xl p-lg">
        {showErrors && missingCount > 0 && (
          <div className="flex w-full items-center gap-sm rounded-xs bg-danger-soft p-md">
            <AlertCircle size={20} strokeWidth={1.5} className="shrink-0 text-danger" />
            <p className="flex-1 text-caption text-danger">
              {missingCount} required field{missingCount > 1 ? 's' : ''} {missingCount > 1 ? 'are' : 'is'} missing. Fields are highlighted below.
            </p>
          </div>
        )}

        <Section label="WORK ORDER">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Work Order #" value={workOrder} onChange={(e) => setWorkOrder(e.target.value)} error={requiredError('workOrder')} />
              <FormField className="min-w-0 flex-1" label="Date" value={date} onChange={(e) => setDate(e.target.value)} error={requiredError('date')} />
            </div>
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Technician" value={technician} onChange={(e) => setTechnician(e.target.value)} error={requiredError('technician')} />
              <FormField className="min-w-0 flex-1" label="Unit / Suite" value={unitSuite} onChange={(e) => setUnitSuite(e.target.value)} />
            </div>
            <div className="relative w-full">
              <FormField
                label="Customer / Property"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                onFocus={() => setCustomerFocused(true)}
                onBlur={() => setCustomerFocused(false)}
                placeholder="Customer name"
                error={requiredError('customer')}
              />
              {showSuggestions && (
                <div className="absolute inset-x-0 top-full z-10 mt-xs flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-modal">
                  {customerMatches.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectCustomer(c)
                      }}
                      className="flex items-center gap-md border-b border-line px-lg py-md text-left"
                    >
                      <Building2 size={20} strokeWidth={1.5} className="shrink-0 text-icon" />
                      <div className="flex min-w-0 flex-1 flex-col gap-2xs">
                        <p className="text-body-strong text-ink">{c.name}</p>
                        <p className="text-caption text-ink-faint">
                          {c.address} · {c.previousJobs} previous job{c.previousJobs > 1 ? 's' : ''}
                          {c.hasNotes ? ' · Notes on file' : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setCustomerFocused(false)
                    }}
                    className="flex items-center gap-md px-lg py-md text-left"
                  >
                    <Plus size={20} strokeWidth={1.5} className="shrink-0 text-link" />
                    <span className="flex-1 text-body-strong text-link">Add &quot;{customer}&quot; as a new customer</span>
                  </button>
                  <div className="bg-canvas px-lg py-sm">
                    <p className="text-caption text-ink-faint">Selecting a customer fills in the service address.</p>
                  </div>
                </div>
              )}
            </div>
            <FormField label="Service Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state ZIP" error={requiredError('address')} />
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Arrival Time" value={arrival} onChange={(e) => setArrival(e.target.value)} placeholder="—" />
              <FormField className="min-w-0 flex-1" label="Departure Time" value={departure} onChange={(e) => setDeparture(e.target.value)} placeholder="—" />
            </div>
            <div className="flex w-full gap-2xs">
              <Button variant="text" icon={<Clock size={16} strokeWidth={1.5} />} className="min-w-0 flex-1" onClick={() => setArrival(nowLabel())}>
                Set now
              </Button>
              <Button variant="text" icon={<Clock size={16} strokeWidth={1.5} />} className="min-w-0 flex-1" onClick={() => setDeparture(nowLabel())}>
                Set now
              </Button>
            </div>
          </div>
        </Section>

        {/* Desktop (320:15418): notes and service type share a row, the notes card
            stretches to the row height and its textarea fills the card. */}
        <div className="flex w-full flex-col gap-2xl md:flex-row md:items-stretch">
        <Section label="ADDITIONAL NOTES" className="md:min-w-0 md:flex-1" cardClassName="md:flex md:flex-1 md:flex-col">
          <div className="flex w-full flex-1 flex-col gap-md p-md">
            <FormField
              className="flex-1 md:[&>textarea]:flex-1 md:[&>textarea]:min-h-0"
              label="Customer notes"
              type="textarea"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Gate codes, pets, access instructions…"
            />
            <p className="text-caption text-ink-faint">Saved to this customer · auto-fills on every work order and report</p>
          </div>
        </Section>

        <Section label="SERVICE TYPE / COMPLAINT" className="md:min-w-0 md:flex-1">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="grid w-full grid-cols-2 gap-2xs">
              {SERVICE_TYPES.map((t) => (
                <ChoiceChip key={t} label={t} selected={serviceType === t} onClick={() => setServiceType(t)} />
              ))}
              {COMPLAINTS.map((c) => (
                <ChoiceChip key={c} label={c} selected={complaints.includes(c)} onClick={() => toggleComplaint(c)} />
              ))}
            </div>
            <FormField
              label="Customer Complaint / Reason for Call"
              type="textarea"
              value={complaintDetails}
              onChange={(e) => setComplaintDetails(e.target.value)}
              placeholder="Describe what the customer reported"
            />
          </div>
        </Section>
        </div>

        <Section label="EQUIPMENT" padded={false}>
          <div className="flex w-full flex-col divide-y divide-line">
            {equipment.map((unit, i) => (
              <div key={unit.id} className="p-md">
                <EquipmentCard
                  unitNumber={i + 1}
                  value={unit}
                  onChange={(v) => updateEquipment(unit.id, v)}
                  onRemove={equipment.length > 1 ? () => removeEquipment(unit.id) : undefined}
                />
              </div>
            ))}
          </div>
        </Section>

        <div className="flex w-full md:justify-end">
          <Button variant="secondary" icon={<Plus size={16} strokeWidth={1.5} />} className="w-full md:w-auto md:min-w-[200px]" onClick={addEquipment}>
            {equipment.length === 1 ? 'Add second unit' : 'Add another unit'}
          </Button>
        </div>
      </div>

      <BottomNav isFirst onBack={() => setShowDiscard(true)} onNext={handleNext} />

      {showDiscard && (
        <Dialog
          icon={
            <img
              src="/images/illustrations/dialog-draft.webp"
              srcSet="/images/illustrations/dialog-draft.webp 1x, /images/illustrations/dialog-draft@2x.webp 2x"
              alt=""
              className="h-[140px] w-auto"
            />
          }
          title="Leave this job?"
          message="Your changes are saved as a draft. You can finish it later from the Jobs list."
          primaryLabel="Keep draft & exit"
          onPrimary={() => void exitDraft(navigate)}
          secondaryLabel="Continue editing"
          onSecondary={() => setShowDiscard(false)}
        />
      )}
    </div>
  )
}
