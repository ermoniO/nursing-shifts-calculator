import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { localDate, moneyCompact, shortTime, todayIso, toIsoDate } from '../lib/format.js'
import { Card, ErrorNote, MonthNav } from './ui.jsx'
import GoalSummary from './GoalSummary.jsx'
import EstimatePanel from './EstimatePanel.jsx'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ month, setMonth, refreshKey, onDayClick, onChange }) {
  const { data, error, loading } = useApi(() => api.month(month), [month, refreshKey])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MonthNav month={month} setMonth={setMonth} />
        {loading && <span className="text-sm text-stone-400">Loading…</span>}
      </div>
      <ErrorNote>{error}</ErrorNote>

      {data && data.month === month && (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <GoalSummary data={data} onSaved={onChange} />
            <EstimatePanel data={data} />
          </div>
          <MonthGrid month={month} shifts={data.shifts} onDayClick={onDayClick} />
          <Legend />
        </>
      )}
    </div>
  )
}

function MonthGrid({ month, shifts, onDayClick }) {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const daysInMonth = new Date(y, m, 0).getDate()
  const leading = first.getDay()
  const today = todayIso()
  const byDate = Object.fromEntries(shifts.map((s) => [s.date, s]))

  const cells = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toIsoDate(new Date(y, m - 1, d)))
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) =>
          date ? (
            <DayCell key={date} date={date} shift={byDate[date]} isToday={date === today} onClick={onDayClick} />
          ) : (
            <div key={`blank-${i}`} className="min-h-[76px] border-b border-r border-stone-100 bg-stone-50/60 sm:min-h-[104px]" />
          ),
        )}
      </div>
    </Card>
  )
}

function DayCell({ date, shift, isToday, onClick }) {
  const day = localDate(date).getDate()
  return (
    <button
      onClick={() => onClick(date, shift)}
      aria-label={shift ? `Shift on ${date}` : `Add a shift on ${date}`}
      className="group flex min-h-[76px] flex-col items-stretch gap-1 border-b border-r border-stone-100 p-1 text-left hover:bg-teal-50/40 sm:min-h-[104px] sm:p-1.5"
    >
      <span
        className={`grid size-6 place-items-center self-start rounded-full text-xs font-medium ${
          isToday ? 'bg-stone-900 text-white' : 'text-stone-600'
        }`}
      >
        {day}
      </span>
      {shift ? (
        <ShiftChip shift={shift} />
      ) : (
        <span className="hidden flex-1 items-center justify-center text-lg text-stone-300 group-hover:flex">+</span>
      )}
    </button>
  )
}

const CHIP = {
  SCHEDULED: 'bg-teal-50 text-teal-900 ring-1 ring-inset ring-teal-200',
  COMPLETED: 'bg-teal-700 text-white',
  CANCELED: 'bg-stone-100 text-stone-400 line-through',
}

/** Just the essentials: time and pay. Tap for details. */
function ShiftChip({ shift }) {
  return (
    <span className={`rounded-md px-1 py-1 text-[10px] leading-tight sm:px-1.5 sm:text-xs ${CHIP[shift.status]}`}>
      <span className="block whitespace-nowrap">
        {shortTime(shift.startTime)}–{shortTime(shift.endTime)}
      </span>
      <span className="block font-semibold">{moneyCompact(shift.pay)}</span>
    </span>
  )
}

function Legend() {
  const items = [
    ['Scheduled', CHIP.SCHEDULED.replace('line-through', '')],
    ['Completed', CHIP.COMPLETED],
    ['Canceled', CHIP.CANCELED.replace('line-through', '')],
  ]
  return (
    <div className="flex flex-wrap gap-4 px-1 text-xs text-stone-500">
      {items.map(([label, cls]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`size-3 rounded ${cls}`} />
          {label}
        </span>
      ))}
      <span className="ml-auto">Tap a date to add a shift</span>
    </div>
  )
}
