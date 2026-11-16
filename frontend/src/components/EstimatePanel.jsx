import { useState } from 'react'
import { money, plural } from '../lib/format.js'
import { Card } from './ui.jsx'

/**
 * "How many more shifts?" — By shift (12-hour or 8-hour) or By hour.
 * Numbers come from the server, already rounded down.
 */
export default function EstimatePanel({ data }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('shift') // 'shift' | 'hour'
  const [length, setLength] = useState(12) // 12 | 8

  return (
    <Card className="p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="block text-sm text-stone-500">Shifts</span>
          <span className="block font-semibold">How many more do I need?</span>
        </span>
        <span className={`text-stone-400 transition ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {open && <div className="mt-4">{body()}</div>}
    </Card>
  )

  function body() {
    if (data.goal === null || data.goal === undefined) {
      return <p className="text-sm text-stone-500">Set a goal for this month first.</p>
    }
    if (data.goalMet) {
      return <p className="text-sm font-medium text-teal-800">Goal met — your earned and scheduled shifts cover it.</p>
    }
    const e = data.estimate
    if (!e) {
      return (
        <p className="text-sm text-stone-500">
          You still need {money(data.stillNeeded)}. Add a shift to see an estimate based on your pay.
        </p>
      )
    }

    let count
    let unit
    if (view === 'hour') {
      count = e.hours
      unit = 'hour'
    } else {
      count = length === 12 ? e.twelveHourShifts : e.eightHourShifts
      unit = `${length}-hour shift`
    }

    return (
      <div className="space-y-4">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            ['shift', 'By shift'],
            ['hour', 'By hour'],
          ]}
        />
        {view === 'shift' && (
          <Segmented
            small
            value={length}
            onChange={setLength}
            options={[
              [12, '12-hour'],
              [8, '8-hour'],
            ]}
          />
        )}
        <p className="text-lg leading-snug">
          On average, you'll need{' '}
          <span className="font-semibold">{count === 0 ? `less than 1 ${unit}` : plural(count, unit)}</span>
        </p>
        <p className="text-xs leading-relaxed text-stone-500">
          Based on your {money(e.averageHourlyPay)}/hour average. Counts round down, so you may fall a little short of
          the {money(data.stillNeeded)} you still need.
        </p>
      </div>
    )
  }
}

function Segmented({ value, onChange, options, small }) {
  return (
    <div className="inline-flex rounded-lg bg-stone-100 p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-md font-medium transition ${small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
            value === v ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
