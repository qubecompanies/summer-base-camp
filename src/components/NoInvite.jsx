import React from 'react'

// Shown when a signed-in user has no family and no invite. Invite-only gate.
export default function NoInvite({ email, onSignOut }) {
  return (
    <div className="signin">
      <div className="sicard" style={{ textAlign: 'center' }}>
        <div className="badge-sun" style={{ margin: '0 auto' }}>☀</div>
        <h1 style={{ fontFamily: 'Bricolage Grotesque', fontSize: 20, margin: '10px 0 4px' }}>You’re almost in</h1>
        <p className="sifoot" style={{ margin: '0 0 14px' }}>
          Summer Base Camp is invite-only right now. Ask the person who told you about it to add
          {' '}<b>{email || 'your email'}</b>, then refresh and sign in again.
        </p>
        <button className="sibtn ghost" onClick={() => onSignOut()}>Sign out</button>
      </div>
    </div>
  )
}
