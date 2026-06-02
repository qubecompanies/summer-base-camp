import React, { useState } from 'react'
import { PROFILES } from '../config/profiles'

// Parent-only: change the 4-digit PIN for any profile. New values are written
// to the Firestore family doc and override the env defaults. These are LIGHT
// family gates, not real security — they still ship in the client bundle.
export default function PinSheet({ pins, onSave, onClose }) {
  const [drafts, setDrafts] = useState({})
  const [saved, setSaved] = useState(null)

  const setDigit = (id, raw) => {
    const v = raw.replace(/\D/g, '').slice(0, 4)
    setDrafts((d) => ({ ...d, [id]: v }))
    setSaved(null)
  }

  const save = (id) => {
    const v = drafts[id]
    if (!v || v.length !== 4) return
    onSave(id, v)
    setSaved(id)
    setDrafts((d) => ({ ...d, [id]: '' }))
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card pinsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 28 }}>🔑</div>
        <h2>Change PINs</h2>
        <p>Set a new 4-digit PIN for any profile. Leave a row blank to keep it.</p>

        <div className="pinlist">
          {PROFILES.map((p) => (
            <div className="pinprow" key={p.id}>
              <div className="ppinfo">
                <span className="ppav">{p.avatar}</span>
                <span>
                  <b>{p.name}</b>
                  <small>current ends in ·{String(pins?.[p.id] ?? p.pin).slice(-2)}</small>
                </span>
              </div>
              <div className="ppset">
                <input
                  className="ppin" inputMode="numeric" maxLength={4} placeholder="new"
                  value={drafts[p.id] || ''} onChange={(e) => setDigit(p.id, e.target.value)}
                />
                <button
                  className="ppsave" disabled={(drafts[p.id] || '').length !== 4}
                  onClick={() => save(p.id)}
                >
                  {saved === p.id ? '✓' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
