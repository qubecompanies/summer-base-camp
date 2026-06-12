import React, { useState } from 'react'
import { fmtMins } from '../lib/format'

// Parent-only economy controls:
//  1) Screen-time generosity — a multiplier on minutes earned per activity, so
//     a parent decides how hard screen time is to earn (points are unaffected,
//     so the reward ladder pace stays predictable).
//  2) Reward forecast — given kids × assumed points/day, estimate how long to
//     reach each reward milestone and the team goal.
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const addDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${DOW[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`
}
const human = (days) => {
  if (!isFinite(days) || days <= 0) return '—'
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`
  const w = days / 7
  return `${w < 2 ? '~1.5' : Math.round(w)} week${Math.round(w) === 1 ? '' : 's'}`
}

export default function RewardSheet({
  screenRate = 1, onSaveRate, kids = [], teamPoints = 0, teamGoal = 6000,
  milestones = [], recentPerKid = 0, onClose,
}) {
  const [rate, setRate] = useState(screenRate)
  const [perKid, setPerKid] = useState(Math.max(10, Math.round(recentPerKid) || 40))
  const kidCount = Math.max(1, kids.length)
  const combined = kidCount * perKid

  const rows = [...milestones.map((m) => ({ pts: m.pts, label: m.label })), { pts: teamGoal, label: '🏁 Team goal', goal: true }]
    .filter((r, i, arr) => arr.findIndex((x) => x.pts === r.pts) === i)
    .sort((a, b) => a.pts - b.pts)

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card rewardsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 26 }}>📊</div>
        <h2>Rewards &amp; screen time</h2>

        {/* --- Screen-time generosity --- */}
        <div className="rsec">
          <div className="rsh">📺 Screen-time generosity</div>
          <p className="rsub">How many minutes each activity is worth. Points (and reward pace) don’t change — this only tunes screen time.</p>
          <input type="range" min={0.25} max={3} step={0.05} value={rate}
                 onChange={(e) => setRate(Number(e.target.value))} className="rslider" />
          <div className="rraterow">
            <span className={`rrate${rate < 1 ? ' lo' : rate > 1 ? ' hi' : ''}`}>{rate.toFixed(2)}×</span>
            <span className="rhint">
              {rate < 1 ? 'Stricter — less screen time' : rate > 1 ? 'More generous' : 'Standard (default)'}
            </span>
          </div>
          <div className="rexample">
            A <b>45-min read</b> banks <b>{fmtMins(Math.round(45 * rate))}</b> ·
            a <b>30-min chore</b> banks <b>{fmtMins(Math.round(30 * rate))}</b>
          </div>
          <button className="rsave" onClick={() => onSaveRate(rate)}>Save screen-time rate</button>
        </div>

        {/* --- Reward forecast --- */}
        <div className="rsec">
          <div className="rsh">🎯 Reward forecast</div>
          <p className="rsub">
            With <b>{kidCount}</b> kid{kidCount === 1 ? '' : 's'} earning about <b>{perKid}</b> pts/day each,
            that’s <b>{combined}</b> team pts/day.
          </p>
          <input type="range" min={10} max={150} step={5} value={perKid}
                 onChange={(e) => setPerKid(Number(e.target.value))} className="rslider" />
          <div className="rraterow">
            <span className="rrate">{perKid} pts/day each</span>
            {recentPerKid > 0 && <span className="rhint">recent pace ≈ {Math.round(recentPerKid)}</span>}
          </div>

          <div className="rforecast">
            {rows.map((r) => {
              const reached = teamPoints >= r.pts
              const remaining = Math.max(0, r.pts - teamPoints)
              const days = Math.ceil(remaining / combined)
              return (
                <div className={`rfrow${r.goal ? ' goal' : ''}${reached ? ' done' : ''}`} key={r.pts}>
                  <div className="rfi">
                    <b>{r.label}</b>
                    <small>{r.pts} pts{reached ? '' : ` · ${remaining} to go`}</small>
                  </div>
                  <div className="rfeta">
                    {reached ? <span className="rfdone">✓ reached</span>
                      : <><b>{human(days)}</b><small>≈ {addDays(days)}</small></>}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="rsub small">Estimate only — actual pace depends on how much the kids log each day.</p>
        </div>

        <button className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }} onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
