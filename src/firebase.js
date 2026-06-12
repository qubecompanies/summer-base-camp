import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
// Google sign-in provider (multi-tenant auth). Always force the account chooser
// so a shared family device can pick the right account each time.
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const FAMILY_ID = import.meta.env.VITE_FAMILY_ID || 'eaker'
export const PARENT_PIN = import.meta.env.VITE_PARENT_PIN || '1234'

// True only when a real config is present; lets the app run in a local
// demo mode (no writes) if you haven't dropped in your keys yet.
export const FIREBASE_READY = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

// Multi-tenant rollout flag. OFF by default (and in production) so the live
// single-family app is unchanged; set VITE_MULTI_TENANT=true locally to build
// and test the new real-auth + create-family flow. Retire this flag after the
// Phase 1 (A/B/C) migration is complete and anonymous auth is disabled.
export const MULTI_TENANT = import.meta.env.VITE_MULTI_TENANT === 'true'
