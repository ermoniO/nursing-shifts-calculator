import { useEffect, useState } from 'react'
import { api, getToken, setUnauthorizedHandler, signOut } from './lib/api.js'
import { currentMonth } from './lib/format.js'
import Login from './components/Login.jsx'
import CalendarView from './components/CalendarView.jsx'
import ListView from './components/ListView.jsx'
import HistoryView from './components/HistoryView.jsx'
import ShiftFormModal from './components/ShiftFormModal.jsx'
import ShiftDetailsModal from './components/ShiftDetailsModal.jsx'

const TABS = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'list', label: 'Shifts' },
  { id: 'history', label: 'History' },
]

export default function App() {
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken()))
  const [tab, setTab] = useState('calendar')
  const [month, setMonth] = useState(currentMonth())
  const [refreshKey, setRefreshKey] = useState(0)

  // null | { type: 'add', date } | { type: 'edit', shift } | { type: 'details', shift }
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSignedIn(false)
      setModal(null)
    })
  }, [])

  const refresh = () => setRefreshKey((k) => k + 1)

  const openShift = (shift) => {
    setActionError(null)
    setModal({ type: 'details', shift })
  }
  const openAdd = (date) => setModal({ type: 'add', date })

  // Tapping a date: a shift there opens its details, an empty date opens the add form.
  const onDayClick = (date, shift) => (shift ? openShift(shift) : openAdd(date))

  const setCanceled = async (shift, canceled) => {
    setBusy(true)
    setActionError(null)
    try {
      const updated = canceled ? await api.cancelShift(shift.id) : await api.restoreShift(shift.id)
      if (modal?.type === 'details') setModal({ type: 'details', shift: updated })
      refresh()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!signedIn) {
    return <Login onSignedIn={() => setSignedIn(true)} />
  }

  return (
    <div className="min-h-dvh pb-24 sm:pb-10">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-100/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white">
              $
            </span>
            <h1 className="text-[15px] font-semibold tracking-tight">Nursing Shifts Calculator</h1>
          </div>
          <nav className="hidden gap-1 sm:flex" aria-label="Views">
            {TABS.map((t) => (
              <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </TabButton>
            ))}
          </nav>
          <button onClick={signOut} className="text-sm text-stone-500 hover:text-stone-800">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-5">
        {tab === 'calendar' && (
          <CalendarView month={month} setMonth={setMonth} refreshKey={refreshKey} onDayClick={onDayClick} onChange={refresh} />
        )}
        {tab === 'list' && (
          <ListView
            month={month}
            setMonth={setMonth}
            refreshKey={refreshKey}
            onOpen={openShift}
            onToggleCanceled={setCanceled}
            busy={busy}
            error={modal ? null : actionError}
          />
        )}
        {tab === 'history' && <HistoryView refreshKey={refreshKey} />}
      </main>

      {/* Bottom tab bar on phones */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="Views"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3.5 text-sm font-medium ${tab === t.id ? 'text-teal-700' : 'text-stone-500'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {modal?.type === 'add' && (
        <ShiftFormModal
          initialDate={modal.date}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            refresh()
          }}
        />
      )}
      {modal?.type === 'edit' && (
        <ShiftFormModal
          shift={modal.shift}
          onClose={() => setModal({ type: 'details', shift: modal.shift })}
          onSaved={(saved) => {
            setModal({ type: 'details', shift: saved })
            refresh()
          }}
        />
      )}
      {modal?.type === 'details' && (
        <ShiftDetailsModal
          shift={modal.shift}
          busy={busy}
          error={actionError}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', shift: modal.shift })}
          onCancel={() => setCanceled(modal.shift, true)}
          onRestore={() => setCanceled(modal.shift, false)}
        />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-800'
      }`}
    >
      {children}
    </button>
  )
}
