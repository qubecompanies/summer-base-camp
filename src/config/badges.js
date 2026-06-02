// Badge definitions. Each check(ctx) reads derived helpers from the last ~14
// days of a single boy's history (see lib/analytics.js buildBadges):
//   ctx.verifiedDayCount(questId) -> # of days that quest was verified
//   ctx.totalVerified             -> total verified quests across the window
//   ctx.totalPoints               -> total verified points across the window
//   ctx.activeDays                -> # of distinct days with a verified quest
//   ctx.choreCount                -> # of verified chores (quest + quick-logs)
//   ctx.streak                    -> current weekday streak
//
// THRESHOLDS ARE ILLUSTRATIVE — tune the numbers to taste. verifiedDayCount
// works for sport ids too (bball/jrotc/lift/swim), so Pool Shark and JROTC
// Grind key off the real sport practices.
//
// `tier` groups badges by horizon so the wall reads short → medium → long:
//   'short'  — quick, first-week wins to build momentum
//   'medium' — a couple weeks of consistency
//   'long'   — the big, season-long goals
export const BADGES = [
  // ---- short-term: easy first wins ----
  { e: '🌟', n: 'First Win',    tier: 'short', tip: 'Earn your first sign-off',   check: (c) => c.totalVerified >= 1 },
  { e: '🧹', n: 'Chore Starter',tier: 'short', tip: 'Knock out 3 chores',         check: (c) => c.choreCount >= 3 },
  { e: '📖', n: 'Bookworm',     tier: 'short', tip: 'Read on 5 days',             check: (c) => c.verifiedDayCount('read') >= 5 },
  { e: '🌅', n: 'Early Riser',  tier: 'short', tip: 'Morning scripture on 5 days', check: (c) => c.verifiedDayCount('scrip') >= 5 },
  { e: '💧', n: 'Hydrated',     tier: 'short', tip: 'Hydrate on 4 days',          check: (c) => c.verifiedDayCount('water') >= 4 },

  // ---- medium-term: a couple weeks of consistency ----
  { e: '🪣', n: 'Bin Boss',     tier: 'medium', tip: 'Chores on 5 days',          check: (c) => c.verifiedDayCount('chore') >= 5 },
  { e: '🧽', n: 'Chore Champ',  tier: 'medium', tip: 'Knock out 10 chores',       check: (c) => c.choreCount >= 10 },
  { e: '🏊', n: 'Pool Shark',   tier: 'medium', tip: 'Swim on 6 days',            check: (c) => c.verifiedDayCount('swim') >= 6 },
  { e: '🎖', n: 'JROTC Grind',  tier: 'medium', tip: 'JROTC practice on 6 days',  check: (c) => c.verifiedDayCount('jrotc') >= 6 },
  { e: '💛', n: 'Kind Heart',   tier: 'medium', tip: 'Kindness on 5 days',        check: (c) => c.verifiedDayCount('kind') >= 5 },
  { e: '🎵', n: 'Music Maker',  tier: 'medium', tip: 'Music practice on 5 days',  check: (c) => c.verifiedDayCount('music') >= 5 },
  { e: '🏆', n: 'No-Zero Week', tier: 'medium', tip: '5-weekday streak',          check: (c) => c.streak >= 5 },

  // ---- long-term: the big season goals ----
  { e: '🔥', n: 'On Fire',      tier: 'long', tip: '10-weekday streak',           check: (c) => c.streak >= 10 },
  { e: '💯', n: 'Centurion',    tier: 'long', tip: 'Earn 100 points',             check: (c) => c.totalPoints >= 100 },
  { e: '🚀', n: 'Point Rocket', tier: 'long', tip: 'Earn 250 points',            check: (c) => c.totalPoints >= 250 },
  { e: '📅', n: 'Iron Habit',   tier: 'long', tip: 'Active on 14 days',           check: (c) => c.activeDays >= 14 },
  { e: '👑', n: 'Quest Legend', tier: 'long', tip: 'Finish 40 quests',           check: (c) => c.totalVerified >= 40 },
]
