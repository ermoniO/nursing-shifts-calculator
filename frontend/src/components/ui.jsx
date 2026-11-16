import { useEffect } from 'react'
import { addMonths, monthLabel } from '../lib/format.js'

const STATUS_STYLES = {
  SCHEDULED: 'bg-teal-50 text-teal-800 ring-teal-200',
  COMPLETED: 'bg-teal-700 text-white ring-teal-700',
  CANCELED: 'bg-stone-100 text-stone-500 ring-stone-200',
}
const STATUS_LABELS = { SCHEDULED: 'Scheduled', COMPLETED: 'Completed', CANCELED: 'Canceled' }

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function MonthNav({ month, setMonth }) {
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
        ‹
      </IconButton>
      <h2 className="min-w-40 text-center text-lg font-semibold tracking-tight">{monthLabel(month)}</h2>
      <IconButton label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
        ›
      </IconButton>
    </div>
  )
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg text-xl text-stone-600 hover:bg-white hover:text-stone-900"
    >
      {children}
    </button>
  )
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid size-8 place-items-center rounded-lg text-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ErrorNote({ children }) {
  if (!children) return null
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{children}</p>
}

export function Card({ className = '', children }) {
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 ${className}`}>{children}</div>
}
