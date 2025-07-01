interface LocalPreferences {
  analytics?: boolean
  performance?: boolean
  marketing?: boolean
}

/**
 * Check if analytics tracking is allowed based on cookie consent
 * Only applies to client-side tracking
 */
export function isTrackingAllowed(category: string): boolean {
  // Server-side: always allow (no cookie consent needed)
  if (typeof window === 'undefined') return true

  // Client-side: check cookie consent
  const necessaryCategories = ['performance'] as const

  try {
    // Check if user has given consent
    const hasConsented = localStorage.getItem('cookieConsent')
    if (!hasConsented) {
      // No consent given, only allow necessary events
      return necessaryCategories.includes(category as 'performance')
    }

    // Get actual preferences
    const preferencesString = localStorage.getItem('cookiePreferences')
    if (preferencesString) {
      const preferences = JSON.parse(preferencesString) as LocalPreferences

      // Always allow necessary performance events
      if (necessaryCategories.includes(category as 'performance')) {
        return true
      }

      // Check analytics consent for other categories
      return preferences.analytics === true
    } else {
      // Consent given but no preferences found, only allow the necessary events
      return necessaryCategories.includes(category as 'performance')
    }
  } catch (error) {
    console.error('Error checking cookie consent:', error)
    // Fail safely - only allow the necessary events
    return necessaryCategories.includes(category as 'performance')
  }
}
