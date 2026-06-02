import React, { useRef } from 'react'

const isVerified = (s) => s === 'proof' || s === 'approved'

// A one-off custom activity (kid- or parent-created). Value lives inline on
// the entry's `custom` field; lifecycle mirrors a normal quest.
const fmt = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`

export default function CustomCard({ playerId, id, data, onProof, onRemove }) {
  const status = data?.status || 'open'
  const { title, min, pts, locked } = data?.custom || {}
  const proofUrl = data?.proofUrl
  const note = data?.note
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) onProof(playerId, id, f)
    e.target.value = ''
  }

  return (
    <div className={`quest custom ${status}`}>
      <div className="qcheck">{isVerified(status) ? '✓' : status === 'claimed' ? '…' : ''}</div>

      <div className="qtop">
        <div className="qmark" style={{ background: 'var(--purple)' }}>✎</div>
        <div>
          <div className="qtitle">{title}</div>
          <div className="qcat">{locked ? 'Parent adjustment' : 'Custom · your own quest'}</div>
        </div>
      </div>

      <div className="qrewards">
        <span className="rw min">{fmt(min)} min screen</span>
        <span className="rw pt">{fmt(pts)} pts</span>
      </div>

      {proofUrl && (
        <div className="proofthumb"><img src={proofUrl} alt="proof" /><span>photo attached ✓</span></div>
      )}

      {note && <div className={`qnote${status === 'approved' ? ' ok' : ''}`}>💬 {note}</div>}

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
