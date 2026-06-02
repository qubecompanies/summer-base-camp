import React, { useState } from 'react'

// Create a custom activity. Kid mode → a single claim that needs sign-off.
// Parent mode → pick one boy or both; it auto-counts (no sign-off needed).
export default function CustomSheet({ mode = 'kid', players = [], defaultPlayerId, onAdd, onClose }) {
  const isParent = mode === 'parent'
  const [title, setTitle] = useState('')
  const [min, setMin] = useState(20)
  const [pts, setPts] = useState(10)
  const [target, setTarget] = useState(defaultPlayerId || (players[0]?.id ?? 'both'))

  const submit = () => {
    if (!title.trim()) return
    const targets = isParent
      ? (target === 'both' ? players.map((p) => p.id) : [target])
      : [defaultPlayerId]
    onAdd({ title: title.trim(), min: Number(min) || 0, pts: Number(pts) || 0, targets, byParent: isParent })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <div className="qmark" style={{ background: 'var(--purple)' }}>✎</div>
          <div>
            <h3>{isParent ? 'Assign an activity' : 'Add your own quest'}</h3>
            <span>{isParent ? 'Auto-counts — no sign-off needed' : 'Counts once a parent signs off or you add proof'}</span>
          </div>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <div className="fieldlab">What is it?</div>
        <input className="textin" value={title} placeholder="e.g. Clean the garage with Dad"
               onChange={(e) => setTitle(e.target.value)} autoFocus />

        <div className="tworow">
          <div>
            <div className="fieldlab">Screen min</div>
            <input className="textin" type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div>
            <div className="fieldlab">Points</div>
            <input className="textin" type="number" min="0" value={pts} onChange={(e) => setPts(e.target.value)} />
          </div>
        </div>

        {isParent && (
          <>
            <div className="fieldlab">Who's it for?</div>
            <div className="drillchips">
              {players.map((p) => (
                <span key={p.id} className={`chip${target === p.id ? ' on' : ''}`} onClick={() => setTarget(p.id)}>
                  {p.name}
                </span>
              ))}
              <span className={`chip${target === 'both' ? ' on' : ''}`} onClick={() => setTarget('both')}>Both boys</span>
            </div>
          </>
        )}

        <button className="bigbtn" onClick={submit} disabled={!title.trim()}>
          {isParent ? 'Assign it →' : 'Add quest →'}
        </button>
      </div>
    </div>
  )
}
