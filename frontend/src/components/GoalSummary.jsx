import { useState } from 'react'
import { api } from '../lib/api.js'
import { money, monthLabel } from '../lib/format.js'
import { Card, ErrorNote } from './ui.jsx'

export default function GoalSummary({ data, onSaved }) {
  const [editing, setEditing] = useState(false)
  const hasGoal = data.goal !== null && data.goal !== undefined

  if (!hasGoal || editing) {
    return (
      <Card className="p-5">
        <GoalForm
          month={data.month}
          initial={hasGoal ? data.goal : ''}
          onCancel={hasGoal ? () => setEditing(false) : null}
          onSaved={() => {
            setEditing(false)
            onSaved()
          }}
        />
      </Card>
    )
  }

  const goal = Number(data.goal)
  const earned = Number(data.earned)
  const scheduled = Number(data.scheduled)
  const earnedPct = goal > 0 ? Math.min(100, (earned / goal) * 100) : 100
  const scheduledPct = goal > 0 ? Math.min(100 - earnedPct, (scheduled / goal) * 100) : 0

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">Goal for {monthLabel(data.month)}</p>
          <p className="mt-0.5 text-3xl font-semibold tracking-tight">{money(data.goal)}</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-sm font-medium text-teal-700 hover:text-teal-900">
          Edit goal
        </button>
      </div>

      <div
        className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-stone-100"
        role="img"
        aria-label={`${money(earned)} earned and ${money(scheduled)} scheduled of ${money(goal)}`}
      >
        {earnedPct > 0 && <div className="rounded-full bg-teal-700" style={{ width: `${earnedPct}%` }} />}
        {scheduledPct > 0 && <div className="rounded-full bg-teal-300" style={{ width: `${scheduledPct}%` }} />}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Earned" value={money(data.earned)} dot="bg-teal-700" />
        <Stat label="Scheduled" value={money(data.scheduled)} dot="bg-teal-300" />
        {data.goalMet ? (
          <Stat label="Still need" value="Goal met" emphasis />
        ) : (
          <Stat label="Still need" value={money(data.stillNeeded)} emphasis />
        )}
      </dl>
    </Card>
  )
}

function Stat({ label, value, dot, emphasis }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-stone-500">
        {dot && <span className={`size-2 rounded-full ${dot}`} />}
        {label}
      </dt>
      <dd className={`mt-0.5 font-semibold ${emphasis ? 'text-stone-900' : 'text-stone-700'} text-[15px] sm:text-base`}>
        {value}
      </dd>
    </div>
  )
}

function GoalForm({ month, initial, onCancel, onSaved }) {
  const [amount, setAmount] = useState(initial === '' ? '' : String(Number(initial)))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.setGoal(month, Number(amount))
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="goal" className="text-sm font-medium">
          How much do you need to make in {monthLabel(month)}?
        </label>
        <p className="text-xs text-stone-500">Gross income, before taxes.</p>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">$</span>
        <input
          id="goal"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          autoFocus
          placeholder="5000"
          className="field pl-7"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-2">
        <button
          disabled={busy || amount === ''}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save goal'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
