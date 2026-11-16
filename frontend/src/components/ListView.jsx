import { useState } from 'react'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { hoursLabel, money, shortDate, shortTime } from '../lib/format.js'
import { Card, ErrorNote, MonthNav, StatusBadge } from './ui.jsx'

const FILTERS = [
  ['', 'All'],
  ['SCHEDULED', 'Scheduled'],
  ['COMPLETED', 'Completed'],
  ['CANCELED', 'Canceled'],
]

export default function ListView({ month, setMonth, refreshKey, onOpen, onToggleCanceled, busy, error: actionError }) {
  const [allMonths, setAllMonths] = useState(false)
  const [status, setStatus] = useState('')
  const { data, error, loading } = useApi(
    () => api.shifts({ month: allMonths ? null : month, status }),
    [month, allMonths, status, refreshKey],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {allMonths ? <h2 className="text-lg font-semibold tracking-tight">All shifts</h2> : <MonthNav month={month} setMonth={setMonth} />}
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={allMonths}
            onChange={(e) => setAllMonths(e.target.checked)}
            className="size-4 accent-teal-700"
          />
          Show all months
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {FILTERS.map(([value, label]) => (
          <button
            key={label}
            onClick={() => setStatus(value)}
            aria-pressed={status === value}
            className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${
              status === value ? 'bg-stone-900 text-white ring-stone-900' : 'bg-white text-stone-600 ring-stone-200 hover:text-stone-900'
            }`}
          >
            {label}
          </button>
        ))}
        {loading && <span className="self-center pl-2 text-sm text-stone-400">Loading…</span>}
      </div>

      <ErrorNote>{error || actionError}</ErrorNote>

      {data && (
        <Card className="divide-y divide-stone-100">
          {data.length === 0 && <p className="p-6 text-center text-sm text-stone-500">No shifts here yet.</p>}
          {data.map((s) => (
            <ShiftRow key={s.id} shift={s} onOpen={onOpen} onToggleCanceled={onToggleCanceled} busy={busy} />
          ))}
        </Card>
      )}
    </div>
  )
}

function ShiftRow({ shift, onOpen, onToggleCanceled, busy }) {
  const canceled = shift.status === 'CANCELED'
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button onClick={() => onOpen(shift)} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{shortDate(shift.date)}</span>
          <StatusBadge status={shift.status} />
        </div>
        <div className="mt-0.5 truncate text-sm text-stone-500">
          {shift.facility} · {shortTime(shift.startTime)}–{shortTime(shift.endTime)} · {hoursLabel(shift.hours)}h at{' '}
          {money(shift.hourlyPay)}
        </div>
      </button>
      <div className="text-right">
        <div className={`font-semibold ${canceled ? 'text-stone-400 line-through' : ''}`}>{money(shift.pay)}</div>
        <button
          disabled={busy}
          onClick={() => onToggleCanceled(shift, !canceled)}
          className={`mt-0.5 text-xs font-medium disabled:opacity-50 ${canceled ? 'text-teal-700 hover:text-teal-900' : 'text-red-700 hover:text-red-900'}`}
        >
          {canceled ? 'Restore' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
