import React, { useState } from 'react'
import { validEmail } from '../lib/invites'

// A parent invites another parent to this family. They sign in with that email
// (Google or email/password) and are auto-joined as a co-parent.
export default function CoParentSheet({ onInvite, onClose }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const invite = async () => {
    const e = email.trim().toLowerCase()
    if (!validEmail(e)) { setErr('Enter a valid email.'); return }
    setBusy(true); setErr('')
    try { await onInvite(e); setDone(true) }
    catch (x) { setErr(x?.code || 'Could not send the invite.') }
    finally { setBusy(false) }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 28 }}>👪</div>
        <h2>Invite a co-parent</h2>
        {done ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              Invited <b>{email.trim().toLowerCase()}</b>. When they sign in with that email, they’ll
              join this family automatically.
            </p>
            <button className="bigbtn" style={{ background: 'var(--blue)', color: '#fff' }} onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              Enter the other parent’s email. They sign in with it (Google or a password) and share this
              family — same kids, same board.
            </p>
            <input className="cfname" style={{ width: '100%', margin: '4px 0 10px' }} inputMode="email"
                   value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coparent@example.com" />
            {err && <div className="simsg err" style={{ marginBottom: 10 }}>⚠ {err}</div>}
            <button className="bigbtn" style={{ background: 'var(--blue)', color: '#fff' }} disabled={busy || !email.trim()} onClick={invite}>
              {busy ? 'Inviting…' : '✉️ Send invite'}
            </button>
            <button className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }} onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}
