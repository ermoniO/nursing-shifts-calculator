// Live preview in the shift form. Mirrors ShiftMath.java so the number you see
// while typing matches what the server saves. Uses whole cents to avoid
// floating-point surprises (12 x 40.10 is 481.19999... in plain JavaScript).

/** Hours x hourly pay, rounded down to the cent. Returns dollars, or null if incomplete. */
export function previewPay(hours, hourlyPay) {
  const h = Number(hours)
  const r = Number(hourlyPay)
  if (!(h > 0) || !(r > 0)) return null
  const hundredthsOfHour = Math.round(h * 100)
  const rateCents = Math.round(r * 100)
  const cents = Math.floor((hundredthsOfHour * rateCents) / 100)
  return cents / 100
}

/** Start "07:00" + 12 hours -> "19:00". Wraps past midnight. */
export function previewEnd(start, hours) {
  const h = Number(hours)
  if (!start || !(h > 0)) return null
  const [sh, sm] = start.split(':').map(Number)
  const total = (sh * 60 + sm + Math.floor(h * 60)) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
