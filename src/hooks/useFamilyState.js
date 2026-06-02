import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, increment, serverTimestamp, deleteField,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, FAMILY_ID, FIREBASE_READY } from '../firebase'
import { PLAYERS, setQuestOverrides } from '../config/quests'
import { defById, itemValue, isCustom } from '../config/sports'
import { TEAM_GOAL, MILESTONES } from '../config/milestones'
import { DEFAULT_PINS } from '../config/profiles'
import {
  isVerified, dateKey, lastNDates, computeStreak, weekPointsMap, weeklyTotals, buildBadges,
} from '../lib/analytics'

const HISTORY_DAYS = 28

export const todayKey = dateKey

// ---- Demo seed (used only when Firebase keys are absent) ----
function demoSeed() {
  return {
    everett: { quests: { read: { status: 'proof' }, scrip: { status: 'approved' }, chore: { status: 'claimed' } } },
    parker: { quests: { out: { status: 'proof' }, skill: { status: 'claimed' } } },
  }
}

// Synthesize a plausible ~2-week history per player so the demo shows a real
// streak, week chart, and a few earned badges. Keyed by date, excludes today
// (today comes from the live seed above). Only weekdays get filled.
function demoHistory() {
  const out = { everett: {}, parker: {} }
  const dates = lastNDates(HISTORY_DAYS).slice(0, -1) // drop today
  const approved = (entries) => ({
    quests: Object.fromEntries(Object.entries(entries).map(([id, extra]) => [id, { status: 'approved', ...extra }])),
  })
  dates.forEach((key) => {
    const dow = new Date(`${key}T12:00`).getDay()
    const weekday = dow >= 1 && dow <= 5
    if (!weekday) return
    out.everett[key] = approved({ read: {}, scrip: {}, chore: {}, jrotc: { tier: 'hard' }, lift: { tier: 'medium' } })
    out.parker[key] = approved({ read: {}, chore: {}, swim: { tier: 'hard' }, bball: { tier: 'medium' } })
  })
  return out
}

function pointsFor(playerState) {
  let min = 0, pts = 0, done = 0, pend = 0
  const quests = (playerState && playerState.quests) || {}
  for (const [qid, q] of Object.entries(quests)) {
    if (!defById(qid) && !isCustom(q)) continue
    if (isVerified(q.status)) { const v = itemValue(qid, q); min += v.min; pts += v.pts; done += 1 }
    else if (q.status === 'claimed') pend += 1
  }
  const spent = (playerState && playerState.spent) || 0
  // bank = screen minutes earned (verified) minus minutes already logged as used
  return { min, pts, done, pend, spent, bank: Math.max(0, min - spent) }
}

export function useFamilyState() {
  const date = todayKey()
  const [teamPoints, setTeamPoints] = useState(0)
  const [teamGoal, setTeamGoalState] = useState(TEAM_GOAL)
  const [milestones, setMilestonesState] = useState(MILESTONES)
  const [state, setState] = useState({ everett: { quests: {} }, parker: { quests: {} } })
  const [history, setHistory] = useState({ everett: {}, parker: {} })
  const [pins, setPinsState] = useState(DEFAULT_PINS)
  const [avatars, setAvatarsState] = useState({})
  const [redeemed, setRedeemedState] = useState([])
  const [questDefs, setQuestDefsState] = useState({})
  const [loading, setLoading] = useState(FIREBASE_READY)
  const demo = !FIREBASE_READY
  const stateRef = useRef(state)
  stateRef.current = state

  // ---- subscriptions ----
  useEffect(() => {
    if (demo) {
      setQuestOverrides({})
      const seed = demoSeed()
      setState(seed)
      setHistory(demoHistory())
      // demo cumulative base + today's verified
      const base = 590
      const live = pointsFor(seed.everett).pts + pointsFor(seed.parker).pts
      setTeamPoints(base + live)
      return
    }

    const familyRef = doc(db, 'families', FAMILY_ID)
    setDoc(familyRef, { teamGoal: TEAM_GOAL }, { merge: true }).catch(() => {})

    const unsubs = []
    unsubs.push(onSnapshot(familyRef, (snap) => {
      const d = snap.data() || {}
      setTeamPoints(d.teamPoints || 0)
      if (typeof d.teamGoal === 'number') setTeamGoalState(d.teamGoal)
      if (Array.isArray(d.milestones) && d.milestones.length) setMilestonesState(d.milestones)
      // Firestore pins override env defaults (partial maps merge over defaults).
      if (d.pins && typeof d.pins === 'object') setPinsState({ ...DEFAULT_PINS, ...d.pins })
      if (d.avatars && typeof d.avatars === 'object') setAvatarsState(d.avatars)
      if (Array.isArray(d.redeemed)) setRedeemedState(d.redeemed)
      // Push parent quest edits into the shared registry BEFORE state updates so
      // the points engine recomputes against the new values on the next render.
      const defs = d.questDefs && typeof d.questDefs === 'object' ? d.questDefs : {}
      setQuestOverrides(defs)
      setQuestDefsState(defs)
    }))

    PLAYERS.forEach((p) => {
      const sRef = doc(db, 'families', FAMILY_ID, 'state', `${p.id}_${date}`)
      unsubs.push(onSnapshot(sRef, (snap) => {
        const d = snap.data() || { quests: {} }
        setState((prev) => ({ ...prev, [p.id]: { quests: d.quests || {}, spent: d.spent || 0 } }))
        setLoading(false)
      }))
    })

    // Past days don't change, so fetch them once (no live listeners needed).
    let cancelled = false
    const pastDates = lastNDates(HISTORY_DAYS).slice(0, -1)
    PLAYERS.forEach(async (p) => {
      const entries = await Promise.all(pastDates.map(async (key) => {
        const snap = await getDoc(doc(db, 'families', FAMILY_ID, 'state', `${p.id}_${key}`))
        return [key, snap.exists() ? { quests: snap.data().quests || {} } : null]
      }))
      if (cancelled) return
      const map = {}
      entries.forEach(([key, val]) => { if (val) map[key] = val })
      setHistory((prev) => ({ ...prev, [p.id]: map }))
    })

    return () => { cancelled = true; unsubs.forEach((u) => u()) }
  }, [demo, date])

  // ---- write helper: set a quest + adjust cumulative team points by delta ----
  const writeQuest = useCallback(async (playerId, questId, patch) => {
    const prev = stateRef.current[playerId]?.quests?.[questId] || {}
    const next = { ...prev, ...patch }
    const prevStatus = prev.status || 'open'
    const nextStatus = next.status || prevStatus
    // Tier-aware value: sports scale by their chosen effort tier.
    let delta = 0
    if (!isVerified(prevStatus) && isVerified(nextStatus)) delta = itemValue(questId, next).pts
    else if (isVerified(prevStatus) && !isVerified(nextStatus)) delta = -itemValue(questId, prev).pts

    if (demo) {
      setState((prev) => {
        const cur = prev[playerId]?.quests?.[questId] || {}
        return { ...prev, [playerId]: { ...prev[playerId], quests: { ...prev[playerId].quests, [questId]: { ...cur, ...patch } } } }
      })
      if (delta) setTeamPoints((t) => t + delta)
      return
    }

    const sRef = doc(db, 'families', FAMILY_ID, 'state', `${playerId}_${date}`)
    await setDoc(sRef, {
      playerId, date,
      quests: { [questId]: patch },
      updatedAt: serverTimestamp(),
    }, { merge: true })

    if (delta) {
      const familyRef = doc(db, 'families', FAMILY_ID)
      await updateDoc(familyRef, { teamPoints: increment(delta) }).catch(async () => {
        await setDoc(familyRef, { teamPoints: delta, teamGoal: TEAM_GOAL }, { merge: true })
      })
    }
  }, [demo, date])

  // ---- public actions ----
  const claim = useCallback((playerId, questId) => writeQuest(playerId, questId, { status: 'claimed' }), [writeQuest])
  // Optional `note` lets a parent leave a short comment on bounce/sign-off.
  // Defaults to '' so a kid un-claiming their own card clears any stale note.
  const revert = useCallback((playerId, questId, note = '') => writeQuest(playerId, questId, { status: 'open', proofUrl: '', note }), [writeQuest])
  const signOff = useCallback((playerId, questId, note = '') => writeQuest(playerId, questId, { status: 'approved', note }), [writeQuest])
  const setPick = useCallback((playerId, questId, pick) => writeQuest(playerId, questId, { pick }), [writeQuest])
  // Log a sport practice: claim it with effort tier + optional drill/meet flag.
  const logSport = useCallback((playerId, sportId, { tier, drill, meet } = {}) =>
    writeQuest(playerId, sportId, { status: 'claimed', tier: tier || 'medium', drill: drill || '', meet: Boolean(meet) }),
  [writeQuest])

  // One-off custom activity. Kid-created needs sign-off (claimed); a parent
  // creating it for a boy auto-counts (approved). Value rides inline (no def).
  const addCustom = useCallback((playerId, { title, min, pts, byParent, locked, cat, glyph } = {}) => {
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const custom = { title: (title || 'Custom activity').trim(), min: Number(min) || 0, pts: Number(pts) || 0 }
    if (locked) custom.locked = true // parent bonus/docking — kids can't delete it
    if (cat) custom.cat = cat        // e.g. 'Chore' / 'Quick win' for quick-logged tasks
    if (glyph) custom.glyph = glyph  // card icon for the category
    return writeQuest(playerId, id, { status: byParent ? 'approved' : 'claimed', custom })
  }, [writeQuest])

  // Parent logs screen minutes a boy has used; reduces the screen bank.
  // Pass a negative number to undo. Spent never drops below zero.
  const logScreen = useCallback(async (playerId, minutes) => {
    const m = Number(minutes) || 0
    if (!m) return
    const next = Math.max(0, (stateRef.current[playerId]?.spent || 0) + m)
    if (demo) {
      setState((prev) => ({ ...prev, [playerId]: { ...prev[playerId], spent: next } }))
      return
    }
    const sRef = doc(db, 'families', FAMILY_ID, 'state', `${playerId}_${date}`)
    await setDoc(sRef, { playerId, date, spent: next, updatedAt: serverTimestamp() }, { merge: true })
  }, [demo, date])

  // Parent edits the team reward ladder (goal total + milestone tiers).
  const setLadder = useCallback(async ({ teamGoal: g, milestones: ms } = {}) => {
    const patch = {}
    if (typeof g === 'number' && g > 0) patch.teamGoal = g
    if (Array.isArray(ms)) patch.milestones = ms
    if (!Object.keys(patch).length) return
    if (demo) {
      if (patch.teamGoal != null) setTeamGoalState(patch.teamGoal)
      if (patch.milestones) setMilestonesState(patch.milestones)
      return
    }
    await setDoc(doc(db, 'families', FAMILY_ID), patch, { merge: true })
  }, [demo])

  // Parent changes a profile's 4-digit PIN. Stored in the family doc `pins`
  // map; env defaults remain the fallback for any unset key.
  const setPin = useCallback(async (profileId, newPin) => {
    const v = String(newPin || '').replace(/\D/g, '').slice(0, 4)
    if (v.length !== 4 || !['everett', 'parker', 'parent'].includes(profileId)) return
    if (demo) { setPinsState((p) => ({ ...p, [profileId]: v })); return }
    await setDoc(doc(db, 'families', FAMILY_ID), { pins: { [profileId]: v } }, { merge: true })
  }, [demo])

  // Parent sets a photo avatar for a boy. Uploaded to Storage; URL lives in the
  // family doc `avatars` map. Overwrites the same path so old photos don't pile
  // up. Falls back to the emoji avatar wherever the URL is absent.
  const setAvatar = useCallback(async (playerId, file) => {
    if (!file) return
    if (demo) { setAvatarsState((a) => ({ ...a, [playerId]: URL.createObjectURL(file) })); return }
    const r = storageRef(storage, `avatars/${FAMILY_ID}/${playerId}`)
    await uploadBytes(r, file)
    const url = await getDownloadURL(r)
    await setDoc(doc(db, 'families', FAMILY_ID), { avatars: { [playerId]: url } }, { merge: true })
  }, [demo])

  // Parent edits a built-in quest (title / min / pts) or hides it. Patch is
  // merged into the family doc `questDefs` map; the shared registry is updated
  // immediately so the change is reflected before the snapshot round-trips.
  const setQuestDef = useCallback(async (questId, patch = {}) => {
    if (!questId) return
    const nextDefs = { ...questDefs, [questId]: { ...(questDefs[questId] || {}), ...patch } }
    setQuestOverrides(nextDefs)
    setQuestDefsState(nextDefs)
    if (demo) return
    await setDoc(doc(db, 'families', FAMILY_ID), { questDefs: { [questId]: patch } }, { merge: true })
  }, [demo, questDefs])

  // Parent marks a reached milestone as cashed-in (or undoes it). Stored as an
  // array of milestone point-thresholds on the family doc.
  const redeemMilestone = useCallback(async (pts) => {
    const cur = Array.isArray(redeemed) ? redeemed : []
    const next = cur.includes(pts) ? cur.filter((x) => x !== pts) : [...cur, pts].sort((a, b) => a - b)
    if (demo) { setRedeemedState(next); return }
    await setDoc(doc(db, 'families', FAMILY_ID), { redeemed: next }, { merge: true })
  }, [demo, redeemed])

  // Fully remove an entry (used for custom activities). Refunds points if it
  // was verified, then drops the key entirely so no empty tile lingers.
  const deleteQuest = useCallback(async (playerId, questId) => {
    const prev = stateRef.current[playerId]?.quests?.[questId]
    if (!prev) return
    const refund = isVerified(prev.status) ? itemValue(questId, prev).pts : 0
    if (demo) {
      setState((p) => {
        const quests = { ...(p[playerId]?.quests || {}) }
        delete quests[questId]
        return { ...p, [playerId]: { ...p[playerId], quests } }
      })
      if (refund) setTeamPoints((t) => t - refund)
      return
    }
    const sRef = doc(db, 'families', FAMILY_ID, 'state', `${playerId}_${date}`)
    await updateDoc(sRef, { [`quests.${questId}`]: deleteField(), updatedAt: serverTimestamp() }).catch(() => {})
    if (refund) {
      await updateDoc(doc(db, 'families', FAMILY_ID), { teamPoints: increment(-refund) }).catch(() => {})
    }
  }, [demo, date])

  const addProof = useCallback(async (playerId, questId, file) => {
    if (demo) {
      const url = URL.createObjectURL(file)
      return writeQuest(playerId, questId, { status: 'proof', proofUrl: url })
    }
    const path = `proofs/${FAMILY_ID}/${date}/${playerId}_${questId}_${Date.now()}`
    const r = storageRef(storage, path)
    await uploadBytes(r, file)
    const url = await getDownloadURL(r)
    return writeQuest(playerId, questId, { status: 'proof', proofUrl: url })
  }, [demo, writeQuest, date])

  const resetToday = useCallback(async () => {
    for (const p of PLAYERS) {
      const ps = stateRef.current[p.id]?.quests || {}
      let refund = 0
      for (const [qid, q] of Object.entries(ps)) {
        if (isVerified(q.status)) refund += itemValue(qid, q).pts
      }
      if (demo) {
        setState((prev) => ({ ...prev, [p.id]: { quests: {} } }))
        if (refund) setTeamPoints((t) => t - refund)
      } else {
        const sRef = doc(db, 'families', FAMILY_ID, 'state', `${p.id}_${date}`)
        await setDoc(sRef, { quests: {}, spent: 0, updatedAt: serverTimestamp() }, { merge: true })
        if (refund) {
          await updateDoc(doc(db, 'families', FAMILY_ID), { teamPoints: increment(-refund) }).catch(() => {})
        }
      }
    }
  }, [demo, date])

  const stats = {
    everett: pointsFor(state.everett),
    parker: pointsFor(state.parker),
  }

  // Per-player derived analytics: streak, current-week point map, badges.
  // Today's live state is merged over the fetched history.
  const derived = useMemo(() => {
    const out = {}
    PLAYERS.forEach((p) => {
      const merged = { ...(history[p.id] || {}), [date]: state[p.id] || { quests: {} } }
      out[p.id] = {
        streak: computeStreak(merged),
        weekPoints: weekPointsMap(merged),
        weeks: weeklyTotals(merged, 4),
        badges: buildBadges(merged),
      }
    })
    return out
  }, [history, state, date])

  return {
    date, demo, loading, teamPoints, teamGoal, milestones, pins, avatars, redeemed, questDefs, state, stats, history, derived,
    actions: { claim, revert, signOff, setPick, addProof, resetToday, logSport, addCustom, logScreen, setLadder, deleteQuest, setPin, setAvatar, redeemMilestone, setQuestDef },
  }
}
