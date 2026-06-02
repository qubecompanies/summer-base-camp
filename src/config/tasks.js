// Quick-log library. Each entry is a one-tap canned activity that logs as its
// own custom entry (claimed → parent sign-off), so a boy can rack up several in
// a single day — e.g. empty the dishwasher AND take out the trash AND mow.
//
// Values are intentionally small/granular since many can be logged per day.
// Minutes = screen-time earned, pts = team points. Glyphs read without color
// (deuteranopia-safe — never rely on color alone).

export const CHORE_LIBRARY = [
  { id: 'dishes_empty', title: 'Empty the dishwasher', glyph: '🍽', min: 10, pts: 6 },
  { id: 'dishes_load', title: 'Load the dishwasher', glyph: '🧼', min: 10, pts: 6 },
  { id: 'trash_curb', title: 'Take trash bin to the curb', glyph: '🗑', min: 10, pts: 6 },
  { id: 'trash_in', title: 'Bring bins back in', glyph: '♻️', min: 8, pts: 5 },
  { id: 'trash_empty', title: 'Empty the trash cans', glyph: '🚮', min: 8, pts: 5 },
  { id: 'laundry_fold', title: 'Fold & put away laundry', glyph: '🧺', min: 20, pts: 12 },
  { id: 'laundry_start', title: 'Start a load of laundry', glyph: '🌀', min: 8, pts: 5 },
  { id: 'vacuum', title: 'Vacuum a room', glyph: '🧹', min: 15, pts: 9 },
  { id: 'sweep', title: 'Sweep / mop the floor', glyph: '🧽', min: 15, pts: 9 },
  { id: 'bathroom', title: 'Wipe down the bathroom', glyph: '🚿', min: 20, pts: 12 },
  { id: 'mow', title: 'Mow the lawn', glyph: '🌱', min: 35, pts: 22 },
  { id: 'yard', title: 'Yard work (weeds / leaves)', glyph: '🍂', min: 30, pts: 18 },
  { id: 'pet', title: 'Feed / walk the pet', glyph: '🐾', min: 10, pts: 6 },
  { id: 'table_set', title: 'Set or clear the table', glyph: '🍴', min: 8, pts: 5 },
  { id: 'groceries', title: 'Help bring in groceries', glyph: '🛒', min: 10, pts: 6 },
  { id: 'car', title: 'Help wash the car', glyph: '🚗', min: 25, pts: 15 },
]

export const QUICK_WINS = [
  { id: 'bed', title: 'Make your bed', glyph: '🛏', min: 5, pts: 3 },
  { id: 'pushups', title: '10 push-ups', glyph: '💪', min: 5, pts: 4 },
  { id: 'water', title: 'Drink a glass of water', glyph: '💧', min: 5, pts: 3 },
  { id: 'thankyou', title: 'Write a thank-you note', glyph: '✉️', min: 10, pts: 8 },
  { id: 'stretch', title: '5-minute stretch', glyph: '🤸', min: 5, pts: 3 },
  { id: 'tidy5', title: '5-minute room tidy', glyph: '🧸', min: 5, pts: 4 },
  { id: 'compliment', title: 'Give someone a compliment', glyph: '🌟', min: 5, pts: 4 },
  { id: 'plan', title: 'Plan your day / make a list', glyph: '📝', min: 8, pts: 5 },
  { id: 'verse', title: 'Memorize a verse', glyph: '✦', min: 10, pts: 8 },
  { id: 'screencheck', title: 'Put your device away on time', glyph: '⏰', min: 8, pts: 6 },
]
