import React, { useState, useRef } from 'react'
import { DEFAULT_PINS } from '../config/profiles'

export default function PinModal({ onClose, onSuccess, parentPin = DEFAULT_PINS.parent }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const refs = [useRef(), useRef(), useRef(), useRef()]

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return
    const next = [...digits]
    next[i] = v
    setDigits(next)
    setError(false)
    if (v && i < 3) refs[i + 1].current?.focus()
    if (next.every((d) => d !== '')) {
      if (next.join('') === String(parentPin)) onSuccess()
      else { setError(true); setDigits(['', '', '', '']); refs[0].current?.focus() }
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 30 }}>🔒</div>
        <h2>Parent mode</h2>
        <p>Enter your 4-digit PIN to approve quests.</p>
        <div className="pinrow">
          {digits.map((d, i) => (
            <input
              key={i} ref={refs[i]} value={d} inputMode="numeric" maxLength={1}
              onChange={(e) => setDigit(i, e.target.value)}
              style={error ? { borderColor: 'var(--coral)' } : undefined}
              autoFocus={i === 0}
            />
          ))}
        </div>
        {error && <p style={{ color: 'var(--coral)', marginTop: -6 }}>Wrong PIN — try again.</p>}
        <button className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
