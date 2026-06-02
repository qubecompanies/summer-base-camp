import React, { useState } from 'react'

// Parent-only manual adjustment: hand out a bonus or dock minutes/points for
// something outside the quest board (great attitude, a missed expectation,
// etc.). Values may be negative (docking). Auto-counts — it's a parent action.
export default function AwardSheet({ players = [], defaultPlayerId, onAward, onClose }) {
  const [target, setTarget] = useState(defaultPlayerId || players[0]?.id || 'both')
  const [sign, setSign] = useState(1) // +1 bonus, -1 docking
  const [title, setTitle] = useState('')
  const [min, setMin] = useState(15)
  const [pts, setPts] = useState(5)

  const bonus = sign > 0
  const submit = () => {
    const m = sign * (Math.abs(Number(min)) || 0)
    const p = sign * (Math.abs(Number(pts)) || 0)
    if (!m && !p) return
    const label = title.trim() || (bonus ? 'Parent bonus' : 'Parent adjustment')
    const targets = target === 'both' ? players.map((x) => x.id) : [target]
    onAward({ title: `${bonus ? '🎁' : '⚠'} ${label}`, min: m, pts: p, targets })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <div className="qmark" style={{ background: bonus ? 'var(--teal)' : 'var(--coral)' }}>{bonus ? '🎁' : '⚠'}</div>
          <div>
            <h3>Bonus or docking</h3>
            <span>Manual adjustment — counts right away</span>
          </div>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <div className="fieldlab">Type</div>
        <div className="drillchips">
          <span className={`chip${bonus ? ' on' : ''}`} onClick={() => setSign(1)}>🎁 Bonus (add)</span>
          <span className={`chip${!bonus ? ' on' : ''}`} onClick={() => setSign(-1)}>⚠ Docking (subtract)</span>
        </div>

        <div className="fieldlab">Reason (optional)</div>
        <input className="textin" value={title}
               placeholder={bonus ? 'e.g. Helped a neighbor unasked' : 'e.g. Screen overage'}
               onChange={(e) => setTitle(e.target.value)} autoFocus />

        <div className="tworow">
          <div>
            <div className="fieldlab">Screen min ({bonus ? '+' : '−'})</div>
            <input className="textin" type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div>
            <div className="fieldlab">Points ({bonus ? '+' : '−'})</div>
            <input className="textin" type="number" min="0" value={pts} onChange={(e) => setPts(e.target.value)} />
          </div>
        </div>

        <div className="fieldlab">Who's it for?</div>
        <div className="drillchips">
          {players.map((p) => (
            <span key={p.id} className={`chip${target === p.id ? ' on' : ''}`} onClick={() => setTarget(p.id)}>
              {p.name}
            </span>
          ))}
          <span className={`chip${target === 'both' ? ' on' : ''}`} onClick={() => setTarget('both')}>Both boys</span>
        </div>

        <button className="bigbtn" onClick={submit}
                style={!bonus ? { background: 'var(--coral)' } : undefined}>
          {bonus ? 'Give bonus →' : 'Dock it →'}
        </button>
      </div>
    </div>
  )
}
