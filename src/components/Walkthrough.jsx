import React, { useState } from 'react'

// Replayable guided tour for parents. A simple, robust slide carousel (no
// fragile element-anchoring) so it works from any view. Open it on demand from
// Parent → Manage → App walkthrough; it also auto-opens once per device.
const STEPS = [
  { icon: '☀️', title: 'Welcome to Summer Base Camp', body: 'A friendly way to trade real-life effort for screen time. Kids do quests, earn screen minutes, and pool points toward a big family reward. Here’s the 60-second tour.' },
  { icon: '🎯', title: 'Claim → Prove → Earn', body: 'Each kid picks a quest, does it, then proves it. Proof can be a photo, a quick description of what they did, or your sign-off. Once proven, it counts.' },
  { icon: '📺', title: 'The screen-time bank', body: 'Proven activities add screen minutes to that kid’s bank. When they use screen time, you log it from the Parent check-in — the bank counts down. Minutes are separate from points.' },
  { icon: '⭐', title: 'Points build the team goal', body: 'Every proven activity also earns points that ALL kids pool toward shared reward milestones (a movie, mini golf, the big trip). It’s teamwork, not a competition.' },
  { icon: '👀', title: 'Parent check-in', body: 'Tap “Parent” (your PIN) to review. “Needs your sign-off” shows anything waiting; photo/description submissions already count and sit under “Already counted” for an optional look.' },
  { icon: '🎽', title: 'Sports & practice', body: 'In Manage → Sports & practice, add the sports your kids actually do — from the catalog or your own. Set minutes, points, and drills. Each session has an effort tier (Light/Medium/Hard) that scales the reward.' },
  { icon: '📊', title: 'Tune the difficulty', body: 'In Manage → Rewards & screen time you can make screen time easier or harder to earn with one slider, and forecast how long the reward will take based on how much your kids earn per day.' },
  { icon: '🛠️', title: 'Make it yours', body: 'Manage lets you edit the quest board, set PINs, assign activities, give bonuses, and edit the reward ladder. Tweak anything to fit your family.' },
  { icon: '🔁', title: 'You’re set!', body: 'Replay this walkthrough anytime from Parent → Manage → App walkthrough. Have a great summer!' },
]

export default function Walkthrough({ onClose }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card walkthrough" onClick={(e) => e.stopPropagation()}>
        <button className="wtskip" onClick={onClose}>Skip ✕</button>
        <div className="wticon">{step.icon}</div>
        <h2>{step.title}</h2>
        <p className="wtbody">{step.body}</p>

        <div className="wtdots">
          {STEPS.map((_, n) => (
            <button key={n} className={`wtdot${n === i ? ' on' : ''}`} onClick={() => setI(n)} aria-label={`step ${n + 1}`} />
          ))}
        </div>

        <div className="wtnav">
          <button className="wtback" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>← Back</button>
          {last
            ? <button className="wtnext" onClick={onClose}>Done 🎉</button>
            : <button className="wtnext" onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}>Next →</button>}
        </div>
      </div>
    </div>
  )
}
