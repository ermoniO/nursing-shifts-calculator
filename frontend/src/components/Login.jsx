import { useState } from 'react'
import { api } from '../lib/api.js'

export default function Login({ onSignedIn }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.login(password)
      onSignedIn()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm ring-1 ring-stone-200">
        <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-lg font-bold text-white">$</span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Nursing Shifts Calculator</h1>
        <p className="mt-1 text-sm text-stone-500">Enter your password to continue.</p>
        <label className="mt-6 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          className="field mt-1.5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <button
          disabled={busy || !password}
          className="mt-5 w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
