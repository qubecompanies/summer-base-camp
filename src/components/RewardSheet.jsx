import React, { useState } from 'react'
import { fmtMins } from '../lib/format'

// Parent-only economy controls:
//  1) Screen-time generosity — a multiplier on minutes earned per activity, so
//     a parent decides how hard screen time is to earn (points are unaffected,
//     so the reward ladder pace stays predictable).
//  2) Reward planner — answers the intuitive question: "if I want my kids to
//     reach the reward in N weeks, how many activities a day does each need to
//     do?" No history assumed; the parent tunes kids, weeks, and reward size.
const COMFORT = 3 // a sustainable ~activities/day per kid, used as a reference

// Difficulty read for a required activities/day figure, across a 0–10 scale.
// Icon + word so it reads without relying on color (deuteranopia-safe).
const SCALE_MAX = 10
function difficulty(a) {
  if (a <= 1.5) return { icon: '✓', word: 'Easygoing', cls: 'd1' }
  if (a <= 3) return { icon: '◐', word: 'Very doable', cls: 'd2' }
  if (a <= 4.5) return { icon: '▲', word: 'Busy', cls: 'd3' }
  if (a <= 6) return { icon: '▲', word: 'Ambitious', cls: 'd4' }
  if (a <= 8) return { icon: '⚠', word: 'Very demanding', cls: 'd5' }
  return { icon: '⛔', word: 'Unrealistic', cls: 'd6' }
}

export default function RewardSheet({
  screenRate = 1, onSaveRate, kids = [], teamGoal = 6000,
  milestones = [], avgActivityPts = 15, onClose,
}) {
  const [rate, setRate] = useState(screenRate)
  const [children, setChildren] = useState(Math.max(1, kids.length || 1))
  const [weeks, setWeeks] = useState(8)
  const [goalRaw, setGoal] = useState(teamGoal)

  const p = Math.max(1, Math.round(avgActivityPts)) // avg points per activity
  const days = weeks * 7
  // Cap the reward-goal slider at whatever yields the top of the scale
  // (SCALE_MAX activities/day) for the current kids & weeks — so the slider can
  // always reach 10/day. Clamp the stored goal into that range.
  const goalMax = Math.max(2000, Math.ceil((SCALE_MAX * p * children * days) / 500) * 500)
  const goal = Math.min(goalRaw, goalMax)
  const ptsPerDayPerKid = days > 0 && children > 0 ? goal / (children * days) : 0
  const actsPerDayPerKid = ptsPerDayPerKid / p
  const dailyTeam = children * ptsPerDayPerKid
  const diff = difficulty(actsPerDayPerKid)

  // At a relaxed/comfortable pace, how many weeks would this reward take?
  const weeksAtComfort = Math.ceil(goal / (children * COMFORT * p * 7)) || 0
  // What reward size would be a comfortable pace in the chosen weeks?
  const comfyGoal = Math.round((children * COMFORT * p * days) / 100) * 100

  const goalLabel = milestones.find((m) => m.pts === goal)?.label

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card rewardsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 26 }}>📊</div>
        <h2>Rewards &amp; screen time</h2>

        {/* --- Screen-time generosity --- */}
        <div className="rsec">
          <div className="rsh">📺 Screen-time generosity</div>
          <p className="rsub">How many minutes each activity is worth. Points (and the reward plan below) don’t change — this only tunes screen time.</p>
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

        {/* --- Reward planner --- */}
        <div className="rsec">
          <div className="rsh">🎯 Reward planner</div>
          <p className="rsub">Pick how many kids, how soon you want the reward, and how big it is. We’ll show how many activities a day each kid needs.</p>

          <div className="rfield">
            <span className="rflab">👧 Children</span>
            <div className="rstep">
              <button onClick={() => setChildren((c) => Math.max(1, c - 1))}>−</button>
              <b>{children}</b>
              <button onClick={() => setChildren((c) => Math.min(8, c + 1))}>＋</button>
            </div>
          </div>

          <div className="rfield col">
            <span className="rflab">📅 Reach it in <b>{weeks}</b> week{weeks === 1 ? '' : 's'}</span>
            <input type="range" min={1} max={16} step={1} value={weeks}
                   onChange={(e) => setWeeks(Number(e.target.value))} className="rslider" />
          </div>

          <div className="rfield col">
            <span className="rflab">🎁 Reward goal · <b>{goal}</b> pts{goalLabel ? ` · ${goalLabel}` : ''}</span>
            <input type="range" min={500} max={goalMax} step={100} value={goal}
                   onChange={(e) => setGoal(Number(e.target.value))} className="rslider" />
          </div>

          {/* The headline answer */}
          <div className={`rplan ${diff.cls}`}>
            <div className="rplanbig">
              <span className="rplannum">{actsPerDayPerKid >= SCALE_MAX ? `${SCALE_MAX}+` : actsPerDayPerKid.toFixed(1)}</span>
              <span className="rplanunit">activities<br />per day, each</span>
            </div>
            <div className="rplanside">
              <div className={`rbadge ${diff.cls}`}>{diff.icon} {diff.word}</div>
              <div className="rplanmeta">≈ {Math.round(ptsPerDayPerKid)} pts/day each · {Math.round(dailyTeam)} team pts/day</div>
            </div>
          </div>

          {/* 0–10 activities/day scale */}
          <div className="rscale">
            <div className="rscaletrack">
              <span className="rscalefill" style={{ width: `${Math.min(actsPerDayPerKid, SCALE_MAX) / SCALE_MAX * 100}%` }} />
              <span className="rscalemark" style={{ left: `${Math.min(actsPerDayPerKid, SCALE_MAX) / SCALE_MAX * 100}%` }} />
            </div>
            <div className="rscalelabels"><span>0</span><span>easy</span><span>5</span><span>a lot</span><span>10/day</span></div>
          </div>

          <p className="rplansentence">
            To earn <b>{goal} pts</b>{goalLabel ? ` (${goalLabel})` : ''} in <b>{weeks} week{weeks === 1 ? '' : 's'}</b>,
            each of your <b>{children}</b> kid{children === 1 ? '' : 's'} needs to finish about
            {' '}<b>{actsPerDayPerKid.toFixed(1)} activities a day</b>.
          </p>

          {/* Guidance */}
          <div className="rtips">
            <div className="rtip">🧭 At a relaxed <b>~{COMFORT} activities/day</b> each, this reward takes about <b>{weeksAtComfort} week{weeksAtComfort === 1 ? '' : 's'}</b>.</div>
            {actsPerDayPerKid > 6 && (
              <div className="rtip warn">⚠ That’s a lot to keep up. To make it easier: give it more weeks, or set the goal nearer <b>{comfyGoal} pts</b> for this timeframe.</div>
            )}
            {actsPerDayPerKid < 1 && (
              <div className="rtip">💡 Plenty of room — you could shorten the timeframe or raise the goal to <b>{comfyGoal} pts</b> and it’d still be comfortable.</div>
            )}
          </div>

          <p className="rsub small">Assumes about <b>{p} pts per activity</b> (your board’s average) and activities on most days. It’s a planning estimate, not a promise.</p>
        </div>

        <button className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }} onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
