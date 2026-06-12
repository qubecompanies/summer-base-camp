import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { PLAYERS } from '../config/quests'
import { SPORTS } from '../config/sports'
import { DEFAULT_PINS } from '../config/profiles'

// One-time migration: claim the existing single-family `eaker` tree for a real
// login and seed the multi-tenant data model fields (kids, sports, pins) WITHOUT
// touching the existing teamPoints / teamGoal / milestones / history / avatars
// (merge:true preserves them). Run by the admin from the in-app migrate screen.
export async function migrateEaker(uid) {
  if (!uid) throw new Error('migrateEaker: missing uid')
  const kids = PLAYERS.map((p, i) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    color: i === 0 ? 'var(--blue)' : 'var(--coral)',
    ...(p.age ? { age: p.age } : {}),
  }))
  const sports = SPORTS.map((s) => ({ ...s }))
  await setDoc(doc(db, 'families', 'eaker'), {
    name: 'The Eaker Family',
    ownerUid: uid,
    members: { [uid]: 'owner' },
    kids,
    sports,
    pins: DEFAULT_PINS,
    migratedAt: serverTimestamp(),
  }, { merge: true })
  await setDoc(doc(db, 'accounts', uid), { familyId: 'eaker', updatedAt: serverTimestamp() }, { merge: true })
}
