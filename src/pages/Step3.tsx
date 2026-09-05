import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'
import { ChoiceChip } from '../components/ChoiceChip'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { useDraftState } from '../data/draft'

/** Multi-select where one or more labels are "none-like" (No Defects Found, Diagnostic
 *  Only, No Further Action, …): picking an exclusive label clears everything else,
 *  and picking any other label clears whichever exclusive label was active. */
function toggleWithExclusive(current: string[], clicked: string, exclusive: Set<string>): string[] {
  if (exclusive.has(clicked)) return current.includes(clicked) ? [] : [clicked]
  const withoutExclusive = current.filter((c) => !exclusive.has(c))
  return withoutExclusive.includes(clicked) ? withoutExclusive.filter((c) => c !== clicked) : [...withoutExclusive, clicked]
}

const FINDINGS = [
  'No Defects Found',
  'Failed / Weak Capacitor',
  'Failed / Burned Contactor',
  'Blower Motor Issue',
  'Condenser Fan Motor Issue',
  'Compressor Issue',
  'Low Refrigerant',
  'Leak Suspected',
  'Dirty Evaporator Coil',
  'Dirty Condenser Coil',
  'Clogged Drain',
  'Electrical / Wiring',
]
const FINDINGS_EXCLUSIVE = new Set(['No Defects Found'])

const REPAIRS = ['Diagnostic Only', 'Electrical Repair', 'Drain Repair', 'Refrigerant Added', 'Leak Search', 'Coil Cleaning', 'Part Replaced', 'No Repair Performed']
const REPAIRS_EXCLUSIVE = new Set(['Diagnostic Only', 'No Repair Performed'])

const RECOMMENDATIONS = ['No Further Action', 'Repair Recommended', 'Estimate Required', 'Parts Required', 'Return Visit Required', 'Replacement Recommended']
const RECOMMENDATIONS_EXCLUSIVE = new Set(['No Further Action'])

/** Figma: 05 · Step 3 · Findings & Repairs (100:3871). */
export function Step3() {
  const navigate = useNavigate()
  const [findings, setFindings] = useDraftState<string[]>('step3.findings', [])
  const [repairs, setRepairs] = useDraftState<string[]>('step3.repairs', [])
  const [recommendations, setRecommendations] = useDraftState<string[]>('step3.recommendations', [])
  const [serviceNotes, setServiceNotes] = useDraftState('step3.serviceNotes', '')
  const [parts, setParts] = useDraftState('step3.parts', '')
  const [recommendedWork, setRecommendedWork] = useDraftState('step3.recommendedWork', '')

  const chipGrid = (options: string[], selected: string[], exclusive: Set<string>, setSelected: (v: string[]) => void) => (
    <div className="grid w-full grid-cols-2 gap-2xs">
      {options.map((label) => (
        <ChoiceChip key={label} label={label} selected={selected.includes(label)} onClick={() => setSelected(toggleWithExclusive(selected, label, exclusive))} />
      ))}
    </div>
  )

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AppHeader step={3} title="Findings & Repairs" onExit={() => navigate('/jobs')} />

      <div className="flex flex-1 flex-col gap-lg p-lg">
        <Section label="FINDINGS">
          <div className="p-md">{chipGrid(FINDINGS, findings, FINDINGS_EXCLUSIVE, setFindings)}</div>
        </Section>

        <Section label="REPAIRS PERFORMED">
          <div className="p-md">{chipGrid(REPAIRS, repairs, REPAIRS_EXCLUSIVE, setRepairs)}</div>
        </Section>

        <Section label="TECHNICIAN NOTES">
          <div className="flex w-full flex-col gap-md p-md">
            <FormField
              label="Service Notes"
              type="textarea"
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="What was found and what was done"
            />
            <FormField
              label="Parts / Materials / Refrigerant Used"
              type="textarea"
              value={parts}
              onChange={(e) => setParts(e.target.value)}
              placeholder="e.g. 1 × 45/5 MFD capacitor · 1 lb R-410A"
            />
          </div>
        </Section>

        <Section label="RECOMMENDATIONS">
          <div className="flex w-full flex-col gap-md p-md">
            {chipGrid(RECOMMENDATIONS, recommendations, RECOMMENDATIONS_EXCLUSIVE, setRecommendations)}
            <FormField
              label="Recommended Work"
              type="textarea"
              value={recommendedWork}
              onChange={(e) => setRecommendedWork(e.target.value)}
              placeholder="Describe follow-up work, if any"
            />
          </div>
        </Section>
      </div>

      <BottomNav onBack={() => navigate('/jobs/new/step-2')} onNext={() => navigate('/jobs/new/step-4')} />
    </div>
  )
}
