// Display helpers.

// Format a minute count as hours + minutes for easy kid comprehension.
//   0   -> '0m'        45  -> '45m'
//   60  -> '1h'        90  -> '1h 30m'
//   -90 -> '−1h 30m'   (negatives keep a sign, used for parent dockings)
export function fmtMins(n) {
  const v = Math.round(Number(n) || 0)
  const sign = v < 0 ? '−' : ''
  const abs = Math.abs(v)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h === 0) return `${sign}${m}m`
  if (m === 0) return `${sign}${h}h`
  return `${sign}${h}h ${m}m`
}
