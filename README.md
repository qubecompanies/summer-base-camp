# Summer Base Camp ☀

A gamified weekday summer schedule for Everett (14) and Parker (11).
Claim a quest → prove it (photo) or get a parent sign-off → bank screen
minutes and feed the shared team goal. Built to fight the screen-time
summer without being overbearing.

**Stack:** Vite + React (no TypeScript) · Firebase (Auth + Firestore +
Storage) · plain CSS design system · deuteranopia-safe palette.

---

## Run it locally (demo mode — no setup)

```bash
npm install
npm run dev
```

Open the local URL. With no Firebase keys it runs in **demo mode**: fully
clickable, photo proof works in-browser, but nothing saves. Great for a
first look.

## Wire up Firebase (saving + cross-device sync)

1. Create a Firebase project (or reuse one under `philipeaker@gmail.com`).
   Consider a dedicated project so the boys' data is isolated.
2. Enable: **Authentication → Anonymous**, **Firestore**, **Storage**.
   (Auth is anonymous — each device signs in silently; profiles + PINs are
   the family-facing gate, not Google accounts.)
3. Project settings → Your apps → Web app → copy the SDK config.
4. The `.env` scaffold already exists — fill in the values:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FAMILY_ID=eaker
   VITE_PARENT_PIN=        # gates Parent mode (default 1234)
   VITE_PIN_EVERETT=       # default 1111
   VITE_PIN_PARKER=        # default 2222
   ```

5. Publish the rules:

   ```bash
   firebase deploy --only firestore:rules,storage
   ```
   (Storage's deploy target is just `storage`, not `storage:rules`.)

6. `npm run dev` again. First open on each device shows "Whose device is
   this?" — pick a profile, confirm the PIN once, and that device binds to
   that boy (or Parent). All bound devices stay in sync.

## Deploy

**Firebase Hosting** (`base: '/'` is already set in `vite.config.js`):

```bash
npm run deploy
```

**GitHub Pages** (qubecompanies): set `base: '/summer-base-camp/'`, then
build and push `dist/` per your usual Pages flow.

---

## How it works

- **Two profiles**, Everett and Parker, switchable up top. Each has its own
  board; both feed one shared team total.
- **Hybrid day:** a short anchor strip (set times) + a flexible quest board.
- **Quest lifecycle:** `open → claimed → (proof | approved)`. Points and
  screen minutes only count once a quest is **verified** (photo proof OR
  parent sign-off).
- **Weekend mode** swaps in a different, *optional* quest set. Verified
  weekend quests bank extra minutes/points but don't affect the weekday
  streak.
- **Parent mode** (PIN-gated) shows both boys and a sign-off queue.
- **Team goal:** blended 6,000-pt ladder — Movie night (1,500) → Mini golf
  (3,000) → Six Flags (4,500) → Big adventure (6,000).

## Edit the content

- Quests, ideas, point/minute values, anchors → `src/config/quests.js`
- Team goal + milestones → `src/config/milestones.js`
- Players (names, ages, avatars) → `PLAYERS` in `src/config/quests.js`
- Colors / look → `:root` variables in `src/index.css`

## Firestore data model

```
families/{familyId}
  ├─ teamPoints: number        // cumulative, maintained via increment()
  ├─ teamGoal:   number        // parent-editable via the reward-ladder editor
  ├─ milestones: array         // [{ pts, label, note }], parent-editable
  └─ state/{playerId}_{YYYY-MM-DD}
       ├─ playerId, date
       ├─ spent: number        // screen minutes logged as used (bank = earned − spent)
       └─ quests: {
            <questId>: {
              status,                         // open | claimed | proof | approved
              pick?, proofUrl?,
              tier?, drill?, meet?,           // sports: effort tier + optional drill / meet flag
              custom?: { title, min, pts }    // custom activities carry their value inline
            }
          }

Storage: proofs/{familyId}/{date}/{playerId}_{questId}_{ts}
```

## Next ideas (not built yet)

- Push reminders at anchor times (notifications infra not wired).
- Per-boy photo avatars (currently emoji).
- True deletion of removed custom activities (today "remove" un-counts but
  leaves an empty tile).
