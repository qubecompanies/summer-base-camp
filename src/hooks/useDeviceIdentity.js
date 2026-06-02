import { useState, useCallback } from 'react'
import { profileById } from '../config/profiles'

// Which profile this physical device belongs to. Persisted in localStorage
// (the one place localStorage is OK for this app — device binding, not app data).
const KEY = 'sbc_device_profile'

export function useDeviceIdentity() {
  const [profileId, setProfileId] = useState(() => localStorage.getItem(KEY) || null)
  const profile = profileById(profileId)

  const bind = useCallback((id) => {
    localStorage.setItem(KEY, id)
    setProfileId(id)
  }, [])

  const unbind = useCallback(() => {
    localStorage.removeItem(KEY)
    setProfileId(null)
  }, [])

  return { profileId, profile, bound: Boolean(profile), bind, unbind }
}
