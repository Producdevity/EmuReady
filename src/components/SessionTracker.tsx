'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/hooks'
import analytics from '@/lib/analytics'

// Generate a UUID compatible with older browsers
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function SessionTracker() {
  const { user } = useUser()
  const pathname = usePathname()
  const { analyticsAllowed } = useCookieConsent()
  const sessionStartRef = useRef<number>(Date.now())
  const pageLoadTimeRef = useRef<number>(Date.now())
  const sessionIdRef = useRef<string>(generateUUID())
  const hasTrackedSessionStart = useRef<boolean>(false)
  const discoveredFeatures = useRef<Set<string>>(new Set())
  const previousUserIdRef = useRef<string | undefined>(undefined)

  // Track user sign-in when a user transitions from null/undefined to having a user
  useEffect(() => {
    if (!analyticsAllowed) return

    const currentUserId = user?.id
    const previousUserId = previousUserIdRef.current

    // If we now have a user but didn't before, and it's not the first load, track sign-in
    if (currentUserId && !previousUserId && hasTrackedSessionStart.current) {
      analytics.user.signedIn({
        userId: currentUserId,
        method: 'clerk', // TODO: figure out if we can get the SSO method from Clerk
      })
    }

    // Update the previous user ID for next comparison
    previousUserIdRef.current = currentUserId
  }, [analyticsAllowed, user?.id])

  // Track session start on the first load
  useEffect(() => {
    if (!analyticsAllowed || hasTrackedSessionStart.current) return

    hasTrackedSessionStart.current = true

    analytics.session.sessionStarted({
      userId: user?.id,
      sessionId: sessionIdRef.current,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    })
  }, [analyticsAllowed, user?.id])

  // Track page views when pathname changes
  useEffect(() => {
    if (!analyticsAllowed) return

    const loadTime = Date.now() - pageLoadTimeRef.current

    if (process.env.NODE_ENV === 'development') {
      return console.log('📊 Page View:', {
        pathname,
        loadTime,
        userSession: user ? 'authenticated' : 'anonymous',
      })
    }

    analytics.session.pageView({ pathname, loadTime, userId: user?.id })

    // Track feature discovery based on page visits
    const featureMap: Record<string, string> = {
      '/listings/new': 'listing_creation',
      '/profile': 'profile_management',
      '/admin': 'admin_panel',
      '/listings': 'listing_browser',
      '/games': 'game_browser',
    }

    const feature = featureMap[pathname]
    if (feature && !discoveredFeatures.current.has(feature)) {
      discoveredFeatures.current.add(feature)
      analytics.session.featureDiscovered({
        userId: user?.id,
        feature: feature,
        context: pathname,
      })
    }

    // Reset page load timer
    pageLoadTimeRef.current = Date.now()
  }, [pathname, analyticsAllowed, user])

  // Track session duration on page unloading
  useEffect(() => {
    if (!analyticsAllowed) return

    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStartRef.current

      // Track session end with analytics
      analytics.session.sessionEnded({
        userId: user?.id,
        sessionId: sessionIdRef.current,
        duration: sessionDuration,
        pageViews: 1, // TODO: Track page views separately
        interactions: 0, // TODO: Track interactions separately
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analyticsAllowed, user])

  return null
}

export default SessionTracker
