// Anchor-time reminders. HONEST SCOPE: these are local notifications scheduled
// with setTimeout while the page is alive (foreground or backgrounded tab/PWA).
// Without a push server + Web Push subscription we cannot wake a fully-closed
// app — especially on iOS. So this nudges during the day while the app is open
// in the background; it is not a guaranteed alarm.

// Parse an anchor label like "8:30a" / "12:30p" / "4:00p" into {h, m} (24h).
// Returns null for non-time labels ("Sleep in", "Midday", ...).
export function parseAnchorTime(label) {
  const m = /^(\d{1,2}):(\d{2})\s*([ap])m?$/i.exec(String(label).trim())
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const pm = m[3].toLowerCase() === 'p'
  if (pm && h < 12) h += 12
  if (!pm && h === 12) h = 0
  return { h, m: min }
}

// A Date for an anchor at today's date (local time).
export function anchorDateToday(label) {
  const t = parseAnchorTime(label)
  if (!t) return null
  const d = new Date()
  d.setHours(t.h, t.m, 0, 0)
  return d
}

export const notifySupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

export async function requestNotifyPermission() {
  if (!notifySupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try { return await Notification.requestPermission() } catch { return 'denied' }
}

function fire(title, body) {
  if (!notifySupported() || Notification.permission !== 'granted') return
  // Prefer the SW registration (lets the notification persist if the tab is
  // backgrounded); fall back to a plain Notification.
  if (navigator.serviceWorker?.ready) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: title }))
      .catch(() => { try { new Notification(title, { body, icon: '/icon-192.png' }) } catch {} })
  } else {
    try { new Notification(title, { body, icon: '/icon-192.png' }) } catch {}
  }
}

// Schedule the remaining anchors for today. Returns a cancel() that clears all
// pending timers. `anchors` is the current mode's ANCHORS array.
export function scheduleAnchorReminders(anchors) {
  if (!notifySupported() || Notification.permission !== 'granted') return () => {}
  const now = Date.now()
  const timers = []
  anchors.forEach((a) => {
    const when = anchorDateToday(a.t)
    if (!when) return
    const delay = when.getTime() - now
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return
    timers.push(setTimeout(() => fire(`⏰ ${a.t} · Base Camp`, a.x), delay))
  })
  return () => timers.forEach(clearTimeout)
}

// How many of today's anchors are still upcoming (for honest UI copy).
export function upcomingAnchorCount(anchors) {
  const now = Date.now()
  return anchors.filter((a) => {
    const d = anchorDateToday(a.t)
    return d && d.getTime() > now
  }).length
}
