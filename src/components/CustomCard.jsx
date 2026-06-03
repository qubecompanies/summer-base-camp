import React, { useRef, useState } from 'react'
import { fmtMins } from '../lib/format'

const isVerified = (s) => s === 'proof' || s === 'approved'

// A one-off custom activity (kid- or parent-created). Value lives inline on
// the entry's `custom` field; lifecycle mirrors a normal quest.
const fmt = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`
const fmtMinSigned = (n) => `${n >= 0 ? '+' : ''}${fmtMins(n)}`

export default function CustomCard({ playerId, id, data, onProof, onDesc, onRemove }) {
  const status = data?.status || 'open'
  const { title, min, pts, locked, cat, glyph } = data?.custom || {}
  const proofUrl = data?.proofUrl
  const savedDesc = data?.desc
  const note = data?.note
  const fileRef = useRef(null)
  const [desc, setDesc] = useState(savedDesc || '')
  const catLabel = locked ? 'Parent adjustment' : (cat ? `${cat} · quick log` : 'Custom · your own quest')

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) onProof(playerId, id, f, desc)
    e.target.value = ''
  }

  return (
    <div className={`quest custom ${status}`}>
      <div className="qcheck">{isVerified(status) ? '✓' : status === 'claimed' ? '…' : ''}</div>

      <div className="qtop">
        <div className="qmark" style={{ background: cat ? 'var(--teal)' : 'var(--purple)' }}>{glyph || '✎'}</div>
        <div>
          <div className="qtitle">{title}</div>
          <div className="qcat">{catLabel}</div>
        </div>
      </div>

      <div className="qrewards">
        <span className="rw min">{fmtMinSigned(min)} screen</span>
        <span className="rw pt">{fmt(pts)} pts</span>
      </div>

      {proofUrl && (
        <div className="proofthumb"><img src={proofUrl} alt="proof" /><span>photo attached ✓</span></div>
      )}

      {savedDesc && status !== 'claimed' && <div className="qdesc">📝 “{savedDesc}”</div>}

      {note && <div className={`qnote${status === 'approved' ? ' ok' : ''}`}>💬 {note}</div>}

      {status === 'claimed' && (
        <div className="proofpanel">
          <textarea className="descin" rows={2} value={desc}
                    placeholder="Tell us what you did (counts as proof)…"
                    onChange={(e) => setDesc(e.target.value)} />
          <button className="qbtn proof submit" disabled={!desc.trim()}
                  onClick={() => onDesc(playerId, id, desc)}>✓ Submit description</button>
        </div>
      )}

      <div className="qfoot">
        {status === 'claimed' && (
          <>
            <span className="statustag wait">⏳ awaiting sign-off</span>
            <button className="qbtn proof" onClick={() => fileRef.current?.click()}>📎 Add photo proof</button>
          </>
        )}
        {status === 'proof' && <span className="statustag ok">📎 proof added</span>}
        {status === 'approved' && !locked && <span className="statustag ok">✓ signed off</span>}
        {locked && <span className="statustag ok">🔒 set by parent</span>}
        {!locked && <button className="qbtn" onClick={() => onRemove(playerId, id)}>🗑 remove</button>}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
               style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </div>
  )
}
