import React, { useRef } from 'react'
import { tierById, itemValue } from '../config/sports'
import { fmtMins } from '../lib/format'

const isVerified = (s) => s === 'proof' || s === 'approved'

export default function SportCard({ sport, playerId, data, onOpenDrills, onProof, onRevert }) {
  const status = data?.status || 'open'
  const { tier, drill, meet, note } = data || {}
  const val = itemValue(sport.id, data || {})
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) onProof(playerId, sport.id, f)
    e.target.value = ''
  }

  return (
    <div className={`quest sport ${status}`}>
      <div className="qcheck">{isVerified(status) ? '✓' : status === 'claimed' ? '…' : ''}</div>

      <div className="qtop">
        <div className="qmark" style={{ background: sport.color }}>{sport.glyph}</div>
        <div>
          <div className="qtitle">{sport.name}{meet && <span className="meetchip">🏁 meet</span>}</div>
          <div className="qcat">
            {status === 'open'
              ? `base +${fmtMins(sport.min)} · +${sport.pts} pts`
              : `${tierById(tier)?.label || 'Medium'} · +${fmtMins(val.min)} · +${val.pts} pts`}
          </div>
          {drill && <div className="qpick">drill: {drill}</div>}
        </div>
      </div>

      {note && <div className={`qnote${status === 'approved' ? ' ok' : ''}`}>💬 {note}</div>}

      <div className="qfoot">
        {status === 'open' && (
          <button className="qbtn proof" onClick={() => onOpenDrills(sport.id)}>🎯 Log practice</button>
        )}
        {status === 'claimed' && (
          <>
            <span className="statustag wait">⏳ awaiting sign-off</span>
            <button className="qbtn proof" onClick={() => fileRef.current?.click()}>📎 Add photo proof</button>
            <button className="qbtn" onClick={() => onRevert(playerId, sport.id)}>↩ undo</button>
          </>
        )}
        {status === 'proof' && <span className="statustag ok">📎 proof added</span>}
        {status === 'approved' && <span className="statustag ok">✓ signed off</span>}
        {isVerified(status) && (
          <button className="qbtn" onClick={() => onRevert(playerId, sport.id)}>↩ undo</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
               style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </div>
  )
}
