// Active-family registry (multi-tenant). The multi-tenant shell sets this once
// after a family is resolved; everything else reads through the getters below.
// When UNSET (the single-family / flag-off path), the getters fall back to the
// hardcoded Eaker defaults, so the existing app behaves exactly as before.
let _family = null // { familyId, kids: [{ id, name, avatar, color }], pins }

export function setActiveFamily(f) {
  _family = f && f.familyId ? f : null
}
export function clearActiveFamily() { _family = null }

export const hasActiveFamily = () => Boolean(_family)
export const activeFamilyId = (fallback) => (_family && _family.familyId) || fallback
export const activeKids = (fallback) =>
  (_family && Array.isArray(_family.kids) && _family.kids.length ? _family.kids : fallback)
export const activePins = (fallback) => (_family && _family.pins) || fallback
