import { questById } from './quests'

// Effort tiers multiply a sport's base points + minutes.
export const TIERS = [
  { id: 'light', label: 'Light', mult: 1, hint: 'easy session' },
  { id: 'medium', label: 'Medium', mult: 1.5, hint: 'solid effort' },
  { id: 'hard', label: 'Hard', mult: 2, hint: 'all out' },
]
export const tierById = (id) => TIERS.find((t) => t.id === id)
export const tierMult = (id) => tierById(id)?.mult ?? 1

// Sports per boy. Colors are deuteranopia-safe; each also carries a distinct
// glyph so it reads without color. `meetFlag` adds a "this was a meet" toggle.
export const SPORTS = [
  { id: 'bball', name: 'Basketball', glyph: '🏀', color: 'var(--amber)', owners: ['everett', 'parker'], min: 30, pts: 16,
    drills: ['Shooting form · 50 makes', 'Ball-handling ladder', 'Defensive slides', 'Free throws · make 20', '3-on-3 / pickup', 'Conditioning sprints'] },
  { id: 'jrotc', name: 'JROTC Spartan', glyph: '🎖', color: 'var(--purple)', owners: ['everett'], min: 40, pts: 22,
    drills: ['Spartan PT circuit', 'Ruck / march', 'Push-up + sit-up test', 'Drill & ceremony', 'Land nav study', 'Leadership reading'] },
  { id: 'lift', name: 'Weightlifting', glyph: '🏋', color: 'var(--teal)', owners: ['everett'], min: 35, pts: 18,
    drills: ['Upper body', 'Lower body / legs', 'Push day', 'Pull day', 'Full-body circuit', 'Core + mobility'] },
  { id: 'swim', name: 'Swim', glyph: '🏊', color: 'var(--blue)', owners: ['parker'], min: 45, pts: 22, meetFlag: true,
    drills: ['Freestyle sets', 'Kick sets', 'Pull / technique', 'IM mix', 'Sprint 50s', 'Distance endurance'] },
]
export const sportsByPlayer = (playerId) => SPORTS.filter((s) => s.owners.includes(playerId))
export const sportById = (id) => SPORTS.find((s) => s.id === id)
export const isSport = (id) => Boolean(sportById(id))

// Unified lookup over quests + sports, used by the points engine.
export const defById = (id) => questById(id) || sportById(id)

// Custom activities (kid- or parent-created) carry their own value inline on
// the day-state entry, so they have no static def. Detect them by that field.
export const isCustom = (data) => Boolean(data && data.custom)

// Tier-aware value for any item: custom activities use their embedded reward,
// quests are always 1x, sports scale by their chosen effort tier.
export function itemValue(id, data) {
  if (isCustom(data)) {
    const { min = 0, pts = 0 } = data.custom
    return { min, pts }
  }
  const def = defById(id)
  if (!def) return { min: 0, pts: 0 }
  const m = isSport(id) ? tierMult(data?.tier) : 1
  return { min: Math.round(def.min * m), pts: Math.round(def.pts * m) }
}
