import { X } from 'lucide-react'
import { useState } from 'react'
import { BottomSheetPicker } from './BottomSheetPicker'
import { FormField, PickerField } from './FormField'

export interface Equipment {
  id: string
  equipmentId: string
  location: string
  type: string
  manufacturer: string
  model: string
  serial: string
  tonnage: string
  refrigerant: string
  voltage: string
  filterSize: string
}

export const EMPTY_EQUIPMENT = (id: string): Equipment => ({
  id,
  equipmentId: '',
  location: '',
  type: '',
  manufacturer: '',
  model: '',
  serial: '',
  tonnage: '',
  refrigerant: '',
  voltage: '',
  filterSize: '',
})

const EQUIPMENT_TYPES = ['Split System', 'Heat Pump', 'Air Handler', 'Gas Furnace', 'Package Unit', 'RTU', 'Mini Split', 'VRF / VRV', 'Chiller', 'Other']
const REFRIGERANTS = ['R-410A', 'R-22', 'R-32', 'R-454B']

interface EquipmentCardProps {
  unitNumber: number
  value: Equipment
  onChange: (value: Equipment) => void
  onRemove?: () => void
}

/** Figma: Card · Equipment · Unit N (100:3626 / two-units variant 100:3711). Unit 1 has no
 *  remove control; Unit 2+ shows the "x" icon-button next to the title. */
export function EquipmentCard({ unitNumber, value, onChange, onRemove }: EquipmentCardProps) {
  const set = <K extends keyof Equipment>(key: K, v: Equipment[K]) => onChange({ ...value, [key]: v })
  const [picker, setPicker] = useState<'type' | 'refrigerant' | null>(null)

  return (
    <div className="flex w-full flex-col gap-md">
      <div className="flex w-full items-center">
        <p className="flex-1 text-h2 text-ink">Unit {unitNumber}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove Unit ${unitNumber}`} className="flex size-7 items-center justify-center text-icon-soft">
            <X size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="flex w-full gap-2xs">
        <FormField className="min-w-0 flex-1" label="Equipment ID" value={value.equipmentId} onChange={(e) => set('equipmentId', e.target.value)} />
        <FormField className="min-w-0 flex-1" label="Location" value={value.location} onChange={(e) => set('location', e.target.value)} />
      </div>
      <PickerField label="Equipment Type" value={value.type} placeholder="Select type" onClick={() => setPicker('type')} />
      <div className="flex w-full gap-2xs">
        <FormField className="min-w-0 flex-1" label="Manufacturer" value={value.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
        <FormField className="min-w-0 flex-1" label="Model #" value={value.model} onChange={(e) => set('model', e.target.value)} />
      </div>
      <FormField label="Serial #" value={value.serial} onChange={(e) => set('serial', e.target.value)} />
      <div className="flex w-full gap-2xs">
        <FormField className="min-w-0 flex-1" label="Tonnage" value={value.tonnage} onChange={(e) => set('tonnage', e.target.value)} />
        <PickerField className="min-w-0 flex-1" label="Refrigerant" value={value.refrigerant} placeholder="Select" onClick={() => setPicker('refrigerant')} />
      </div>
      <div className="flex w-full gap-2xs">
        <FormField className="min-w-0 flex-1" label="Voltage / Phase" value={value.voltage} onChange={(e) => set('voltage', e.target.value)} />
        <FormField className="min-w-0 flex-1" label="Filter Size" value={value.filterSize} onChange={(e) => set('filterSize', e.target.value)} />
      </div>

      {picker && (
        <BottomSheetPicker
          title={picker === 'type' ? 'Equipment Type' : 'Refrigerant'}
          options={picker === 'type' ? EQUIPMENT_TYPES : REFRIGERANTS}
          value={picker === 'type' ? value.type : value.refrigerant}
          onChange={(v) => set(picker === 'type' ? 'type' : 'refrigerant', v)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
