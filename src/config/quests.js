// Players. Avatars/colors are deuteranopia-safe (blue/purple vs coral/amber).
export const PLAYERS = [
  { id: 'everett', name: 'Everett', age: 14, avatar: '🧭', key: 'everett' },
  { id: 'parker', name: 'Parker', age: 11, avatar: '🌊', key: 'parker' },
]

// Each category carries BOTH a distinct color and a distinct shape glyph.
// Never rely on color alone (deuteranopia-safe).
export const WEEKDAY_QUESTS = [
  { id: 'read', cat: 'Reading', glyph: '▲', color: 'var(--blue)', min: 30, pts: 15, title: 'Read 30 minutes',
    ideas: ['Series book', 'Graphic novel', 'Scriptures', 'Nonfiction you like', 'Audiobook + follow along'] },
  { id: 'out', cat: 'Outdoor / active', glyph: '◆', color: 'var(--teal)', min: 35, pts: 18, title: 'Get active outside',
    byPlayer: {
      everett: { ideas: ['JROTC PT / workout', 'Bike ride', 'Basketball', 'Run', 'Yard sport'] },
      parker: { ideas: ['Swim practice / laps', 'Bike ride', 'Basketball', 'Scooter', 'Tag with friends'] },
    } },
  { id: 'chore', cat: 'Chores', glyph: '■', color: 'var(--coral)', min: 20, pts: 12, title: "Today's chore done",
    ideas: ['Dishes', 'Trash + recycling', 'Mow / yard', 'Clean your room', 'Help with laundry'] },
  { id: 'skill', cat: 'Skill practice', glyph: '★', color: 'var(--purple)', min: 30, pts: 15, title: 'Skill practice (15+ min)',
    byPlayer: {
      everett: { ideas: ['JROTC drill / study', 'Instrument', 'Coding', 'Cook a meal', 'Knots / first aid'] },
      parker: { ideas: ['Instrument', 'Drawing', 'Typing', 'Cook with help', 'Lego engineering'] },
    } },
  { id: 'scrip', cat: 'Scripture / spiritual', glyph: '✦', color: 'var(--amber)', min: 20, pts: 12, title: 'Scripture + journal',
    ideas: ['Come Follow Me', 'Memorize a verse', 'Pray + ponder', 'Family scripture', 'Journal a thought'] },
  { id: 'biz', cat: 'Side business / money', glyph: '●', color: 'var(--teal)', min: 40, pts: 22, title: 'Side business work',
    byPlayer: {
      everett: { title: 'Business build (not launched yet)', ideas: ['Write a business-plan section', 'Design a flyer / logo', 'Price + route research', 'Ask 1 neighbor / set availability', 'Build a booking calendar'] },
      parker: { title: 'Money / job goal', ideas: ['Odd job for pay', 'Save part of allowance', 'Help Everett with bins', 'Lemonade / car wash', 'Budget toward a goal'] },
    } },
  { id: 'make', cat: 'Creative', glyph: '◗', color: 'var(--purple)', min: 25, pts: 14, title: 'Build / make something',
    ideas: ['Lego / build', 'Draw or comic', 'Make a video', 'Woodworking', 'Write music / a song'] },
  { id: 'serve', cat: 'Service', glyph: '✚', color: 'var(--coral)', min: 35, pts: 18, title: 'Help someone today',
    ideas: ['Help your brother', 'Help Mom / Dad', 'Call a grandparent', 'Tidy a shared space', 'Serve a neighbor'] },
  { id: 'friend', cat: 'Friends / social', glyph: '◑', color: 'var(--blue)', min: 40, pts: 20, title: 'Invite a friend (screen-free)',
    ideas: ['Shoot hoops together', 'Bike or scooter ride', 'Build / make something', 'Pool or swim', 'Yard game or tag'] },
  { id: 'b1', bonus: true, cat: 'Bonus', glyph: '＋', color: 'var(--amber)', min: 45, pts: 25, title: 'Read a chapter out loud',
    ideas: ['To a sibling', 'To a parent', 'Record it'] },
  { id: 'b2', bonus: true, cat: 'Bonus', glyph: '＋', color: 'var(--amber)', min: 45, pts: 25, title: 'Teach your brother a new skill',
    ideas: ['A drill / move', 'A recipe', 'A game'] },
]

// Weekend set is OPTIONAL. Verified weekend quests bank extra screen
// minutes + team points but do not break the weekday streak.
export const WEEKEND_QUESTS = [
  { id: 'wadv', cat: 'Family adventure', glyph: '◆', color: 'var(--teal)', min: 40, pts: 20, title: 'Join a family outing / adventure',
    ideas: ['Hike / lake', 'Bike the trail', 'Help plan it', 'Pack the cooler', 'Be a good sport'] },
  { id: 'wbuild', cat: 'Big build / project', glyph: '◗', color: 'var(--purple)', min: 50, pts: 24, title: 'Long creative / build project',
    ideas: ['Finish a build', 'Film + edit a video', 'Woodworking with Dad', 'Big Lego set', 'Paint / draw a piece'] },
  { id: 'wserve', cat: 'Service project', glyph: '✚', color: 'var(--coral)', min: 45, pts: 22, title: 'Bigger service project',
    ideas: ['Yard work for a neighbor', 'Church service', 'Help a sibling all day', 'Clean the garage', 'Visit grandparents'] },
  { id: 'wprep', cat: 'Prep for the week', glyph: '✦', color: 'var(--amber)', min: 25, pts: 14, title: 'Set up next week',
    ideas: ['Reset your room', 'Lay out the week', 'Plan business steps', 'Sunday scriptures', 'Charge + stash devices'] },
  { id: 'wread', cat: 'Reading', glyph: '▲', color: 'var(--blue)', min: 35, pts: 16, title: 'Long read (45+ min)',
    ideas: ['Dive into a book', 'Read with a sibling', 'Scriptures', 'Read outside'] },
  { id: 'wfriend', cat: 'Friends / social', glyph: '◑', color: 'var(--blue)', min: 45, pts: 20, title: 'Adventure with a friend',
    ideas: ['Trail or lake day', 'Pickup game', 'Build a fort / project', 'Bike somewhere new', 'Help a friend with a job'] },
]

export const ALL_QUESTS = [...WEEKDAY_QUESTS, ...WEEKEND_QUESTS]
const rawById = (id) => ALL_QUESTS.find((q) => q.id === id)

// ---- in-app quest edits (parent) ----
// A module-level registry of overrides keyed by quest id. The family-state hook
// pushes the Firestore `questDefs` map in here whenever it changes, so the whole
// app — display (resolveQuest) AND the points engine (questById → itemValue) —
// reflects edited title/min/pts without threading state through every layer.
// Only known fields are honored; `hidden` removes a quest from the board.
let _questOverrides = {}
const EDITABLE = ['title', 'min', 'pts', 'hidden']
const cleanOverride = (o = {}) => {
  const out = {}
  EDITABLE.forEach((k) => { if (o[k] !== undefined && o[k] !== null && o[k] !== '') out[k] = o[k] })
  return out
}
export function setQuestOverrides(map) {
  _questOverrides = {}
  Object.entries(map || {}).forEach(([id, o]) => { _questOverrides[id] = cleanOverride(o) })
}
export const questOverride = (id) => _questOverrides[id] || {}
export const isQuestHidden = (id) => Boolean(_questOverrides[id]?.hidden)

// Lookup merges any parent override over the static def.
export const questById = (id) => {
  const base = rawById(id)
  return base ? { ...base, ...questOverride(id) } : base
}

// Resolve a quest for a specific player. Order: static def → per-player override
// (title/ideas) → parent in-app edit (title/min/pts wins last).
export function resolveQuest(quest, playerId) {
  const byPlayer = (quest.byPlayer && quest.byPlayer[playerId]) || {}
  return { ...quest, ...byPlayer, ...questOverride(quest.id) }
}

export const ANCHORS = {
  weekday: [
    { t: '8:30a', x: 'Morning Launch · scripture + plan the day', g: '✦' },
    { t: '12:30p', x: 'Outside Hour · no screens, go move', g: '◆' },
    { t: '4:00p', x: 'Power Down · screens off, family time', g: '◇' },
  ],
  weekend: [
    { t: 'Sleep in', x: 'Slower start · breakfast together', g: '☀' },
    { t: 'Midday', x: 'Family adventure or big project', g: '◆' },
    { t: 'Evening', x: 'Prep for the week · early to bed Sun', g: '✦' },
  ],
}
