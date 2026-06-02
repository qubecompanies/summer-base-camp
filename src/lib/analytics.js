import { defById, itemValue, isCustom } from '../config/sports'
import { BADGES } from '../config/badges'

const VERIFIED = new Set(['proof', 'approved'])
export const isVerified = (s) => VERIFIED.has(s)

// ---- date helpers (local time, matches Firestore day-doc ids) ----
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Last n calendar dates ending today (oldest first).
export function lastNDates(n, ref = new Date()) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref)
    d.setDate(ref.getDate() - i)
    out.push(dateKey(d))
  }
  return out
}

// ---- per-day aggregation ----
export function dayPoints(dayState) {
  const quests = (dayState && dayState.quests) || {}
  let pts = 0
  for (const [qid, q] of Object.entries(quests)) {
    if (!isVerified(q.status)) continue
    if (defById(qid) || isCustom(q)) pts += itemValue(qid, q).pts
  }
  return pts
}

export function dayActive(dayState) {
  const quests = (dayState && dayState.quests) || {}
  return Object.values(quests).some((q) => isVerified(q.status))
}

// ---- streak ----
// Consecutive WEEKDAYS (Mon–Fri) with at least one verified quest, counting
// back from today. Weekends are skipped (optional — they never break it).
// Today is graced: an as-yet-empty weekday today doesn't zero the streak.
export function computeStreak(historyByDate, ref = new Date()) {
  let streak = 0
  const cursor = new Date(ref)
  const todayDow = ref.getDay()
  if (todayDow >= 1 && todayDow <= 5) {
    if (dayActive(historyByDate[dateKey(cursor)])) streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  for (let i = 0; i < 60; i++) {
    const dow = cursor.getDay()
    if (dow >= 1 && dow <= 5) {
      if (dayActive(historyByDate[dateKey(cursor)])) streak++
      else break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ---- current-week point map keyed by weekday short name (Mon..Sun) ----
export function weekPointsMap(historyByDate, ref = new Date()) {
  const dow = (ref.getDay() + 6) % 7 // 0 = Monday
  const monday = new Date(ref)
  monday.setDate(ref.getDate() - dow)
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const map = {}
  names.forEach((n, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    map[n] = dayPoints(historyByDate[dateKey(d)])
  })
  return map
}

// ---- multi-week trend: total verified points per week (oldest first) ----
// Returns `weeks` buckets ending with the current week. Each bucket sums
// Mon..Sun day points. The current week is flagged for highlight.
export function weeklyTotals(historyByDate, weeks = 4, ref = new Date()) {
  const dow = (ref.getDay() + 6) % 7 // 0 = Monday
  const thisMonday = new Date(ref)
  thisMonday.setDate(ref.getDate() - dow)
  const out = []
  for (let w = weeks - 1; w >= 0; w--) {
    const monday = new Date(thisMonday)
    monday.setDate(thisMonday.getDate() - w * 7)
    let total = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      total += dayPoints(historyByDate[dateKey(d)])
    }
    out.push({
      label: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
      isCurrent: w === 0,
    })
  }
  return out
}

// ---- badges ----
// Builds the badge list with earned flags from real history. Each badge's
// check() reads a small ctx of derived helpers (see config/badges.js).
export function buildBadges(historyByDate, ref = new Date()) {
  const days = Object.values(historyByDate)
  const verifiedDayCount = (qid) =>
    days.filter((s) => isVerified(s?.quests?.[qid]?.status)).length
  const totalVerified = days.reduce(
    (a, s) => a + Object.values(s?.quests || {}).filter((q) => isVerified(q.status)).length,
    0,
  )
  const ctx = { verifiedDayCount, totalVerified, streak: computeStreak(historyByDate, ref) }
  return BADGES.map((b) => ({ ...b, got: Boolean(b.check(ctx)) }))
}
