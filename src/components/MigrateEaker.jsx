import React, { useState } from 'react'

// Admin-only: one-click migration of the existing single-family data onto the
// signed-in (real) login. Keeps all history; just adds the multi-tenant fields.
export default function MigrateEaker({ user, onMigrate, onSignOut }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const go = async () => {
    setBusy(true); setErr('')
    try { await onMigrate(user.uid) }
    catch (e) { setErr(e?.code || e?.message || 'Migration failed.'); setBusy(false) }
  }

  return (
    <div className="signin">
      <div className="sicard" style={{ textAlign: 'center' }}>
        <div className="badge-sun" style={{ margin: '0 auto' }}>☀</div>
        <h1 style={{ fontFamily: 'Bricolage Grotesque', fontSize: 20, margin: '10px 0 4px' }}>Migrate your family</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 14px' }}>
          This claims your existing <b>Summer Base Camp</b> data for <b>{user.email}</b> and switches it to
          the new multi-family system. <b>Nothing is lost</b> — your points, streaks, history, and photos
          stay; it just adds your kids + sports as editable settings.
        </p>
        {err && <div className="simsg err" style={{ marginBottom: 12 }}>⚠ {err}</div>}
        <button className="sibtn" disabled={busy} onClick={go}>
          {busy ? 'Migrating…' : '✦ Migrate & keep my history'}
        </button>
        <button className="sibtn ghost" onClick={() => onSignOut()}>Sign out</button>
      </div>
    </div>
  )
}
