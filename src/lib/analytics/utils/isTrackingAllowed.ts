import { z } from 'zod'
import storageKeys from '@/data/storageKeys'
import { type AnalyticsCategory } from '@/lib/analytics/analytics.types'
import { safeParseJSON } from '@/utils/client-validation'

interface LocalPreferences {
  analytics?: boolean
  performance?: boolean
}

const LocalPreferencesSchema = z.object({
  analytics: z.boolean().optional(),
  performance: z.boolean().optional(),
})

/**
 * Check if analytics tracking is allowed based on cookie consent
 * Only applies to client-side tracking
 */
export function isTrackingAllowed(category: AnalyticsCategory): boolean {
  // Server-side: allow (no access to localStorage; events are not user-identifiable here)
  if (typeof window === 'undefined') return true

  try {
    // Must have explicit consent
    const hasConsented = localStorage.getItem(storageKeys.cookies.consent)
    if (!hasConsented) return false

    // Read stored preferences
    const preferencesString = localStorage.getItem(storageKeys.cookies.preferences)
    if (!preferencesString) return false

    const preferences = safeParseJSON<LocalPreferences>(
      preferencesString,
      LocalPreferencesSchema,
      {},
    )

    // Gate by banner categories: performance controls only the 'performance' event category;
    // all other analytics events require analytics consent.
    return category === 'performance'
      ? preferences.performance === true
      : preferences.analytics === true
  } catch (error) {
    console.error('Error checking cookie consent:', error)
    // Fail closed: block analytics when uncertain
    return false
  }
}
