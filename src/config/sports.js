import { questById } from './quests'
import { activeSports, activeScreenRate } from './activeFamily'

// Effort tiers multiply a sport's base points + minutes.
export const TIERS = [
  { id: 'light', label: 'Light', mult: 1, hint: 'easy session' },
  { id: 'medium', label: 'Medium', mult: 1.5, hint: 'solid effort' },
  { id: 'hard', label: 'Hard', mult: 2, hint: 'all out' },
]
export const tierById = (id) => TIERS.find((t) => t.id === id)
export const tierMult = (id) => tierById(id)?.mult ?? 1

// Default sports (the Eaker family / single-family path). Colors are
// deuteranopia-safe; each also carries a distinct glyph so it reads without
// color. `meetFlag` adds a "this was a meet" toggle.
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

// Standard sports catalog — what a family can pick from when setting up their
// own sports. Each carries sensible default min/pts + starter drills, all
// editable after they're added. Distinct glyphs so they read without color.
export const STANDARD_SPORTS = [
  { key: 'bball', name: 'Basketball', glyph: '🏀', min: 30, pts: 16, drills: ['Shooting · 50 makes', 'Ball-handling ladder', 'Defensive slides', 'Free throws · make 20', 'Pickup / scrimmage', 'Conditioning sprints'] },
  { key: 'soccer', name: 'Soccer', glyph: '⚽', min: 35, pts: 18, drills: ['Dribbling course', 'Passing wall · 100 touches', 'Shooting on goal', 'Juggling reps', 'Sprints / agility', 'Scrimmage'] },
  { key: 'baseball', name: 'Baseball / Softball', glyph: '⚾', min: 35, pts: 18, drills: ['Batting tee / cage', 'Fielding grounders', 'Throwing long toss', 'Base-running', 'Pitching / bullpen', 'Catch + footwork'] },
  { key: 'football', name: 'Football', glyph: '🏈', min: 40, pts: 20, drills: ['Route running', 'Footwork ladder', 'Catching reps', 'Conditioning', 'Film / playbook', 'Strength work'] },
  { key: 'swim', name: 'Swim', glyph: '🏊', min: 45, pts: 22, meetFlag: true, drills: ['Freestyle sets', 'Kick sets', 'Pull / technique', 'IM mix', 'Sprint 50s', 'Distance endurance'] },
  { key: 'volleyball', name: 'Volleyball', glyph: '🏐', min: 35, pts: 18, drills: ['Passing / bumping', 'Setting reps', 'Serving · make 20', 'Hitting approach', 'Blocking footwork', 'Scrimmage'] },
  { key: 'tennis', name: 'Tennis', glyph: '🎾', min: 35, pts: 18, drills: ['Forehand rally', 'Backhand rally', 'Serve · make 25', 'Volleys at net', 'Footwork drills', 'Match play'] },
  { key: 'track', name: 'Track / Running', glyph: '🏃', min: 35, pts: 18, meetFlag: true, drills: ['Easy distance run', 'Interval sprints', 'Hill repeats', 'Form drills', 'Tempo run', 'Cooldown + stretch'] },
  { key: 'lift', name: 'Weightlifting', glyph: '🏋', min: 35, pts: 18, drills: ['Upper body', 'Lower body / legs', 'Push day', 'Pull day', 'Full-body circuit', 'Core + mobility'] },
  { key: 'martial', name: 'Martial Arts', glyph: '🥋', min: 40, pts: 20, drills: ['Forms / katas', 'Sparring', 'Technique drills', 'Conditioning', 'Flexibility', 'Belt requirements'] },
  { key: 'gymnastics', name: 'Gymnastics', glyph: '🤸', min: 40, pts: 20, meetFlag: true, drills: ['Conditioning', 'Floor routine', 'Balance / beam', 'Bars / strength', 'Flexibility', 'Vault / tumbling'] },
  { key: 'dance', name: 'Dance', glyph: '🩰', min: 35, pts: 18, drills: ['Technique class', 'Choreography', 'Stretch / flexibility', 'Across-the-floor', 'Routine run-through', 'Strength / core'] },
  { key: 'golf', name: 'Golf', glyph: '⛳', min: 35, pts: 16, drills: ['Driving range', 'Putting · 30 min', 'Chipping / short game', 'Bunker practice', 'Play 9 holes', 'Swing video review'] },
  { key: 'cycling', name: 'Cycling', glyph: '🚴', min: 40, pts: 18, drills: ['Endurance ride', 'Hill intervals', 'Sprints', 'Skills / handling', 'Recovery spin', 'Strength / core'] },
  { key: 'climbing', name: 'Climbing', glyph: '🧗', min: 35, pts: 18, drills: ['Bouldering problems', 'Top-rope routes', 'Grip / hangboard', 'Footwork drills', 'Endurance laps', 'Stretch / mobility'] },
  { key: 'wrestling', name: 'Wrestling', glyph: '🤼', min: 40, pts: 20, meetFlag: true, drills: ['Takedown drills', 'Live wrestling', 'Conditioning', 'Technique / film', 'Strength', 'Weight management'] },
]

// Active sports: the family's configured sports when running multi-tenant, else
// the default SPORTS (single-family / flag-off path).
export const getSports = () => activeSports(SPORTS)

export const sportsByPlayer = (playerId) => getSports().filter((s) => (s.owners || []).includes(playerId))
export const sportById = (id) => getSports().find((s) => s.id === id)
export const isSport = (id) => Boolean(sportById(id))

// Unified lookup over quests + sports, used by the points engine.
export const defById = (id) => questById(id) || sportById(id)

// Custom activities (kid- or parent-created) carry their own value inline on
// the day-state entry, so they have no static def. Detect them by that field.
export const isCustom = (data) => Boolean(data && data.custom)

// Tier-aware value for any item: custom activities use their embedded reward,
// quests are always 1x, sports scale by their chosen effort tier. The family's
// screen-time generosity multiplier scales earned MINUTES (not points), and not
// one-off custom items (those carry exact, intended values).
export function itemValue(id, data) {
  if (isCustom(data)) {
    const { min = 0, pts = 0 } = data.custom
    return { min, pts }
  }
  const def = defById(id)
  if (!def) return { min: 0, pts: 0 }
  const m = isSport(id) ? tierMult(data?.tier) : 1
  const rate = activeScreenRate()
  return { min: Math.round(def.min * m * rate), pts: Math.round(def.pts * m) }
}
