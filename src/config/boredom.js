// "I'm bored" generator pool — quick, screen-free things to do right now.
// Shared ideas everyone gets, plus a per-player splash of their own flavor.
// Each idea is small on purpose: the point is to break the boredom spiral,
// not to be a full quest. Doing one can be turned into a custom claim.

const SHARED = [
  'Build the tallest thing you can in 10 minutes',
  'Go outside and find 5 different bugs or birds',
  'Invent a new game and teach it to your brother',
  'Draw the view out a window',
  'Do 25 pushups + 25 situps, then rest',
  'Make a snack from scratch',
  'Write a one-page story about anything',
  'Learn to fold a paper airplane that actually flies',
  'Reorganize one shelf or drawer',
  'Call or message a grandparent just to say hi',
  'Set a 15-minute timer and clean your room fast',
  'Shoot 50 free throws / kick a ball at a target',
  'Memorize a scripture or a quote',
  'Build an obstacle course in the yard',
  'Help make dinner tonight',
]

const BY_PLAYER = {
  everett: [
    'Run through a JROTC drill sequence',
    'Sketch out one step of the business plan',
    'Do a full warmup + mobility routine',
    'Practice an instrument for 15 minutes',
    'Cook a real meal start to finish',
  ],
  parker: [
    'Swim drills in the pool or dry-land kicks',
    'Build a Lego machine that moves',
    'Practice dribbling with both hands',
    'Draw a comic strip with 4 panels',
    'Set up a lemonade or car-wash plan',
  ],
}

export function boredomPool(playerId) {
  return [...SHARED, ...(BY_PLAYER[playerId] || [])]
}

export function rollBoredom(playerId, avoid) {
  const pool = boredomPool(playerId).filter((x) => x !== avoid)
  return pool[Math.floor(Math.random() * pool.length)]
}
