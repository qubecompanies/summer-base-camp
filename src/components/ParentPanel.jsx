import React, { useState, useRef } from 'react'
import { PLAYERS, ALL_QUESTS, resolveQuest } from '../config/quests'
import { SPORTS, itemValue, tierById, isCustom } from '../config/sports'
import Avatar from './Avatar'

export default function ParentPanel({
  state, stats, derived, avatars = {}, teamPoints = 0, milestones = [], redeemed = [],
  onSignOff, onRevert, onReset, onLogScreen, onSetAvatar, onRedeem,
  onOpenAssign, onOpenLadder, onOpenPins, onOpenAward, onOpenQuests,
}) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [notes, setNotes] = useState({})
  const fileRefs = useRef({})
  const pickPhoto = (pid) => fileRefs.current[pid]?.click()
  const onFile = (pid, e) => { const f = e.target.files?.[0]; if (f) onSetAvatar?.(pid, f); e.target.value = '' }
  const pending = []
  PLAYERS.forEach((p) => {
    ALL_QUESTS.forEach((q0) => {
      const qs = state[p.id]?.quests?.[q0.id]
      if (qs?.status === 'claimed') {
        const q = resolveQuest(q0, p.id)
        pending.push({ player: p, id: q0.id, title: q.title, cat: q.cat, min: q.min, pts: q.pts, proofUrl: qs.proofUrl })
      }
    })
    SPORTS.filter((s) => s.owners.includes(p.id)).forEach((s) => {
      const qs = state[p.id]?.quests?.[s.id]
      if (qs?.status === 'claimed') {
        const v = itemValue(s.id, qs)
        const cat = `Sport · ${tierById(qs.tier)?.label || 'Medium'}${qs.meet ? ' · 🏁 meet' : ''}${qs.drill ? ` · ${qs.drill}` : ''}`
        pending.push({ player: p, id: s.id, title: s.name, cat, min: v.min, pts: v.pts, proofUrl: qs.proofUrl })
      }
    })
    // Custom kid-created activities awaiting sign-off.
    Object.entries(state[p.id]?.quests || {}).forEach(([id, qs]) => {
      if (isCustom(qs) && qs.status === 'claimed') {
        const v = itemValue(id, qs)
        pending.push({ player: p, id, title: qs.custom.title, cat: 'Custom', min: v.min, pts: v.pts, proofUrl: qs.proofUrl })
      }
    })
  })

  const weekTotal = (p) => Object.values(derived?.[p.id]?.weekPoints || {}).reduce((a, b) => a + b, 0)
  const badgeCount = (p) => (derived?.[p.id]?.badges || []).filter((b) => b.got).length

  return (
    <div className="parentpanel">
      <h3>👀 Parent check-in</h3>
      <div className="psub">
        Boys claim their own quests. Minutes + points only count once there's <b>photo proof</b> or your <b>sign-off</b>.
      </div>

      {PLAYERS.map((p) => {
        const s = stats[p.id]
        const grad = p.id === 'everett'
          ? 'linear-gradient(145deg,var(--blue),var(--purple))'
          : 'linear-gradient(145deg,var(--coral),var(--amber))'
        return (
          <div className="prow" key={p.id}>
            <div className="pinfo">
              <button className="pavbtn" onClick={() => pickPhoto(p.id)} title="Set photo">
                <Avatar className="pav" url={avatars[p.id]} emoji={p.avatar} grad={grad} />
                <span className="pavedit">📷</span>
              </button>
              <input ref={(el) => { fileRefs.current[p.id] = el }} type="file" accept="image/*"
                     style={{ display: 'none' }} onChange={(e) => onFile(p.id, e)} />
              <b style={{ fontFamily: 'Bricolage Grotesque' }}>{p.name}</b>
            </div>
            <div className="pbars">
              <div>📺 <b>{s.bank}</b>m left</div>
              <div>⭐ <b>{s.pts}</b></div>
              <div>🔥 <b>{derived?.[p.id]?.streak ?? 0}</b></div>
              <div>📅 <b>{weekTotal(p)}</b>/wk</div>
              <div>🏅 <b>{badgeCount(p)}</b></div>
            </div>
          </div>
        )
      })}

      {/* Screen-time logger: spend down each boy's earned bank. */}
      <div className="screenlog">
        <div className="sh">📺 Log screen time used</div>
        {PLAYERS.map((p) => {
          const s = stats[p.id]
          return (
            <div className="slrow" key={p.id}>
              <div className="slname">{p.avatar} {p.name}
                <small>{s.bank}m left · {s.spent}m used of {s.min}m earned</small>
              </div>
              <div className="slbtns">
                {[15, 30, 60].map((m) => (
                  <button key={m} className="slbtn" onClick={() => onLogScreen(p.id, m)}>+{m}</button>
                ))}
                <button className="slbtn undo" onClick={() => onLogScreen(p.id, -15)}>↩15</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="signoff">
        <div className="sh">⏳ Waiting on your sign-off</div>
        {pending.length === 0 && <div className="nopend">Nothing waiting — all caught up.</div>}
        {pending.map(({ player, id, title, cat, min, pts, proofUrl }) => {
          const k = player.id + id
          const note = notes[k] || ''
          const clearNote = () => setNotes((n) => ({ ...n, [k]: '' }))
          return (
            <div className="approw" key={k}>
              <div className="ai">
                {title}
                <small>{player.name} · {cat} · +{min}m +{pts}pts</small>
                {proofUrl && (
                  <div className="proofview"><img src={proofUrl} alt="proof" /><span style={{ fontSize: 10, color: 'var(--teal)' }}>photo attached</span></div>
                )}
                <input
                  className="notein"
                  placeholder="Add a note (optional) — e.g. great job! / redo, add detail"
                  value={note}
                  onChange={(e) => setNotes((n) => ({ ...n, [k]: e.target.value }))}
                />
              </div>
              <div className="acts">
                <button className="ok" onClick={() => { onSignOff(player.id, id, note.trim()); clearNote() }}>✓ Sign off</button>
                <button className="no" onClick={() => { onRevert(player.id, id, note.trim()); clearNote() }}>↩ Back</button>
              </div>
            </div>
          )
        })}
      </div>

      {milestones.some((m) => teamPoints >= m.pts) && (
        <div className="redeembox">
          <div className="sh">🎁 Rewards unlocked</div>
          {milestones.filter((m) => teamPoints >= m.pts).map((m) => {
            const done = redeemed.includes(m.pts)
            return (
              <div className={`redrow${done ? ' done' : ''}`} key={m.pts}>
                <div className="ri">
                  {m.label}
                  <small>{m.pts} pts · {done ? 'cashed in' : 'ready to redeem'}</small>
                </div>
                <button className={done ? 'no' : 'ok'} onClick={() => onRedeem?.(m.pts)}>
                  {done ? '↩ Undo' : '🎁 Redeem'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="parenttools">
        <button className="ptool" onClick={onOpenAssign}>✎ Assign an activity</button>
        <button className="ptool" onClick={onOpenQuests}>✏️ Edit quest board</button>
        <button className="ptool" onClick={onOpenLadder}>🏁 Edit reward ladder</button>
        <button className="ptool" onClick={onOpenAward}>🎁 Bonus / docking</button>
        <button className="ptool" onClick={onOpenPins}>🔑 Change PINs</button>
      </div>

      {confirmReset ? (
        <div className="resetconfirm">
          <span>Wipe today's progress for both boys?</span>
          <div className="rcacts">
            <button className="rcyes" onClick={() => { onReset(); setConfirmReset(false) }}>Yes, reset</button>
            <button className="rcno" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="resetbtn" onClick={() => setConfirmReset(true)}>↺ Reset today (start fresh)</button>
      )}
    </div>
  )
}
