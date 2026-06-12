import React, { useState, useEffect } from 'react'
import { addInvite, removeInvite, listInvites, validEmail } from '../lib/invites'

// Super-admin only: approve new families by adding their email. Gated in the UI
// by isAdmin() and in firestore.rules by the admin email. Co-parent invites are
// separate (done by a parent inside their family).
export default function InviteAdmin({ onClose }) {
  const [invites, setInvites] = useState(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    try { setInvites(await listInvites()) }
    catch (e) { setErr(e?.code || 'Could not load invites.') }
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    const e = email.trim().toLowerCase()
    if (!validEmail(e)) { setErr('Enter a valid email.'); return }
    setBusy(true); setErr('')
    try { await addInvite(e); setEmail(''); await load() }
    catch (x) { setErr(x?.code || 'Could not add.') }
    finally { setBusy(false) }
  }
  const remove = async (e) => {
    setBusy(true); setErr('')
    try { await removeInvite(e); await load() }
    catch (x) { setErr(x?.code || 'Could not remove.') }
    finally { setBusy(false) }
  }

  const newFamilyInvites = (invites || []).filter((i) => !i.familyId)
  const coParentInvites = (invites || []).filter((i) => i.familyId)

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card sportsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 26 }}>🛡️</div>
        <h2>Manage invites</h2>
        <p>Add a parent’s email to let them create a new family. Invite-only — only emails here (or co-parent invites) can get in.</p>

        <div className="spscustom" style={{ marginTop: 4 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" inputMode="email" />
          <button className="qbtn proof submit" disabled={busy || !email.trim()} onClick={add}>＋ Invite</button>
        </div>
        {err && <div className="simsg err" style={{ marginTop: 8 }}>⚠ {err}</div>}

        <div className="ialist">
          <div className="spslab" style={{ marginTop: 12 }}>Invited families ({newFamilyInvites.length})</div>
          {invites === null && <div className="spsempty">Loading…</div>}
          {invites && newFamilyInvites.length === 0 && <div className="spsempty">No new-family invites yet.</div>}
          {newFamilyInvites.map((i) => (
            <div className="iarow" key={i.id}>
              <span>{i.id}</span>
              <button className="cfx" onClick={() => remove(i.id)} aria-label="remove">✕</button>
            </div>
          ))}

          {coParentInvites.length > 0 && (
            <>
              <div className="spslab" style={{ marginTop: 12 }}>Pending co-parent invites ({coParentInvites.length})</div>
              {coParentInvites.map((i) => (
                <div className="iarow" key={i.id}>
                  <span>{i.id} <small style={{ color: 'var(--ink-soft)' }}>· joining a family</small></span>
                  <button className="cfx" onClick={() => remove(i.id)} aria-label="remove">✕</button>
                </div>
              ))}
            </>
          )}
        </div>

        <button className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)', marginTop: 12 }} onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
