import React from 'react'
import { PLAYERS } from '../config/quests'
import Avatar from './Avatar'

const weekTotal = (wp) => Object.values(wp || {}).reduce((a, b) => a + b, 0)
const badgeCount = (badges) => (badges || []).filter((b) => b.got).length

// Positive-framed "brothers" view. NOT a leaderboard — the framing is teamwork
// (combined total toward the goal) plus a callout of each boy's own strength.
// No "loser": both get an encouraging line, and ties are celebrated.
export default function BrothersView({ stats, derived, avatars = {} }) {
  const rows = PLAYERS.map((p) => ({
    p,
    week: weekTotal(derived?.[p.id]?.weekPoints),
    streak: derived?.[p.id]?.streak ?? 0,
    badges: badgeCount(derived?.[p.id]?.badges),
    pts: stats?.[p.id]?.pts ?? 0,
  }))
  const combined = rows.reduce((a, r) => a + r.week, 0)
  const [a, b] = rows

  // A gentle, always-positive headline.
  const headline = () => {
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
        <h2>Brothers</h2><span className="cnt">teammates, not rivals</span><span className="ln" />
      </div>

      <div className="bvcombined">
        <div className="bvc-num">{combined}</div>
        <div className="bvc-lab">points the two of you earned together this week 🏕</div>
      </div>

      <div className="bvheads">
        {rows.map((r) => {
          const grad = r.p.id === 'everett'
            ? 'linear-gradient(145deg,var(--blue),var(--purple))'
            : 'linear-gradient(145deg,var(--coral),var(--amber))'
          return (
            <div className="bvhead" key={r.p.id}>
              <Avatar className="pav" emoji={r.p.avatar} grad={grad} url={avatars[r.p.id]} />
              <b>{r.p.name}</b>
              <small>{r.week} pts this week</small>
            </div>
          )
        })}
      </div>

      <div className="bvmetrics">
        {metric('This week', '📅', 'week')}
        {metric('Streak', '🔥', 'streak', 'd')}
        {metric('Badges', '🏅', 'badges')}
        {metric('All-time today', '⭐', 'pts')}
      </div>

      <div className="bvhead-note">{headline()}</div>
      <div className="weeknote">
        Every point either brother earns goes into the <b>same team pot</b>. Beat your own best,
        cheer each other on — the reward unlocks for <b>both</b> of you.
      </div>
    </div>
  )
}
