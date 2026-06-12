import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, FIREBASE_READY } from '../firebase'

// Resolve which family a signed-in user belongs to, then keep it live.
//   status: 'loading'  -> still resolving (or no user yet)
//           'none'     -> signed in but not in a family (show onboarding)
//           'ready'    -> familyId + family doc available
// Pass the current Firebase user (or null). Safe to call with null.
export function useFamily(user) {
  const [status, setStatus] = useState('loading')
  const [familyId, setFamilyId] = useState(null)
  const [family, setFamily] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!FIREBASE_READY) { setStatus('none'); return }
    if (!user) { setStatus('loading'); setFamilyId(null); setFamily(null); return }

    let cancelled = false
    let unsubFamily = () => {}
    setStatus('loading'); setError(null)

    getDoc(doc(db, 'accounts', user.uid))
      .then((snap) => {
        if (cancelled) return
        const fid = snap.exists() ? snap.data().familyId : null
        if (!fid) { setStatus('none'); setFamilyId(null); setFamily(null); return }
        setFamilyId(fid)
        unsubFamily = onSnapshot(
          doc(db, 'families', fid),
          (fs) => { if (!cancelled) { setFamily(fs.data() || null); setStatus('ready') } },
          (e) => { if (!cancelled) { setError(e); setStatus('ready') } },
        )
      })
      .catch((e) => { if (!cancelled) { setError(e); setStatus('none') } })

    return () => { cancelled = true; unsubFamily() }
  }, [user])

  // Create a brand-new family owned by this user and link the account to it.
  // Called by the onboarding flow (Step B). Returns the new familyId.
  const createFamily = useCallback(async (uid, { name, kids = [], teamGoal, pins } = {}) => {
    if (!uid) throw new Error('createFamily: missing uid')
    const fid = `fam_${uid.slice(0, 6)}_${Date.now().toString(36)}`
    const familyDoc = {
      name: (name || 'My Family').trim(),
      ownerUid: uid,
      members: { [uid]: 'owner' },
      kids,
      createdAt: serverTimestamp(),
    }
    if (typeof teamGoal === 'number') familyDoc.teamGoal = teamGoal
    if (pins && typeof pins === 'object') familyDoc.pins = pins
    await setDoc(doc(db, 'families', fid), familyDoc)
    await setDoc(doc(db, 'accounts', uid), { familyId: fid, updatedAt: serverTimestamp() }, { merge: true })
    return fid
  }, [])

  return { status, familyId, family, error, createFamily }
}
