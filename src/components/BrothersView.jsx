import React from 'react'
import { getPlayers } from '../config/quests'
import { hasActiveFamily } from '../config/activeFamily'
import Avatar from './Avatar'

const GRADS = [
  'linear-gradient(145deg,var(--blue),var(--purple))',
  'linear-gradient(145deg,var(--coral),var(--amber))',
  'linear-gradient(145deg,var(--teal),var(--blue))',
  'linear-gradient(145deg,var(--purple),var(--coral))',
  'linear-gradient(145deg,var(--amber),var(--teal))',
  'linear-gradient(145deg,var(--blue),var(--coral))',
]

const weekTotal = (wp) => Object.values(wp || {}).reduce((a, b) => a + b, 0)
const badgeCount = (badges) => (badges || []).filter((b) => b.got).length

// Positive-framed "brothers" view. NOT a leaderboard — the framing is teamwork
// (combined total toward the goal) plus a callout of each boy's own strength.
// No "loser": both get an encouraging line, and ties are celebrated.
export default function BrothersView({ stats, derived, avatars = {} }) {
  const players = getPlayers()
  const team = hasActiveFamily() // multi-tenant family → generic "team" wording
  const rows = players.map((p) => ({
    p,
    week: weekTotal(derived?.[p.id]?.weekPoints),
    streak: derived?.[p.id]?.streak ?? 0,
    badges: badgeCount(derived?.[p.id]?.badges),
    pts: stats?.[p.id]?.pts ?? 0,
  }))
  const combined = rows.reduce((a, r) => a + r.week, 0)
  const pair = rows.length === 2 // pairwise "vs" view only makes sense for two
  const [a, b] = rows

  // A gentle, always-positive headline (two-kid families get the rivalry-free
  // version; larger/solo families get a teamwork line).
  const headline = () => {
    if (!pair) return 'Every point each of you earns goes into the same team pot. Cheer each other on! 🤝'
    if (a.week === b.week) return `Dead even this week — ${a.week} pts each. Tag team! 🤝`
    const lead = a.week > b.week ? a : b
    const other = lead === a ? b : a
    return `${lead.p.name} is leading the charge this week — and every point ${other.p.name} adds pushes the team goal closer. 🚀`
  }

  const metric = (label, glyph, key, suffix = '') => {
    const av = a[key], bv = b[key]
    return (
      <div className="bvmetric">
        <div className="bvm-lab">{glyph} {label}</div>
        <div className="bvm-vals">
          <span className={`bvm-v${av >= bv ? ' hi' : ''}`}>{av}{suffix}</span>
          <span className="bvm-vs">vs</span>
          <span className={`bvm-v${bv >= av ? ' hi' : ''}`}>{bv}{suffix}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="brothers">
      <div className="shead">
        <h2>{team ? 'Teammates' : 'Brothers'}</h2><span className="cnt">teammates, not rivals</span><span className="ln" />
      </div>

      <div className="bvcombined">
        <div className="bvc-num">{combined}</div>
        <div className="bvc-lab">points {team ? 'earned together' : 'the two of you earned together'} this week 🏕</div>
      </div>

      <div className="bvheads">
        {rows.map((r, i) => (
          <div className="bvhead" key={r.p.id}>
            <Avatar className="pav" emoji={r.p.avatar} grad={GRADS[i % GRADS.length]} url={avatars[r.p.id]} />
            <b>{r.p.name}</b>
            <small>{r.week} pts this week</small>
          </div>
        ))}
      </div>

      {pair ? (
        <div className="bvmetrics">
          {metric('This week', '📅', 'week')}
          {metric('Streak', '🔥', 'streak', 'd')}
          {metric('Badges', '🏅', 'badges')}
          {metric('All-time today', '⭐', 'pts')}
        </div>
      ) : (
        <div className="bvmetrics">
          {rows.map((r) => (
            <div className="bvmetric" key={r.p.id}>
              <div className="bvm-lab">{r.p.avatar} {r.p.name}</div>
              <div className="bvm-vals">
                <span className="bvm-v">📅 {r.week}</span>
                <span className="bvm-v">🔥 {r.streak}d</span>
                <span className="bvm-v">🏅 {r.badges}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bvhead-note">{headline()}</div>
      <div className="weeknote">
        Every point {team ? 'anyone' : 'either brother'} earns goes into the <b>same team pot</b>. Beat your own best,
        cheer each other on — the reward unlocks for <b>{team ? 'everyone' : 'both'}</b>.
      </div>
    </div>
  )
}
