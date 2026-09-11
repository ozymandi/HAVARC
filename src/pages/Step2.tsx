import { Plus, X } from 'lucide-react'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'
import { Button } from '../components/Button'
import { ChoiceChip } from '../components/ChoiceChip'
import { FormField } from '../components/FormField'
import { Section } from '../components/Section'
import { useDraftState } from '../data/draft'

interface Readings {
  returnAir: string
  supplyAir: string
  tempSplit: string
  returnStatic: string
  supplyStatic: string
  totalStatic: string
  incomingV: string
  compressorA: string
  condFanA: string
  blowerA: string
  capRatedMfd: string
  capActualMfd: string
  suctionPsig: string
  headPsig: string
  outdoorF: string
  superheat: string
  subcooling: string
  refrigerantAdded: string
}

const EMPTY_READINGS: Readings = {
  returnAir: '',
  supplyAir: '',
  tempSplit: '',
  returnStatic: '',
  supplyStatic: '',
  totalStatic: '',
  incomingV: '',
  compressorA: '',
  condFanA: '',
  blowerA: '',
  capRatedMfd: '',
  capActualMfd: '',
  suctionPsig: '',
  headPsig: '',
  outdoorF: '',
  superheat: '',
  subcooling: '',
  refrigerantAdded: '',
}

type CheckState = 'good' | 'issue' | null

const CONDITION_PAIRS: { key: keyof Conditions; good: string; issue: string }[] = [
  { key: 'filter', good: 'Filter Good', issue: 'Filter Dirty' },
  { key: 'drain', good: 'Drain Good', issue: 'Drain Clogged' },
  { key: 'ductwork', good: 'Ductwork Good', issue: 'Duct Leakage / Sealing' },
  { key: 'heating', good: 'Heating Good', issue: 'Heating Needs Attention' },
]

interface Conditions {
  filter: CheckState
  drain: CheckState
  ductwork: CheckState
  heating: CheckState
}

const EMPTY_CONDITIONS: Conditions = { filter: null, drain: null, ductwork: null, heating: null }

/** Figma: 04 · Step 2 · Inspection & Readings (100:3807), collapsed state
 *  04b · Step 2 · Readings skipped (254:7202). Readings default collapsed per the
 *  client's 2026-09-05 request — optional, mainly for maintenance calls. */
export function Step2() {
  const navigate = useNavigate()
  const [readingsOpen, setReadingsOpen] = useDraftState('step2.readingsOpen', false)
  const [readings, setReadings] = useDraftState<Readings>('step2.readings', EMPTY_READINGS)
  const [conditions, setConditions] = useDraftState<Conditions>('step2.conditions', EMPTY_CONDITIONS)

  const set = <K extends keyof Readings>(key: K, v: Readings[K]) => setReadings((prev) => ({ ...prev, [key]: v }))
  const setCondition = (key: keyof Conditions, v: CheckState) =>
    setConditions((prev) => ({ ...prev, [key]: prev[key] === v ? null : v }))

  const field = (key: keyof Readings, label: string) => (
    <FormField className="min-w-0 flex-1" label={label} value={readings[key]} onChange={(e) => set(key, e.target.value)} />
  )

  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <AppHeader step={2} title="Inspection & Readings" onExit={() => navigate('/jobs')} />

      <div className="app-col flex flex-1 flex-col gap-lg p-lg">
        <div className="flex w-full flex-col gap-sm">
          <div className="flex w-full items-center gap-sm">
            <p className="text-section text-brand">READINGS</p>
            {readingsOpen ? (
              <>
                <p className="flex-1 text-caption text-ink-faint">Optional</p>
                <button
                  type="button"
                  onClick={() => setReadingsOpen(false)}
                  aria-label="Remove readings"
                  className="flex size-7 items-center justify-center text-icon-soft"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <p className="flex-1 text-caption text-ink-faint">Optional</p>
            )}
          </div>

          {readingsOpen ? (
            <div className="flex w-full flex-col gap-sm">
              <div className="w-full rounded-xs bg-surface p-md shadow-card">
                <div className="flex w-full flex-col gap-md">
                  <p className="text-h2 text-ink">Airflow / Temperature</p>
                  <div className="flex w-full gap-2xs">
                    {field('returnAir', 'Return Air °F')}
                    {field('supplyAir', 'Supply Air °F')}
                    {field('tempSplit', 'Temp Split °F')}
                  </div>
                  <div className="flex w-full gap-2xs">
                    {field('returnStatic', 'Return Static')}
                    {field('supplyStatic', 'Supply Static')}
                    {field('totalStatic', 'Total Static')}
                  </div>
                </div>
              </div>
              <div className="w-full rounded-xs bg-surface p-md shadow-card">
                <div className="flex w-full flex-col gap-md">
                  <p className="text-h2 text-ink">Electrical</p>
                  <div className="flex w-full gap-2xs">
                    {field('incomingV', 'Incoming V')}
                    {field('compressorA', 'Compressor A')}
                    {field('condFanA', 'Cond. Fan A')}
                  </div>
                  <div className="flex w-full gap-2xs">
                    {field('blowerA', 'Blower A')}
                    {field('capRatedMfd', 'Cap Rated MFD')}
                    {field('capActualMfd', 'Cap Actual MFD')}
                  </div>
                </div>
              </div>
              <div className="w-full rounded-xs bg-surface p-md shadow-card">
                <div className="flex w-full flex-col gap-md">
                  <p className="text-h2 text-ink">Refrigerant / Cooling</p>
                  <div className="flex w-full gap-2xs">
                    {field('suctionPsig', 'Suction PSIG')}
                    {field('headPsig', 'Head PSIG')}
                    {field('outdoorF', 'Outdoor °F')}
                  </div>
                  <div className="flex w-full gap-2xs">
                    {field('superheat', 'Superheat °F')}
                    {field('subcooling', 'Subcooling °F')}
                    {field('refrigerantAdded', 'Refr. Added lbs')}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-md rounded-xs bg-surface p-md shadow-card">
              <p className="text-body text-ink-faint">
                Airflow, electrical and refrigerant readings. Add them for maintenance calls — skip for service calls.
              </p>
              <Button variant="secondary" icon={<Plus size={16} strokeWidth={1.5} />} className="w-full" onClick={() => setReadingsOpen(true)}>
                Add readings
              </Button>
            </div>
          )}
        </div>

        <Section label="CONDITION CHECKS">
          <div className="grid w-full grid-cols-2 gap-2xs p-md">
            {CONDITION_PAIRS.map(({ key, good, issue }) => (
              <Fragment key={key}>
                <ChoiceChip label={good} selected={conditions[key] === 'good'} onClick={() => setCondition(key, 'good')} />
                <ChoiceChip label={issue} selected={conditions[key] === 'issue'} onClick={() => setCondition(key, 'issue')} />
              </Fragment>
            ))}
          </div>
        </Section>
      </div>

      <BottomNav onBack={() => navigate('/jobs/new')} onNext={() => navigate('/jobs/new/step-3')} />
    </div>
  )
}
