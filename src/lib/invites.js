import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// Invites collection: doc id = the invited email (lowercased).
//   { email, familyId? , role? }
//   - no familyId  -> allowed to CREATE a new family (admin-issued)
//   - with familyId-> auto-joins that family as a co-parent on sign-in
const key = (email) => (email || '').trim().toLowerCase()
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim())

// Admin: invite a new family (no familyId).
export const addInvite = (email) =>
  setDoc(doc(db, 'invites', key(email)), { email: key(email), createdAt: serverTimestamp() }, { merge: true })

// Parent: invite a co-parent to a specific family.
export const addCoParentInvite = (email, familyId) =>
  setDoc(doc(db, 'invites', key(email)), { email: key(email), familyId, role: 'parent', createdAt: serverTimestamp() })

export const removeInvite = (email) => deleteDoc(doc(db, 'invites', key(email)))

// Admin only (rules gate the list to admins).
export const listInvites = async () => {
  const snap = await getDocs(collection(db, 'invites'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
