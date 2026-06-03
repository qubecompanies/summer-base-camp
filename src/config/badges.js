// Badge definitions. Each badge carries:
//   tip  -> human-readable "what it takes" (shown on the card so boys can aim)
//   goal -> the target number
//   prog -> (ctx) => current progress toward goal, from real history
// `got` is derived in lib/analytics.js as prog(ctx) >= goal.
//
// ctx helpers (see lib/analytics.js buildBadges), over the last ~14 days:
//   ctx.verifiedDayCount(questId) -> # of days that quest/sport was verified
//   ctx.totalVerified             -> total verified quests across the window
//   ctx.totalPoints               -> total verified points across the window
//   ctx.activeDays                -> # of distinct days with a verified quest
//   ctx.choreCount                -> # of verified chores (quest + quick-logs)
//   ctx.streak                    -> current weekday streak
//
// `tier` groups badges by horizon so the wall reads short -> medium -> long.
export const BADGES = [
  // ---- short-term: easy first wins ----
  { e: '🌟', n: 'First Win',    tier: 'short', tip: 'Earn your first sign-off',    goal: 1,  prog: (c) => c.totalVerified },
  { e: '🧹', n: 'Chore Starter',tier: 'short', tip: 'Finish 3 chores',             goal: 3,  prog: (c) => c.choreCount },
  { e: '📖', n: 'Bookworm',     tier: 'short', tip: 'Read on 5 days',              goal: 5,  prog: (c) => c.verifiedDayCount('read') },
  { e: '🌅', n: 'Early Riser',  tier: 'short', tip: 'Scripture on 5 days',         goal: 5,  prog: (c) => c.verifiedDayCount('scrip') },
  { e: '💧', n: 'Hydrated',     tier: 'short', tip: 'Hydrate on 4 days',           goal: 4,  prog: (c) => c.verifiedDayCount('water') },

  // ---- medium-term: a couple weeks of consistency ----
  { e: '🪣', n: 'Bin Boss',     tier: 'medium', tip: 'Daily chore on 5 days',      goal: 5,  prog: (c) => c.verifiedDayCount('chore') },
  { e: '🧽', n: 'Chore Champ',  tier: 'medium', tip: 'Finish 10 chores',           goal: 10, prog: (c) => c.choreCount },
  { e: '🏊', n: 'Pool Shark',   tier: 'medium', tip: 'Swim on 6 days',             goal: 6,  prog: (c) => c.verifiedDayCount('swim') },
  { e: '🎖', n: 'JROTC Grind',  tier: 'medium', tip: 'JROTC practice on 6 days',   goal: 6,  prog: (c) => c.verifiedDayCount('jrotc') },
  { e: '💛', n: 'Kind Heart',   tier: 'medium', tip: 'Kindness on 5 days',         goal: 5,  prog: (c) => c.verifiedDayCount('kind') },
  { e: '🎵', n: 'Music Maker',  tier: 'medium', tip: 'Music practice on 5 days',   goal: 5,  prog: (c) => c.verifiedDayCount('music') },
  { e: '🏡', n: 'Family First', tier: 'medium', tip: 'Family time on 5 days',      goal: 5,  prog: (c) => c.verifiedDayCount('family') },
  { e: '🏆', n: 'No-Zero Week', tier: 'medium', tip: '5-weekday streak',           goal: 5,  prog: (c) => c.streak },

  // ---- long-term: the big season goals ----
  { e: '🔥', n: 'On Fire',      tier: 'long', tip: '10-weekday streak',            goal: 10, prog: (c) => c.streak },
  { e: '💯', n: 'Centurion',    tier: 'long', tip: 'Earn 100 points',             goal: 100, prog: (c) => c.totalPoints },
  { e: '🚀', n: 'Point Rocket', tier: 'long', tip: 'Earn 250 points',            goal: 250, prog: (c) => c.totalPoints },
  { e: '📅', n: 'Iron Habit',   tier: 'long', tip: 'Active on 14 days',           goal: 14, prog: (c) => c.activeDays },
  { e: '👑', n: 'Quest Legend', tier: 'long', tip: 'Finish 40 quests',            goal: 40, prog: (c) => c.totalVerified },
]
