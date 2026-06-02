import React, { useState } from 'react'
import { TIERS, sportById } from '../config/sports'

// The 🎯 drills sheet: pick effort tier + an optional drill (and a meet flag
// for swim), then log the practice.
export default function DrillSheet({ sportId, playerId, onLog, onClose }) {
  const sport = sportById(sportId)
  const [tier, setTier] = useState('medium')
  const [drill, setDrill] = useState('')
  const [meet, setMeet] = useState(false)
  if (!sport) return null

  const log = () => {
    onLog(playerId, sport.id, { tier: meet ? 'hard' : tier, drill, meet })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <div className="qmark" style={{ background: sport.color }}>{sport.glyph}</div>
          <div>
            <h3>{sport.name}</h3>
            <span>🎯 pick effort + a drill, then log it</span>
          </div>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <div className="fieldlab">Effort</div>
        <div className="tierseg">
          {TIERS.map((t) => (
            <button
              key={t.id} disabled={meet}
              className={tier === t.id && !meet ? 'on' : ''}
              onClick={() => setTier(t.id)}
            >
              {t.label}<small>{t.mult}×</small>
            </button>
          ))}
        </div>

        {sport.meetFlag && (
          <label className="meettoggle">
            <input type="checkbox" checked={meet} onChange={(e) => setMeet(e.target.checked)} />
            🏁 This was a meet — counts as Hard (2×)
          </label>
        )}

        <div className="fieldlab">Drill <span className="opt">(optional)</span></div>
        <div className="drillchips">
          {sport.drills.map((dr) => (
            <span
              key={dr} className={`chip${drill === dr ? ' on' : ''}`}
              onClick={() => setDrill(drill === dr ? '' : dr)}
            >
              {dr}
            </span>
          ))}
        </div>

        <button className="bigbtn" onClick={log}>Log practice →</button>
      </div>
    </div>
  )
}
