'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  performance: boolean
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  performance: false,
}

export function useCookieConsent() {
  const router = useRouter()
  const [preferences, setPreferences] =
    useState<CookiePreferences>(DEFAULT_PREFERENCES)
  const [hasConsented, setHasConsented] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [wasDismissed, setWasDismissed] = useState(false)

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return

    try {
      const savedPreferences = localStorage.getItem('cookiePreferences')
      const consentGiven = localStorage.getItem('cookieConsent')
      const dismissed = localStorage.getItem('cookieDismissed')

      if (savedPreferences && consentGiven) {
        const parsed = JSON.parse(savedPreferences) as CookiePreferences
        setPreferences(parsed)
        setHasConsented(true)
      } else if (dismissed) {
        setWasDismissed(true)
      }
    } catch (error) {
      console.warn('Failed to load cookie preferences:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Listen for route changes to show banner again if user dismissed without choosing
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleRouteChange = () => {
      const dismissed = localStorage.getItem('cookieDismissed')
      const consentGiven = localStorage.getItem('cookieConsent')

      // If user dismissed but didn't give consent, show banner again on navigation
      if (dismissed && !consentGiven) {
        localStorage.removeItem('cookieDismissed')
        setWasDismissed(false)
      }
    }

    // Use native event listener since we want to catch all navigation
    window.addEventListener('beforeunload', handleRouteChange)

    return () => {
      window.removeEventListener('beforeunload', handleRouteChange)
    }
  }, [router])

  const savePreferences = useCallback((newPreferences: CookiePreferences) => {
    try {
      localStorage.setItem('cookiePreferences', JSON.stringify(newPreferences))
      localStorage.setItem('cookieConsent', 'true')
      localStorage.setItem('cookieConsentDate', new Date().toISOString())

      setPreferences(newPreferences)
      setHasConsented(true)

      // Dispatch custom event for analytics systems to respond to
      window.dispatchEvent(
        new CustomEvent('cookiePreferencesChanged', {
          detail: newPreferences,
        }),
      )
    } catch (error) {
      console.error('Failed to save cookie preferences:', error)
    }
  }, [])

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem('cookiePreferences')
      localStorage.removeItem('cookieConsent')
      localStorage.removeItem('cookieConsentDate')
      localStorage.removeItem('cookieDismissed')

      setPreferences(DEFAULT_PREFERENCES)
      setHasConsented(false)
      setWasDismissed(false)
    } catch (error) {
      console.error('Failed to reset cookie consent:', error)
    }
  }, [])

  const dismissWithoutChoice = useCallback(() => {
    try {
      localStorage.setItem('cookieDismissed', 'true')
      setWasDismissed(true)
    } catch (error) {
      console.error('Failed to save dismissal state:', error)
    }
  }, [])

  const shouldShowBanner = isLoaded && !hasConsented && !wasDismissed

  // Check if analytics is allowed
  const analyticsAllowed = preferences.analytics && hasConsented

  // Check if performance tracking is allowed
  const performanceAllowed = preferences.performance && hasConsented

  return {
    preferences,
    hasConsented,
    isLoaded,
    shouldShowBanner,
    analyticsAllowed,
    performanceAllowed,
    savePreferences,
    resetConsent,
    dismissWithoutChoice,
  }
}
