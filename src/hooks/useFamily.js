import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, FIREBASE_READY, isAdmin } from '../firebase'
import { migrateEaker } from '../lib/migrateEaker'

const emailKey = (user) => (user?.email || '').trim().toLowerCase()

// Resolve which family a signed-in user belongs to, then keep it live.
//   status: 'loading'   -> still resolving (or no user yet)
//           'none'      -> signed in + allowed to create a family (invited / admin)
//           'noinvite'  -> signed in but not invited (show "ask for an invite")
//           'ready'     -> familyId + family doc available
// Pass the current Firebase user (or null). Safe to call with null.
export function useFamily(user) {
  const [status, setStatus] = useState('loading')
  const [familyId, setFamilyId] = useState(null)
  const [family, setFamily] = useState(null)
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0) // bumped after create/join to re-resolve

  useEffect(() => {
    if (!FIREBASE_READY) { setStatus('none'); return }
    if (!user) { setStatus('loading'); setFamilyId(null); setFamily(null); return }

    let cancelled = false
    let unsubFamily = () => {}
    setStatus('loading'); setError(null)

    const subscribe = (fid) => {
      setFamilyId(fid)
      unsubFamily = onSnapshot(
        doc(db, 'families', fid),
        (fs) => { if (!cancelled) { setFamily(fs.data() || null); setStatus('ready') } },
        (e) => { if (!cancelled) { setError(e); setStatus('ready') } },
      )
    }

    const resolve = async () => {
      // 1) Already linked to a family?
      const acct = await getDoc(doc(db, 'accounts', user.uid))
      if (cancelled) return
      const linkedFid = acct.exists() ? acct.data().familyId : null
      if (linkedFid) { subscribe(linkedFid); return }

      // 2) Not linked — look for an invite for this email.
      let invite = null
      try {
        const inv = await getDoc(doc(db, 'invites', emailKey(user)))
        invite = inv.exists() ? inv.data() : null
      } catch (_) { invite = null }
      if (cancelled) return

      // 2a) Invited to join an existing family as a co-parent → auto-join.
      if (invite && invite.familyId) {
        try {
          await updateDoc(doc(db, 'families', invite.familyId), {
            [`members.${user.uid}`]: 'parent',
            updatedAt: serverTimestamp(),
          })
          await setDoc(doc(db, 'accounts', user.uid), { familyId: invite.familyId, updatedAt: serverTimestamp() }, { merge: true })
          if (cancelled) return
          subscribe(invite.familyId)
          return
        } catch (e) { if (!cancelled) { setError(e) } }
      }

      // 2b) Admin with the legacy family still unclaimed → offer migration.
      if (isAdmin(user)) {
        try {
          const eaker = await getDoc(doc(db, 'families', 'eaker'))
          if (!cancelled && eaker.exists() && !eaker.data().ownerUid) {
            setStatus('migrate'); setFamilyId(null); setFamily(null); return
          }
        } catch (_) { /* fall through to create */ }
        if (cancelled) return
      }

      // 2c) Invited (no family) or admin → may create a family.
      if (invite || isAdmin(user)) { setStatus('none'); setFamilyId(null); setFamily(null); return }

      // 3) Not invited at all.
      setStatus('noinvite'); setFamilyId(null); setFamily(null)
    }

    resolve().catch((e) => { if (!cancelled) { setError(e); setStatus('noinvite') } })

    return () => { cancelled = true; unsubFamily() }
  }, [user, refresh])

  // Create a brand-new family owned by this user and link the account to it.
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
    setRefresh((n) => n + 1)
    return fid
  }, [])

  const retry = useCallback(() => setRefresh((n) => n + 1), [])

  // One-time: claim + seed the legacy Eaker family for this (admin) login.
  const migrate = useCallback(async (uid) => {
    await migrateEaker(uid)
    setRefresh((n) => n + 1)
  }, [])

  return { status, familyId, family, error, createFamily, migrate, retry }
}
