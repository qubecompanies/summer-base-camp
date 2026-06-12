import React from 'react'
import { useAuth } from './hooks/useAuth'
import { useFamily } from './hooks/useFamily'
import { setActiveFamily } from './config/activeFamily'
import SignIn from './components/SignIn'
import CreateFamily from './components/CreateFamily'
import NoInvite from './components/NoInvite'
import App from './App.jsx'

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

  // Signed in but not invited → invite-only gate.
  if (family.status === 'noinvite') return <NoInvite email={user.email} onSignOut={signOut} />

  // Signed in, invited/admin, but no family yet → onboarding.
  if (family.status === 'none') return <CreateFamily user={user} onCreate={family.createFamily} />

  if (family.status === 'loading') return <div className="loading">Loading your family…</div>

  if (family.error) {
    return (
      <div className="mtshell">
        <div className="mtcard">
          <div className="badge-sun">☀</div>
          <h2>Couldn’t load your family</h2>
          <p className="mtstatus err">⚠ {family.error.code || 'Please try again.'}</p>
          <button className="sibtn ghost" onClick={() => signOut()}>Sign out</button>
        </div>
      </div>
    )
  }

  // Family resolved → publish it to the active-family registry so the existing
  // board (config, hooks, components) renders this family's kids/data, then hand
  // off to the full App. Keyed by familyId so a family switch fully remounts.
  setActiveFamily({
    familyId: family.familyId,
    kids: family.family?.kids || [],
    pins: family.family?.pins || {},
    sports: family.family?.sports || [],
    screenRate: typeof family.family?.screenRate === 'number' ? family.family.screenRate : 1,
  })
  return <App key={family.familyId} onSignOut={signOut} currentUser={user} familyId={family.familyId} />
}
