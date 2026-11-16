import { hoursLabel, longDate, longTime, money } from '../lib/format.js'
import { ErrorNote, Modal, StatusBadge } from './ui.jsx'

export default function ShiftDetailsModal({ shift, busy, error, onClose, onEdit, onCancel, onRestore }) {
  const canceled = shift.status === 'CANCELED'

  return (
    <Modal title={longDate(shift.date)} onClose={onClose}>
      <div className="flex items-center justify-between">
        <StatusBadge status={shift.status} />
        <p className={`text-2xl font-semibold tracking-tight ${canceled ? 'text-stone-400 line-through' : ''}`}>
          {money(shift.pay)}
        </p>
      </div>

      <dl className="mt-5 divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
        <Row label="Facility" value={shift.facility} />
        <Row label="Time" value={`${longTime(shift.startTime)} – ${longTime(shift.endTime)}`} />
        <Row label="Hours" value={hoursLabel(shift.hours)} />
        <Row label="Hourly pay" value={money(shift.hourlyPay)} />
      </dl>

      {canceled && (
        <p className="mt-3 text-xs text-stone-500">Canceled shifts don't count toward your totals.</p>
      )}

      <div className="mt-4">
        <ErrorNote>{error}</ErrorNote>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onEdit}
          disabled={busy}
          className="flex-1 rounded-lg bg-stone-900 py-2.5 font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          Edit
        </button>
        {canceled ? (
          <button
            onClick={onRestore}
            disabled={busy}
            className="flex-1 rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {busy ? 'Restoring…' : 'Restore shift'}
          </button>
        ) : (
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-lg py-2.5 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            {busy ? 'Canceling…' : 'Cancel shift'}
          </button>
        )}
      </div>
    </Modal>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
