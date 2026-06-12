// Active-family registry (multi-tenant). The multi-tenant shell sets this once
// after a family is resolved; everything else reads through the getters below.
// When UNSET (the single-family / flag-off path), the getters fall back to the
// hardcoded Eaker defaults, so the existing app behaves exactly as before.
let _family = null // { familyId, kids: [...], pins, sports, screenRate }

export function setActiveFamily(f) {
  _family = f && f.familyId ? f : null
}
export function clearActiveFamily() { _family = null }

export const hasActiveFamily = () => Boolean(_family)
export const activeFamilyId = (fallback) => (_family && _family.familyId) || fallback
export const activeKids = (fallback) =>
  (_family && Array.isArray(_family.kids) && _family.kids.length ? _family.kids : fallback)
export const activePins = (fallback) => (_family && _family.pins) || fallback
// Sports are family-configured (may legitimately be empty). Only fall back to
// the default when there is NO active family at all.
export const activeSports = (fallback) =>
  (_family ? (Array.isArray(_family.sports) ? _family.sports : []) : fallback)
// Screen-time generosity multiplier (parent-tunable). 1 = baseline. Applies to
// quest/sport minutes only (not points, not one-off custom values).
export const activeScreenRate = (fallback = 1) =>
  (_family && typeof _family.screenRate === 'number' && _family.screenRate > 0 ? _family.screenRate : fallback)
