# Summer Base Camp — Multi-Tenant Spec

**Goal:** turn the single-family app into one deployment that any family can sign up for, with each family's data fully isolated from every other family's.

**Status:** Draft for sign-off. No code written yet. Phase 1 cannot start until the **Auth method** decision (§7) is locked.

**Last updated:** 2026-06-06

---

## 1. Where we are today (single-tenant)

| Concern | Current implementation | File |
|---|---|---|
| Identity | **Anonymous** Firebase auth — a fresh anon UID per device, no account | `src/App.jsx`, `src/firebase.js` |
| Family selector | `FAMILY_ID` constant (`'eaker'`), from `.env` or hardcoded default | `src/firebase.js` |
| Family data | `families/{FAMILY_ID}` doc — `teamPoints`, `teamGoal`, `milestones`, `pins`, `avatars`, `redeemed`, `questDefs` | `src/hooks/useFamilyState.js` |
| Daily state | `families/{FAMILY_ID}/state/{playerId}_{YYYY-MM-DD}` — `quests`, `spent` | `useFamilyState.js` |
| Storage | `proofs/{FAMILY_ID}/{date}/…`, `avatars/{FAMILY_ID}/{playerId}` | `useFamilyState.js` |
| Kids / profiles | **Hardcoded** `everett` / `parker` + parent | `src/config/profiles.js`, `quests.js` |
| Quests / sports / badges / tasks | **Hardcoded** module constants | `src/config/*.js` |
| PINs | `DEFAULT_PINS` constant, overridable via family doc `pins` map | `config/profiles.js` |
| Device → profile binding | `localStorage` key `sbc_device_profile` | `src/hooks/useDeviceIdentity.js` |
| Security rules | Locked to `match /families/eaker` for any signed-in user | `firestore.rules` |

**The blocker:** the security rules allow *any* signed-in (anonymous) user to read the family tree. With anonymous auth there is no durable identity to scope data to, so family B could read family A. **Multi-tenancy is impossible without real identity.** This is the crux of Phase 1.

---

## 2. Target architecture

### 2.1 Identity
Replace anonymous auth with **real accounts** (Google sign-in recommended — see §7). Each parent has a stable `uid`. Kids do **not** need accounts; they keep using the on-device profile binding + PIN gate. Only the parent(s) authenticate to Firebase; the kid devices ride on the family the parent set up (a kid device is bound to a family + profile at setup time and stores a family-scoped, read-limited token — see §6 open question on kid-device auth).

### 2.2 Firestore data model
```
families/{familyId}
  name: "The Eaker Family"
  createdBy: <uid>
  members: { <uid>: "admin" | "parent" }     // who can read/write this family
  joinCode: "SUN-4F2K"                        // short code to add another parent
  kids: [ { id, name, avatar, color, sports:[…] }, … ]   // was hardcoded everett/parker
  teamPoints, teamGoal, milestones, pins, avatars, redeemed, questDefs   // unchanged
  questOverrides / customQuests: {…}          // per-family quest board (Phase 2)

  state/{kidId}_{YYYY-MM-DD}                  // unchanged shape (quests, spent)

userIndex/{uid}
  familyIds: [ <familyId>, … ]                // fast "which families am I in?" lookup
```

Key point: the daily-state subcollection and Storage paths are **already** `families/{id}/…`, so the read/write logic barely changes — we swap the constant `FAMILY_ID` for a runtime `familyId` resolved at login.

### 2.3 Security rules (the real isolation)
```
match /families/{familyId} {
  allow read, write: if isMember(familyId);
  match /{document=**} { allow read, write: if isMember(familyId); }
}
function isMember(fid) {
  return request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/families/$(fid)).data.members;
}
```
Create-a-family is the one write allowed to a non-member (you must be able to make the family you're about to belong to); guarded so the creator puts their own uid in `members`.

### 2.4 Routing / app flow
```
signed out                → Landing (Sign in)
signed in, 0 families      → Onboarding: Create family  |  Join by code
signed in, 1 family        → straight into that family (today's board)
signed in, 2+ families     → Family picker, then board
```
`FAMILY_ID` constant → React context `useFamily()` providing the resolved `familyId` + family doc. `useFamilyState()` reads `familyId` from context instead of importing the constant.

---

## 3. Phasing (each phase independently shippable; Eaker family keeps working throughout)

### Phase 1 — Foundation: real auth + membership + rules
- Enable the chosen auth provider in Firebase (§7).
- Add Google/email sign-in screen; replace the silent `signInAnonymously` path.
- Introduce `members` + `userIndex`; **migrate the Eaker family** (add your uid as `admin`).
- Rewrite `firestore.rules` to membership-based isolation; deploy rules **before** the hosting build (per project deploy discipline).
- `FAMILY_ID` constant → `useFamily()` context, resolving to Eaker for existing users.
- **Outcome:** identical UX for your family, but data is now properly access-controlled and the foundation for other families exists.

### Phase 2 — Dynamic family config
- Move kids/profiles/team goal/PINs out of `config/*.js` into the family doc (`kids`, `pins`, `teamGoal`).
- A **Family Setup** screen (parent tools): add/rename/remove kids, set avatars, goal, PINs.
- Quest board already supports per-family overrides via `questDefs`; extend to custom quests so families aren't stuck with our defaults.
- `useDeviceIdentity` binds to a kid from the dynamic `kids` list rather than the hardcoded profile registry.
- **Outcome:** the app is fully data-driven; a second family could function if it existed.

### Phase 3 — Onboarding & multi-family
- Landing page (sign in) + **Create family** (generates `joinCode`) / **Join by code** flows.
- Multi-family routing + family picker.
- Invite a co-parent via join code; admin vs parent roles.
- **Outcome:** any family can self-serve sign up and run their own camp.

### Phase 4 — Polish & docs
- Per-family branding (name shown in chrome; optional accent color — keep deuteranopia-safe palette as defaults).
- Shareable invite links.
- `SETUP.md` / in-app help; account management (leave family, transfer admin).
- Decide on a fair-use / cost posture (see §5).

---

## 4. Migration plan for the Eaker family (zero data loss)
1. Deploy Phase 1 code with a **dual-auth grace window**: accept the existing anon session *and* offer "Sign in with Google to secure your family."
2. On first Google sign-in from your device, write your `uid` into `families/eaker.members` and `userIndex/{uid}`.
3. Once your account is the admin, flip rules to membership-only and retire anonymous auth.
4. Kid devices re-bind on next open (their localStorage profile binding persists; see §6 for how kid devices authenticate post-anon).
5. No state/history/Storage objects move — same paths.

> ⚠️ Do **not** disable anonymous auth in the Firebase console until every family device has a real session, or kid devices will hard-fail. Sequence it as the *last* step of Phase 1.

---

## 5. Cost / abuse considerations (new with public signup)
- Firestore/Storage are per-project; open signup means strangers' reads/writes hit **your** Firebase bill.
- Mitigations: App Check (block non-app clients), per-family document caps, Storage rules limiting proof image size/count, and a soft cap on families. Decide a posture in Phase 4 (invite-only vs open; free vs ask-a-coffee).

---

## 6. Open questions / decisions still needed
1. **Kid-device auth after anonymous is retired.** Options: (a) kid devices also use a lightweight Google/anon-with-custom-claim tied to the family; (b) keep anonymous *only* for kid devices but scope rules so an anon UID must be pre-registered in the family's `kids`/`deviceTokens`. Leaning (b) to avoid forcing kids to have accounts. **Needs a decision in Phase 1 design.**
2. **One family per parent, or many?** Spec supports many (`userIndex.familyIds[]`); simplest UX assumes one. Cheap to keep the array even if UI shows one.
3. **Branding scope** — name only, or name + accent color + icon? Affects Phase 4 size.
4. **Hosting** — stay on `summer-base-camp.web.app` (one project, multi-tenant), or offer custom subdomains later? Recommend single project for v1.

---

## 7. ⏳ PENDING DECISION — Auth method (gates Phase 1)
| Option | Pros | Cons |
|---|---|---|
| **Google sign-in only** *(recommended)* | One tap on phones, no passwords, no reset flow to build, reliable token persistence | Requires a Google account |
| Email / password | Works without Google | You build/maintain verification + password reset; weaker mobile UX |
| Both | Widest reach | Most surface area to build & support |

**Recommendation:** **Google-only** for Phase 1; add email later only if a prospective family lacks Google. This spec assumes Google-only until told otherwise.

---

## 8. Rough effort (relative, not calendar)
| Phase | Size | Risk |
|---|---|---|
| 1 — Auth + membership + rules + migration | Large | High (auth + rules + live migration of your family) |
| 2 — Dynamic family config | Medium | Medium |
| 3 — Onboarding & multi-family | Medium | Medium |
| 4 — Polish & docs | Small–Medium | Low |

Phase 1 is the riskiest because it touches authentication, security rules, and migrates the live Eaker family. We do it behind the dual-auth grace window and **deploy rules before hosting**, with a commit checkpoint before the rules flip.
