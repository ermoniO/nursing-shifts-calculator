// Talks to the Spring Boot API. Every call except login sends the saved token.

const TOKEN_KEY = 'nsc-token'
let onUnauthorized = () => {}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Private browsing can block storage; the session just won't be remembered.
  }
}

export function signOut() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
  onUnauthorized()
}

/** App.jsx registers this so an expired token sends you back to the password screen. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

async function request(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0)
  }

  const data = await res.json().catch(() => null)

  if (res.status === 401 && path !== '/auth/login') {
    signOut()
    throw new ApiError('Please sign in again.', 401)
  }
  if (!res.ok) {
    throw new ApiError(data?.message || `Something went wrong (${res.status}).`, res.status)
  }
  return data
}

export const api = {
  async login(password) {
    const { token } = await request('POST', '/auth/login', { password })
    saveToken(token)
  },
  month: (ym) => request('GET', `/months/${ym}`),
  setGoal: (ym, amount) => request('PUT', `/months/${ym}/goal`, { amount }),
  shifts: ({ month, status } = {}) => {
    const params = new URLSearchParams()
    if (month) params.set('month', month)
    if (status) params.set('status', status)
    const qs = params.toString()
    return request('GET', `/shifts${qs ? `?${qs}` : ''}`)
  },
  createShift: (shift) => request('POST', '/shifts', shift),
  updateShift: (id, shift) => request('PUT', `/shifts/${id}`, shift),
  cancelShift: (id) => request('POST', `/shifts/${id}/cancel`),
  restoreShift: (id) => request('POST', `/shifts/${id}/restore`),
  facilities: () => request('GET', '/facilities'),
  payRates: () => request('GET', '/pay-rates'),
  history: () => request('GET', '/history'),
}
