import { useState } from 'react'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { hoursLabel, money, moneyCompact, monthLabel, monthShort, plural } from '../lib/format.js'
import { Card, ErrorNote } from './ui.jsx'

export default function HistoryView({ refreshKey }) {
  const { data, error, loading } = useApi(() => api.history(), [refreshKey])

  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">History</h2>
        <ErrorNote>{error}</ErrorNote>
        {loading && <p className="text-sm text-stone-400">Loading…</p>}
      </div>
    )
  }

  if (data.months.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">History</h2>
        <Card className="p-6 text-center text-sm text-stone-500">
          Your monthly results show up here once you've set a goal or added shifts.
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold tracking-tight">History</h2>
      <ErrorNote>{error}</ErrorNote>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile
          label="Best month"
          value={data.bestMonth ? money(data.bestMonthEarned) : '—'}
          sub={data.bestMonth ? monthLabel(data.bestMonth) : 'No completed shifts yet'}
        />
        <Tile
          label="Average monthly income"
          value={money(data.averageMonthlyIncome)}
          sub={data.averageMonthlyIncome === null ? 'After your first full month' : 'Finished months only'}
        />
        <Tile
          label="Goals met"
          value={data.monthsWithGoal ? `${data.monthsGoalMet} of ${data.monthsWithGoal}` : '—'}
          sub={data.monthsWithGoal ? 'months' : 'No finished months with a goal yet'}
        />
      </div>

      <GoalChart months={[...data.months].reverse().slice(-12)} />

      <div className="space-y-3">
        {data.months.map((m) => (
          <MonthCard key={m.month} m={m} />
        ))}
      </div>
    </div>
  )
}

function Tile({ label, value, sub }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-stone-500">{sub}</p>
    </Card>
  )
}

/** Earned per month as bars, with that month's goal as a dark tick. Last 12 months. */
function GoalChart({ months }) {
  const [active, setActive] = useState(months.length - 1)
  const max = Math.max(1, ...months.map((m) => Math.max(Number(m.earned), Number(m.goal ?? 0)))) * 1.1
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const current = months[Math.min(active, months.length - 1)]

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Goal vs. earned</h3>
          <p className="text-xs text-stone-500">Completed shifts only</p>
        </div>
        <div className="flex gap-4 text-xs text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-2.5 rounded-sm bg-teal-700" /> Earned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 bg-stone-900" /> Goal
          </span>
        </div>
      </div>

      {/* Readout for the hovered or tapped month */}
      {current && (
        <p className="mt-3 text-sm text-stone-600" aria-live="polite">
          <span className="font-medium text-stone-900">{monthLabel(current.month)}:</span> {money(current.earned)} earned
          {current.goal !== null && <> of {money(current.goal)} goal</>}
          {current.inProgress && ' (in progress)'}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {/* y-axis labels */}
        <div className="relative h-48 w-11 shrink-0 text-right text-[11px] text-stone-400">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {moneyCompact(t).replace(',000', 'k')}
            </span>
          ))}
        </div>

        <div className="relative h-48 flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-stone-100" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-1 sm:gap-2">
            {months.map((m, i) => {
              const earnedH = (Number(m.earned) / top) * 100
              const goalH = m.goal === null ? null : (Number(m.goal) / top) * 100
              return (
                <button
                  key={m.month}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-label={`${monthLabel(m.month)}: ${money(m.earned)} earned${m.goal !== null ? ` of ${money(m.goal)}` : ''}`}
                  className={`relative h-full flex-1 rounded-md ${i === active ? 'bg-stone-100/70' : ''}`}
                >
                  <span
                    className={`absolute inset-x-[18%] bottom-0 rounded-t ${m.inProgress ? 'bg-teal-400' : 'bg-teal-700'}`}
                    style={{ height: `${earnedH}%` }}
                  />
                  {goalH !== null && (
                    <span className="absolute inset-x-[6%] h-0.5 bg-stone-900" style={{ bottom: `calc(${goalH}% - 1px)` }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="ml-[3.25rem] mt-1.5 flex gap-1 sm:gap-2">
        {months.map((m) => (
          <span key={m.month} className="flex-1 text-center text-[11px] text-stone-500">
            {monthShort(m.month)}
          </span>
        ))}
      </div>
    </Card>
  )
}

function niceTicks(max) {
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((s) => s * pow).find((s) => s >= raw)
  const ticks = []
  for (let v = 0; v <= max + step * 0.01; v += step) ticks.push(v)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

function MonthCard({ m }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{monthLabel(m.month)}</h3>
          <p className="text-sm text-stone-500">{resultText(m)}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold">{money(m.earned)}</p>
          <p className="text-xs text-stone-500">
            {m.goal !== null ? `${m.percentOfGoal ?? 0}% of ${money(m.goal)}` : 'No goal set'}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <Stat label="Completed shifts" value={m.completedShifts} />
        <Stat label="Total hours" value={hoursLabel(m.totalHours)} />
        <Stat label="Avg hourly pay" value={money(m.averageHourlyPay)} />
        <Stat label="Avg per shift" value={money(m.averageShiftPay)} />
      </dl>

      {m.byFacility.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <p className="mb-1.5 text-xs font-medium text-stone-500">Income by facility</p>
          <ul className="space-y-1 text-sm">
            {m.byFacility.map((f) => (
              <li key={f.facility} className="flex justify-between gap-3">
                <span className="truncate">
                  {f.facility} <span className="text-stone-400">· {plural(f.shifts, 'shift')}</span>
                </span>
                <span className="font-medium">{money(f.earned)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function resultText(m) {
  if (m.goal === null) return m.inProgress ? 'In progress' : 'No goal set'
  const diff = Number(m.difference)
  if (diff >= 0) return `Exceeded by ${money(diff)}`.replace('Exceeded by $0.00', 'Met exactly')
  return m.inProgress ? `In progress · ${money(-diff)} to go` : `Missed by ${money(-diff)}`
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
