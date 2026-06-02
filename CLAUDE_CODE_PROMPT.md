# Claude Code Prompt — Summer Base Camp

Paste everything below into Claude Code from inside the unzipped
`summer-base-camp/` folder to pick up the build and ship it.

---

## Context

Summer Base Camp is a gamified weekday-schedule web app for my two boys —
**Everett (14)** and **Parker (11)** — to fight a summer of screen time
without being overbearing. It's already scaffolded and **builds clean**
(`npm install && npm run build`, 67 modules, no errors). Stack is my
standard: **Vite + React (no TypeScript) + Firebase (Auth + Firestore +
Storage) + plain CSS**. Deuteranopia-safe palette (blue/amber/coral/purple/
teal, every category also carries a distinct shape glyph — never red-vs-
green). Literal `·` characters in markup, never `\u00B7`.

It runs in **demo mode** with no keys (clickable, no persistence). I want to
wire it to Firebase and deploy.

## What's already built (don't rebuild — verify + extend)

- Two device-bound profiles (Everett / Parker / Parent) via **anonymous
  auth** + per-profile 4-digit PIN. First launch asks "Whose device is this?"
- Quest lifecycle `open → claimed → (proof | approved)`; points + screen
  minutes only count when verified (photo proof to Storage, or parent
  sign-off). Photo proof uses the device camera/file picker.
- Hybrid day: anchor strip + flexible quest board. **Weekend mode** swaps in
  an optional bonus quest set that banks extra without breaking the streak.
- **Sports:** basketball (both), JROTC Spartan + weightlifting (Everett),
  swim w/ meet flag (Parker). Effort tiers Light/Medium/Hard = base/1.5×/2×.
  Per-sport **drill libraries** (🎯 drills sheet).
- **"I'm bored"** generator (indoor/outdoor/with-a-friend). **Friend invite**
  quest. **Custom activities** (boys' need sign-off, parent's auto-count,
  parent can target one boy or both).
- **Parent analytics** (deep view) + **boys' summary**: category balance,
  week-over-week points, claim→verify follow-through, screen earned,
  sport/practice consistency (each sport — basketball, JROTC, lifting, swim
  — broken out separately, filtered per boy), most-skipped, social.
- **Editable reward ladder** (parent edits the 4 milestones in-app).
- **Screen model:** "Screen earned" headline; **parent-only countdown** logs
  evening game/TV use against earned minutes. (A web app can't read real iOS/
  Android screen-time — this is the honest model.)
- Local **anchor reminders** (8:30/12:30/4:00) while the app is open.
- Real **streak** + **14-day history** aggregation feeding analytics.

## Your tasks, in order

1. **Sanity run.** `npm install`, `npm run dev`, click through every view
   (Today/Week/Stats, Weekday/Weekend, Parent mode, all four sheets). Fix any
   runtime errors. Most likely suspects if anything breaks: the analytics
   aggregation in `src/lib/analytics.js`, the history wiring in
   `src/hooks/useFamilyState.js`, or sheet props.

2. **Firebase wiring (reusing my existing project under a new familyId).**
   - In my existing Firebase project, enable **Anonymous auth**, **Firestore**,
     **Storage**.
   - Copy `.env.example` → `.env`, fill keys, set `VITE_FAMILY_ID` to
     something unique (e.g. `eaker`) so it won't collide with my other apps
     in the same project, and change `VITE_PARENT_PIN`.
   - `firebase deploy --only firestore:rules,storage:rules`. Rules are in
     `firestore.rules` / `storage.rules` (a tighter members-allowlist variant
     is included as a comment — leave default unless I ask).
   - Verify cross-device sync: claim on one browser, see it on another.

3. **Deploy.** Firebase Hosting (`base: '/'` in `vite.config.js`,
   `npm run deploy`) — or GitHub Pages under `qubecompanies` with
   `base: '/summer-base-camp/'` if I say so. Confirm which I want.

4. **Then build the next layer (ask me to prioritize):**
   - **True push notifications** for anchor times when the app is closed:
     FCM + service worker + a scheduled Cloud Function. (Current reminders
     only fire while open.)
   - **Badge thresholds** are illustrative — confirm the numbers with me and
     make them fire reliably from real history.
   - **Multi-week / summer-long trend** view beyond the current week.
   - Optional: per-boy avatar photos.

## Guardrails / preferences

- Use **Command Prompt** syntax in any Windows instructions (I'm on Windows).
- Ask me **multiple-choice clarifying questions** before big changes; show a
  mockup or describe the approach before implementing.
- Keep everything deuteranopia-safe and keep the literal `·`.
- Don't introduce TypeScript. Don't add localStorage for app data (it's
  fine for the device-profile binding, which is where it's already used).
- Firebase admin is currently `philipeaker@gmail.com` (migration to
  `ops@qubecompanies.com` is a someday-maybe, not now).

## File map

```
src/
  App.jsx                      orchestration, views, modes, sheets
  config/quests.js             players, quests, sports, tiers, categories, anchors
  config/badges.js             badge defs + check() thresholds
  config/activities.js         boredom-buster + sport drill libraries
  config/milestones.js         default reward ladder
  lib/analytics.js             pure aggregation + analytics builders
  hooks/useFamilyState.js      Firestore state, history, streak, customs, ladder
  hooks/useDeviceIdentity.js   profile binding + PIN
  hooks/useReminders.js        local anchor-time notifications
  components/                  QuestCard, WeekView, ParentPanel, PinModal,
                               ProfileSetup, DrillSheet, BoredomSheet,
                               CustomQuestSheet, LadderSheet, Analytics
firestore.rules / storage.rules / firebase.json
```
