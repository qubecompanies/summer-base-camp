import React, { useState } from 'react'
import { getProfiles, profileById, effectivePins } from '../config/profiles'

// First-launch "whose device is this?" picker + PIN confirm. Binds the device
// to one profile so the app opens straight to the right person next time.
// `pins` is the live (Firestore-or-default) map so an in-app PIN change sticks.
export default function ProfileSetup({ onBind, pins }) {
  const [picked, setPicked] = useState(null)
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)
  const livePins = effectivePins(pins)
  const prof = profileById(picked, pins)
  const profiles = getProfiles(pins)

  const onPin = (raw) => {
    const v = raw.replace(/\D/g, '').slice(0, 4)
    setDigits(v)
    setError(false)
    if (v.length === 4) {
      if (v === String(livePins[picked])) onBind(picked)
      else { setError(true); setDigits('') }
    }
  }

  if (!picked) {
    return (
      <div className="center-screen">
        <div className="card setup">
          <div className="badge-sun" style={{ margin: '0 auto' }}>☀</div>
          <h2>Whose device is this?</h2>
          <p>Pick a profile to set up this device. You can switch later.</p>
          <div className="profilepicks">
            {profiles.map((p) => (
              <button key={p.id} className={`profilepick ${p.id}`} onClick={() => setPicked(p.id)}>
                <span className="ppav">{p.avatar}</span>
                <span className="ppname">{p.name}</span>
                <span className="pprole">{p.role === 'parent' ? 'sign-off + setup' : 'claim · prove · earn'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="center-screen">
      <div className="card setup">
        <div className="badge-sun" style={{ margin: '0 auto' }}>{prof.avatar}</div>
        <h2>{prof.name}'s PIN</h2>
        <p>Enter the 4-digit PIN to claim this device as {prof.name}'s.</p>
        <input
          className="pininput" inputMode="numeric" autoFocus value={digits}
          onChange={(e) => onPin(e.target.value)}
          style={error ? { borderColor: 'var(--coral)' } : undefined}
        />
        {error && <p style={{ color: 'var(--coral)', marginTop: -8 }}>Wrong PIN — try again.</p>}
        <button
          className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }}
          onClick={() => { setPicked(null); setDigits(''); setError(false) }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
