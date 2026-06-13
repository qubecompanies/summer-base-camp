import { useState, useEffect, useCallback } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth, googleProvider, FIREBASE_READY } from '../firebase'

// Friendly messages for the Firebase auth error codes a family will actually hit.
const MESSAGES = {
  'auth/invalid-email': 'That email doesn’t look right.',
  'auth/missing-password': 'Please enter a password.',
  'auth/weak-password': 'Use at least 6 characters for the password.',
  'auth/email-already-in-use': 'That email already has an account — try signing in instead.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account with that email — create one below.',
  'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
  'auth/network-request-failed': 'Network problem — check your connection and try again.',
  'auth/popup-blocked': 'The sign-in popup was blocked — we’ll try a full-page redirect.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/operation-not-allowed': 'This sign-in method isn’t enabled yet.',
}
export const authMessage = (e) =>
  (e && (MESSAGES[e.code] || e.message)) || 'Something went wrong. Please try again.'

// Auth state + sign-in methods for the multi-tenant flow. Does not touch the
// legacy anonymous path — only used when MULTI_TENANT is on.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!FIREBASE_READY) // "have we learned the auth state yet?"
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!FIREBASE_READY) { setReady(true); return }
    // Surface the result/error of a redirect-based Google sign-in on return.
    getRedirectResult(auth).catch((e) => setError(e))
    return onAuthStateChanged(auth, (u) => { setUser(u); setReady(true) })
  }, [])

  const run = useCallback(async (fn) => {
    setBusy(true); setError(null)
    try { return await fn() }
    catch (e) { setError(e); throw e }
    finally { setBusy(false) }
  }, [])

  const google = useCallback(() => run(async () => {
    // Popup first — it returns the result via postMessage to the same page, so
    // it survives mobile browser storage isolation (unlike redirect, which can
    // loop back to login). Fall back to redirect only when a popup can't open.
    try {
      return await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const code = e?.code || ''
      if (code === 'auth/popup-blocked'
        || code === 'auth/operation-not-supported-in-this-environment'
        || code === 'auth/web-storage-unsupported') {
        return signInWithRedirect(auth, googleProvider)
      }
      throw e // popup-closed-by-user / cancelled → surface, don't loop
    }
  }), [run])

  const emailSignIn = useCallback(
    (email, pass) => run(() => signInWithEmailAndPassword(auth, (email || '').trim(), pass)), [run])
  const emailCreate = useCallback(
    (email, pass) => run(() => createUserWithEmailAndPassword(auth, (email || '').trim(), pass)), [run])
  const resetPassword = useCallback(
    (email) => run(() => sendPasswordResetEmail(auth, (email || '').trim())), [run])
  const signOut = useCallback(() => run(() => fbSignOut(auth)), [run])

  return { user, ready, busy, error, setError, google, emailSignIn, emailCreate, resetPassword, signOut }
}
