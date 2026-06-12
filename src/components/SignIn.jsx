import React, { useState } from 'react'
import { authMessage } from '../hooks/useAuth'
import LegalSheet from './LegalSheet'

// Family sign-in screen: Google + email/password, with create-account and
// password-reset modes. Deuteranopia-safe palette (blue / amber / teal) with
// icons + shapes so nothing relies on color. One family login per household.
export default function SignIn({ auth }) {
  const { busy, error, setError, google, emailSignIn, emailCreate, resetPassword } = auth
  const [mode, setMode] = useState('signin') // 'signin' | 'create' | 'reset'
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [notice, setNotice] = useState('')
  const [showLegal, setShowLegal] = useState(false)

  const switchMode = (m) => { setMode(m); setError?.(null); setNotice('') }

  const submit = async (e) => {
    e.preventDefault()
    setNotice('')
    try {
      if (mode === 'reset') {
        await resetPassword(email)
        setNotice('📧 Check your email for a password-reset link.')
        return
      }
      if (mode === 'create') await emailCreate(email, pass)
      else await emailSignIn(email, pass)
      // On success, onAuthStateChanged drives the app forward — nothing to do here.
    } catch (_) { /* error surfaced via auth.error */ }
  }

  return (
    <div className="signin">
      <div className="sicard">
        <div className="sibrand">
          <div className="badge-sun">☀</div>
          <div>
            <h1>Summer Base Camp</h1>
            <p>Sign in to your family</p>
          </div>
        </div>

        <button className="gbtn" type="button" disabled={busy} onClick={() => google()}>
          <span className="gmark" aria-hidden="true">G</span>
          Continue with Google
        </button>

        <div className="sidiv"><span>or</span></div>

        <form onSubmit={submit} className="siform">
          <label className="sifield">
            <span>✉️ Email</span>
            <input type="email" autoComplete="email" required value={email}
                   onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          {mode !== 'reset' && (
            <label className="sifield">
              <span>🔒 Password</span>
              <input type="password" required minLength={6}
                     autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                     value={pass} onChange={(e) => setPass(e.target.value)}
                     placeholder={mode === 'create' ? 'At least 6 characters' : 'Your password'} />
            </label>
          )}

          {error && <div className="simsg err">⚠ {authMessage(error)}</div>}
          {notice && <div className="simsg ok">{notice}</div>}

          <button className="sibtn" type="submit" disabled={busy}>
            {busy ? 'Working…'
              : mode === 'create' ? '✦ Create family account'
              : mode === 'reset' ? '↻ Send reset link'
              : '→ Sign in'}
          </button>
        </form>

        <div className="silinks">
          {mode === 'signin' && (
            <>
              <button type="button" onClick={() => switchMode('create')}>New here? Create a family account</button>
              <button type="button" onClick={() => switchMode('reset')}>Forgot password?</button>
            </>
          )}
          {mode === 'create' && (
            <button type="button" onClick={() => switchMode('signin')}>Already have an account? Sign in</button>
          )}
          {mode === 'reset' && (
            <button type="button" onClick={() => switchMode('signin')}>← Back to sign in</button>
          )}
        </div>

        <p className="sifoot">
          One login per family · everyone shares it, then a PIN picks who’s using it.<br />
          By continuing you agree to our <button type="button" className="legallink" onClick={() => setShowLegal(true)}>Privacy &amp; Terms</button>.
        </p>
      </div>
      {showLegal && <LegalSheet onClose={() => setShowLegal(false)} />}
    </div>
  )
}
