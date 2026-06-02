// Badge definitions. Each check(ctx) reads derived helpers from the last ~14
// days of a single boy's history (see lib/analytics.js buildBadges):
//   ctx.verifiedDayCount(questId) -> # of days that quest was verified
//   ctx.totalVerified             -> total verified quests across the window
//   ctx.streak                    -> current weekday streak
//
// THRESHOLDS ARE ILLUSTRATIVE — tune the numbers to taste. verifiedDayCount
// works for sport ids too (bball/jrotc/lift/swim), so Pool Shark and JROTC
// Grind now key off the real sport practices.
export const BADGES = [
  { e: '📖', n: 'Bookworm',    tip: 'Read on 5 days',             check: (c) => c.verifiedDayCount('read') >= 5 },
  { e: '🌅', n: 'Early Riser', tip: 'Morning scripture on 5 days', check: (c) => c.verifiedDayCount('scrip') >= 5 },
  { e: '🏊', n: 'Pool Shark',  tip: 'Swim on 6 days',             check: (c) => c.verifiedDayCount('swim') >= 6 },
  { e: '🎖', n: 'JROTC Grind', tip: 'JROTC practice on 6 days',   check: (c) => c.verifiedDayCount('jrotc') >= 6 },
  { e: '🪣', n: 'Bin Boss',    tip: 'Chores on 5 days',           check: (c) => c.verifiedDayCount('chore') >= 5 },
  { e: '🏆', n: 'No-Zero Week', tip: '5-weekday streak',          check: (c) => c.streak >= 5 },
]
