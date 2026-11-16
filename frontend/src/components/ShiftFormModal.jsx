import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { inputTime, longDate, longTime, money } from '../lib/format.js'
import { previewEnd, previewPay } from '../lib/pay.js'
import { ErrorNote, Modal } from './ui.jsx'

/**
 * Add a shift (pass initialDate) or edit one (pass shift).
 * Facility and pay offer values you've used before, and you can type new ones.
 */
export default function ShiftFormModal({ shift, initialDate, onClose, onSaved }) {
  const editing = Boolean(shift)
  const [form, setForm] = useState(() => ({
    date: shift?.date ?? initialDate,
    facility: shift?.facility ?? '',
    startTime: shift ? inputTime(shift.startTime) : '07:00',
    hours: shift ? String(Number(shift.hours)) : '',
    hourlyPay: shift ? String(Number(shift.hourlyPay)) : '',
  }))
  const [payTouched, setPayTouched] = useState(editing)
  const [facilities, setFacilities] = useState([])
  const [rates, setRates] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.facilities().then(setFacilities).catch(() => {})
    api.payRates().then(setRates).catch(() => {})
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Picking a facility fills in the last rate you used there, unless you've typed a rate.
  const onFacility = (e) => {
    const name = e.target.value
    const match = facilities.find((f) => f.name.toLowerCase() === name.trim().toLowerCase())
    setForm((f) => ({
      ...f,
      facility: name,
      hourlyPay: !payTouched && match?.lastRate ? String(Number(match.lastRate)) : f.hourlyPay,
    }))
  }

  const pay = previewPay(form.hours, form.hourlyPay)
  const end = previewEnd(form.startTime, form.hours)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const body = {
      date: form.date,
      facility: form.facility.trim(),
      startTime: form.startTime,
      hours: Number(form.hours),
      hourlyPay: Number(form.hourlyPay),
    }
    try {
      const saved = editing ? await api.updateShift(shift.id, body) : await api.createShift(body)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit shift' : 'Add shift'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Date" htmlFor="date" hint={form.date ? longDate(form.date) : null}>
          <input id="date" type="date" required className="field" value={form.date} onChange={set('date')} />
        </Field>

        <Field label="Facility" htmlFor="facility">
          <input
            id="facility"
            list="facility-options"
            required
            maxLength={120}
            autoComplete="off"
            placeholder="Choose or type a facility"
            className="field"
            value={form.facility}
            onChange={onFacility}
          />
          <datalist id="facility-options">
            {facilities.map((f) => (
              <option key={f.id} value={f.name} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start time" htmlFor="start">
            <input id="start" type="time" required className="field" value={form.startTime} onChange={set('startTime')} />
          </Field>
          <Field label="Hours" htmlFor="hours">
            <input
              id="hours"
              type="number"
              inputMode="decimal"
              min="0.25"
              max="24"
              step="0.25"
              required
              placeholder="12"
              className="field"
              value={form.hours}
              onChange={set('hours')}
            />
          </Field>
        </div>

        <Field label="Hourly pay" htmlFor="pay">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">$</span>
            <input
              id="pay"
              type="number"
              inputMode="decimal"
              list="pay-options"
              min="0.01"
              step="0.01"
              required
              placeholder="45.00"
              className="field pl-7"
              value={form.hourlyPay}
              onChange={(e) => {
                setPayTouched(true)
                set('hourlyPay')(e)
              }}
            />
            <datalist id="pay-options">
              {rates.map((r) => (
                <option key={r} value={Number(r)} />
              ))}
            </datalist>
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
          <div className="text-sm text-stone-500">
            {end ? `${longTime(form.startTime)} – ${longTime(end)}` : 'Enter a start time and hours'}
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">Shift total</div>
            <div className="text-lg font-semibold">{pay === null ? '—' : money(pay)}</div>
          </div>
        </div>

        <ErrorNote>{error}</ErrorNote>

        <div className="flex gap-2 pt-1">
          <button
            disabled={busy}
            className="flex-1 rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add shift'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-xs text-stone-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
