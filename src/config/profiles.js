import { getPlayers } from './quests'

// Profiles = the two boys + a parent. PINs are LIGHT gates for a family app
// (so the boys can't impersonate each other or self-approve) — not real
// security. Like the existing parent PIN, they ship in the client bundle.
// Override any default via env (.env): VITE_PIN_EVERETT, VITE_PIN_PARKER,
// VITE_PARENT_PIN.
const pin = (key, fallback) => import.meta.env[key] || fallback

// Baseline PINs from env (or hardcoded fallbacks). These are the defaults until
// a parent changes a PIN in-app, at which point the new value lives in the
// Firestore family doc (`pins` map) and overrides the matching default.
export const DEFAULT_PINS = {
  everett: pin('VITE_PIN_EVERETT', '1111'),
  parker: pin('VITE_PIN_PARKER', '2222'),
  parent: pin('VITE_PARENT_PIN', '1234'),
}

// Merge a Firestore `pins` override onto the defaults. Missing keys fall back to
// DEFAULT_PINS, so a partial map (only one PIN changed) still works.
export const effectivePins = (override = {}) => ({ ...DEFAULT_PINS, ...override })

// Profiles = the family's kids + a parent. Built dynamically from getPlayers()
// (the active family's kids, or the Eaker defaults) so a multi-tenant family
// gets its own kids. PIN is filled from the live pins map when provided.
export const getProfiles = (override = {}) => {
  const pins = effectivePins(override)
  return [
    ...getPlayers().map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, role: 'kid', pin: pins[p.id] })),
    { id: 'parent', name: 'Parent', avatar: '👤', role: 'parent', pin: pins.parent },
  ]
}
export const profileById = (id, override) => getProfiles(override).find((p) => p.id === id)
export const profilesWithPins = (override = {}) => getProfiles(override)
