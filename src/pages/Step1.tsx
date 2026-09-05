import { Clock, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'
import { Button } from '../components/Button'
import { ChoiceChip } from '../components/ChoiceChip'
import { EMPTY_EQUIPMENT, EquipmentCard, type Equipment } from '../components/EquipmentCard'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'

const SERVICE_TYPES = ['Preventive Maintenance', 'Diagnostic / Repair Call']
const COMPLAINTS = ['No Cooling', 'No Heating', 'Water Leak', 'Airflow Issue', 'Noise / Vibration', 'Thermostat / Controls']

const nowLabel = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const todayLabel = () => new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

/** Figma: 03 · Step 1 · Service Call & Equipment (100:3579). Next doesn't advance yet —
 *  Step 2 isn't built. Back/Exit both return to Jobs; the draft itself isn't persisted
 *  anywhere yet (no backend), so nothing is actually saved on exit at this stage. */
export function Step1() {
  const navigate = useNavigate()

  const [date] = useState(todayLabel)
  const [technician] = useState('T. Holloway')
  const [unitSuite, setUnitSuite] = useState('')
  const [customer, setCustomer] = useState('')
  const [address, setAddress] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [complaints, setComplaints] = useState<string[]>([])
  const [complaintDetails, setComplaintDetails] = useState('')
  const [equipment, setEquipment] = useState<Equipment[]>([EMPTY_EQUIPMENT('unit-1')])

  const toggleComplaint = (c: string) => setComplaints((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const updateEquipment = (id: string, value: Equipment) => setEquipment((prev) => prev.map((u) => (u.id === id ? value : u)))
  const removeEquipment = (id: string) => setEquipment((prev) => prev.filter((u) => u.id !== id))
  const addEquipment = () => setEquipment((prev) => [...prev, EMPTY_EQUIPMENT(`unit-${prev.length + 1}`)])

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AppHeader step={1} title="Service Call & Equipment" onExit={() => navigate('/jobs')} />

      <div className="flex flex-1 flex-col gap-2xl p-lg">
        <Section label="WORK ORDER">
          <div className="flex w-full flex-col gap-md p-md">
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Work Order #" value="Auto-assigned" disabled />
              <FormField className="min-w-0 flex-1" label="Date" value={date} disabled />
            </div>
            <div className="flex w-full gap-2xs">
              <FormField className="min-w-0 flex-1" label="Technician" value={technician} disabled />
              <FormField className="min-w-0 flex-1" label="Unit / Suite" value={unitSuite} onChange={(e) => setUnitSuite(e.target.value)} />
            </div>
            <FormField label="Customer / Property" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" />
            <FormField label="Service Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state ZIP" />
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

        <Section label="ADDITIONAL NOTES">
          <div className="flex w-full flex-col gap-md p-md">
            <FormField
              label="Customer notes"
              type="textarea"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Gate codes, pets, access instructions…"
            />
            <p className="text-caption text-ink-faint">Saved to this customer · auto-fills on every work order and report</p>
          </div>
        </Section>

        <Section label="SERVICE TYPE / COMPLAINT">
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

        <Button variant="secondary" icon={<Plus size={16} strokeWidth={1.5} />} className="w-full" onClick={addEquipment}>
          {equipment.length === 1 ? 'Add second unit' : 'Add another unit'}
        </Button>
      </div>

      <BottomNav isFirst onBack={() => navigate('/jobs')} onNext={() => navigate('/jobs/new/step-2')} />
    </div>
  )
}
