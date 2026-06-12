import React from 'react'
import { useAuth } from './hooks/useAuth'
import { useFamily } from './hooks/useFamily'
import SignIn from './components/SignIn'

// Multi-tenant shell (behind the MULTI_TENANT flag — OFF in production).
//
// STEP A scope: prove the real-auth layer end to end — Google + email/password
// sign-in, then resolve which family the account belongs to. The actual quest
// board, onboarding (create-family), and isolation rules land in Steps B & C.
// Until then a signed-in user sees a small status panel, not the board.
export default function MultiTenantApp() {
  const auth = useAuth()
  const { user, ready, signOut } = auth
  const family = useFamily(user || null)

  if (!ready) return <div className="loading">Loading…</div>
  if (!user) return <SignIn auth={auth} />

  const who = user.displayName || user.email || 'your account'

  return (
    <div className="mtshell">
      <div className="mtcard">
        <div className="badge-sun">☀</div>
        <h2>Signed in</h2>
        <p className="mtwho">{who}</p>

        {family.status === 'loading' && <p className="mtstatus">Checking your family…</p>}
        {family.status === 'none' && (
          <p className="mtstatus">
            ✦ No family yet on this account.<br />
            <small>Create-a-family onboarding lands in the next step (B).</small>
          </p>
        )}
        {family.status === 'ready' && (
          <p className="mtstatus ok">
            🏡 Family ready: <b>{family.family?.name || family.familyId}</b><br />
            <small>The full board wires up in Step B.</small>
          </p>
        )}
        {family.error && <p className="mtstatus err">⚠ {family.error.code || 'Could not load family.'}</p>}

        <button className="sibtn ghost" onClick={() => signOut()}>Sign out</button>
        <p className="sifoot">Step A preview · multi-tenant build in progress</p>
      </div>
    </div>
  )
}
