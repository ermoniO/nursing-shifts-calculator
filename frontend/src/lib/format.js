// Display helpers. All calculations that affect totals happen on the server;
// these only format what it returns.

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** $1,234.50 */
export function money(value) {
  if (value === null || value === undefined) return '—'
  return usd.format(Number(value))
}

/** $540 when whole, $249.97 otherwise (used where space is tight). */
export function moneyCompact(value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  return Number.isInteger(n) ? usdWhole.format(n) : usd.format(n)
}

function parseTime(time) {
  const [h, m] = String(time).split(':').map(Number)
  return { h, m }
}

/** "07:00:00" -> "7a", "19:30" -> "7:30p" */
export function shortTime(time) {
  const { h, m } = parseTime(time)
  const suffix = h < 12 ? 'a' : 'p'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

/** "07:00:00" -> "7:00 AM" */
export function longTime(time) {
  const { h, m } = parseTime(time)
  const suffix = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

/** "07:00:00" -> "07:00" (for <input type="time">) */
export function inputTime(time) {
  return String(time).slice(0, 5)
}

/** Builds a Date at local midnight, so "2026-11-11" never shifts a day by time zone. */
export function localDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "2026-11-11" -> "Wed, Nov 11" */
export function shortDate(iso) {
  return localDate(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "2026-11-11" -> "Wednesday, November 11, 2026" */
export function longDate(iso) {
  return localDate(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "2026-11" -> "November 2026" */
export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** "2026-11" -> "Nov" */
export function monthShort(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

export function currentMonth() {
  return toIsoDate(new Date()).slice(0, 7)
}

export function todayIso() {
  return toIsoDate(new Date())
}

export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return toIsoDate(d).slice(0, 7)
}

/** "12.00" -> "12", "7.50" -> "7.5" */
export function hoursLabel(hours) {
  return String(Number(hours))
}

export function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
