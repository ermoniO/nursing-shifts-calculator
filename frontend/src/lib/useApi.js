import { useEffect, useState } from 'react'

/**
 * Loads data and re-loads whenever a dependency changes.
 * Keeps the last data on screen while a refresh is running, so nothing flickers.
 */
export function useApi(load, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    load()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((e) => alive && setState((s) => ({ data: s.data, error: e.message, loading: false })))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
