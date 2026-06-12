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

### 2.1 Identity — DECIDED: one family login + PINs
Each **family has a single login** (created with Google *or* email/password). Every device in the household — parents and kids — signs in with that one family account, then the existing **PIN gate** picks who is using it (parent vs. each kid). No per-kid emails. This is the model the app already implements (device binding + `useDeviceIdentity` + `PinModal`); we are only swapping *anonymous* auth for *one real account*.

- The family account's `uid` is the owner/member of exactly one family.
- Separate per-parent logins (so Mom and Dad each have their own account on the same family) are a **later** enhancement; the data model leaves room for it (`members` map) but the MVP has one login per family.
- Because there is one uid per family, we can key the family by a mapping doc rather than forcing `familyId == uid` (keeps migration trivial and multi-parent open). See §2.2.

### 2.2 Firestore data model
```
accounts/{uid}
  familyId: <familyId>                        // where this login belongs (set at create/join)

families/{familyId}                           // familyId = generated id ('eaker' kept for us)
  name: "The Eaker Family"
  ownerUid: <uid>                             // the family login (the member, for MVP)
  members: { <uid>: "owner" }                 // room for multi-parent later
  kids: [ { id, name, avatar, color, sports:[…] }, … ]   // was hardcoded everett/parker
  teamPoints, teamGoal, milestones, pins, avatars, redeemed, questDefs   // unchanged
  joinCode: "SUN-4F2K"                         // for adding a second parent later (Phase 3)

  state/{kidId}_{YYYY-MM-DD}                   // unchanged shape (quests, spent)
```

Key points:
- The daily-state subcollection and Storage paths are **already** `families/{id}/…`, so read/write logic barely changes — swap the constant `FAMILY_ID` for a runtime `familyId` resolved at login via `accounts/{uid}`.
- `familyId` is a **generated id, not the uid** — so the existing `families/eaker` tree is reused as-is (set `accounts/{philipUid}.familyId = 'eaker'`; **no data moves**), and a future second parent can map to the same `familyId`.
- **`kids` becomes data** (replaces hardcoded `everett`/`parker`). This pulls the "dynamic profiles" work into the MVP — a second family must define its own kids. Sports, which are currently hardcoded per named kid (`jrotc`→everett, `swim`→parker), move to an optional per-kid `sports` list; new families start with the universal quest board + custom activities and can add sports.

### 2.3 Security rules (the real isolation)
```
match /accounts/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
match /families/{familyId} {
  allow read, write: if isMember(familyId);
  // create allowed if the creator stamps themselves as owner (bootstrapping)
  allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
  match /{document=**} { allow read, write: if isMember(familyId); }
}
function isMember(fid) {
  return request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/families/$(fid)).data.members;
}
```
A signed-in user can only read/write their own `accounts/{uid}` and the one family whose `members` map contains their uid. Family creation is the single write a non-member may do, and only if they put their own uid as owner.

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

### Phase 1 — MVP: real auth + create-family + dynamic kids + isolation
Because a second family needs its own kids, the old "Phase 1 + Phase 2" merge into one shippable multi-family MVP. Built in three sub-steps so the **live Eaker family never breaks**:

**Step A — Auth layer, no live risk (rules unchanged).**
- Enable Google + Email/Password providers in Firebase console (Anonymous stays on).
- New `src/hooks/useAuth.js`: user state, Google sign-in (popup/redirect), email create/sign-in/**reset**, sign-out, typed error messages.
- New `src/components/SignIn.jsx`: branded, deuteranopia-safe screen with both paths + "forgot password".
- New `src/hooks/useFamily.js` (+ context): after sign-in, read `accounts/{uid}.familyId`; expose `familyId`, family doc, role; handle the 0-family (onboarding) and 1-family cases.
- Gate the app on a real user instead of the anonymous session. Ship behind a flag if needed.

**Step B — Dynamic family data (additive, dual-read).**
- `families/{id}.kids` array becomes the source of truth for profiles; `useFamilyState`, `useDeviceIdentity`, cards, ParentPanel read kids from it (fallback to the hardcoded `everett/parker` until migrated).
- `FAMILY_ID` constant → `familyId` from `useFamily()` everywhere (`useFamilyState`, Storage paths).
- New `src/components/Onboarding.jsx` + `CreateFamily`: name the family, add kids (name/avatar/color), set team goal + PINs → writes `families/{newId}` + `accounts/{uid}`.
- Sports become an optional per-kid `sports` list (Eaker's jrotc/lift/swim seeded during migration; new families add their own or skip).

**Step C — Flip isolation, retire anonymous (the one risky step; commit checkpoint first).**
- One-time migration for Eaker: on your first real sign-in, set `families/eaker.ownerUid/members` to your uid and `accounts/{uid}.familyId = 'eaker'` (no data moves).
- Deploy `firestore.rules` (owner/member-scoped) **before** the hosting build (per deploy discipline).
- Verify every family device works on the real login, **then** disable Anonymous auth in the console as the final action.

**Outcome:** any family can sign up, create their family with their own kids, and run an isolated camp. Eaker keeps all history.

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
1. ~~Kid-device auth~~ **DECIDED (2026-06-11): one family login + PINs.** Every device signs in with the single family account; the PIN gate picks the person. No per-kid accounts. (§2.1)
2. **One family per parent, or many?** Spec supports many (`userIndex.familyIds[]`); simplest UX assumes one. Cheap to keep the array even if UI shows one.
3. **Branding scope** — name only, or name + accent color + icon? Affects Phase 4 size.
4. **Hosting** — stay on `summer-base-camp.web.app` (one project, multi-tenant), or offer custom subdomains later? Recommend single project for v1.

---

## 7. ✅ DECIDED — Auth method: Google **and** Email/Password
Both providers ship in Phase 1 (decided 2026-06-11, driven by strong inbound demand from families who may not all have Google accounts).

- **Google** — one-tap sign-in (popup on desktop, redirect on mobile PWA).
- **Email / Password** — create account, sign in, **password reset** email, and basic validation. This adds a reset/verification flow we must build and test.

Implication: the sign-in screen carries both paths; the email flow is the larger surface area (reset, error messaging, "email already in use", weak-password, etc.).

---

## 8. Rough effort (relative, not calendar)
| Phase | Size | Risk |
|---|---|---|
| 1 — Auth + membership + rules + migration | Large | High (auth + rules + live migration of your family) |
| 2 — Dynamic family config | Medium | Medium |
| 3 — Onboarding & multi-family | Medium | Medium |
| 4 — Polish & docs | Small–Medium | Low |

Phase 1 is the riskiest because it touches authentication, security rules, and migrates the live Eaker family. We do it behind the dual-auth grace window and **deploy rules before hosting**, with a commit checkpoint before the rules flip.
