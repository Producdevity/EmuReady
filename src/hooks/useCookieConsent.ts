import storageKeys from '@/data/storageKeys'
import { BooleanPreferenceSchema, SavedCookiePreferencesSchema } from '@/schemas/preferences'
import { useLocalStorage } from './useLocalStorage'

export function useCookieConsent() {
  const [preferences] = useLocalStorage(
    storageKeys.cookies.preferences,
    null,
    SavedCookiePreferencesSchema,
  )
  const [hasConsented] = useLocalStorage(
    storageKeys.cookies.consent,
    false,
    BooleanPreferenceSchema,
  )

  return { analyticsAllowed: hasConsented && preferences?.analytics === true }
}
