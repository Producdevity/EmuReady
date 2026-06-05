'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/hooks'
import analytics from '@/lib/analytics'

type SignInMethod = NonNullable<Parameters<typeof analytics.user.signedIn>[0]['method']>
type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>

const INTERACTION_EVENTS: (keyof DocumentEventMap)[] = ['click', 'keydown', 'change', 'submit']

// Generate a UUID compatible with older browsers
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function mapExternalProvider(provider: string | undefined): SignInMethod | null {
  switch (provider) {
    case 'google':
    case 'oauth_google':
      return 'google'
    case 'discord':
    case 'oauth_discord':
      return 'discord'
    case 'github':
    case 'oauth_github':
      return 'github'
    default:
      return null
  }
}

function getSignInMethod(user: ClerkUser | null | undefined): SignInMethod {
  const externalProvider = mapExternalProvider(user?.externalAccounts?.[0]?.provider)
  if (externalProvider) return externalProvider
  if (user?.primaryEmailAddress) return 'email'
  return 'clerk'
}

function SessionTracker() {
  const { user } = useUser()
  const pathname = usePathname()
  const { analyticsAllowed } = useCookieConsent()
  const userId = user?.id
  const signInMethod = getSignInMethod(user)
  const sessionStartRef = useRef<number | null>(null)
  const pageLoadTimeRef = useRef<number | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const hasTrackedSessionStart = useRef<boolean>(false)
  const hasTrackedPageViewRef = useRef(false)
  const pageViewCountRef = useRef(0)
  const interactionCountRef = useRef(0)
  const currentUserIdRef = useRef<string | undefined>(undefined)
  const discoveredFeatures = useRef<Set<string>>(new Set())
  const previousUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (sessionStartRef.current !== null) return

    const now = Date.now()
    sessionStartRef.current = now
    pageLoadTimeRef.current = now
    sessionIdRef.current = generateUUID()
  }, [])

  useEffect(() => {
    currentUserIdRef.current = userId
  }, [userId])

  // Track user sign-in when a user transitions from null/undefined to having a user
  useEffect(() => {
    if (!analyticsAllowed) return

    const previousUserId = previousUserIdRef.current

    // If we now have a user but didn't before, and it's not the first load, track sign-in
    if (userId && !previousUserId && hasTrackedSessionStart.current) {
      analytics.user.signedIn({
        userId,
        method: signInMethod,
      })
    }

    // Update the previous user ID for next comparison
    previousUserIdRef.current = userId
  }, [analyticsAllowed, signInMethod, userId])

  // Track session start on the first load
  useEffect(() => {
    if (!analyticsAllowed || hasTrackedSessionStart.current || !sessionIdRef.current) return

    hasTrackedSessionStart.current = true

    analytics.session.sessionStarted({
      userId,
      sessionId: sessionIdRef.current,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    })
  }, [analyticsAllowed, userId])

  // Track page views when pathname changes
  useEffect(() => {
    if (!analyticsAllowed || pageLoadTimeRef.current === null) return

    const loadTime = hasTrackedPageViewRef.current ? undefined : Date.now() - pageLoadTimeRef.current
    const currentUserId = currentUserIdRef.current
    const pageViewEvent: Parameters<typeof analytics.session.pageView>[0] = {
      pathname,
      userId: currentUserId,
    }
    if (loadTime !== undefined) pageViewEvent.loadTime = loadTime

    hasTrackedPageViewRef.current = true
    pageViewCountRef.current += 1

    if (process.env.NODE_ENV === 'development') {
      return console.log('📊 Page View:', {
        pathname,
        loadTime,
        userSession: currentUserId ? 'authenticated' : 'anonymous',
      })
    }

    analytics.session.pageView(pageViewEvent)

    // Track feature discovery based on page visits
    const featureMap: Record<string, string> = {
      '/pc-listings/new': 'pc-listing_creation',
      '/listings/new': 'listing_creation',
      '/profile': 'profile_management',
      '/admin': 'admin_panel',
      '/listings': 'listing_browser',
      '/pc-listings': 'pc-listing_browser',
      '/games': 'game_browser',
    }

    const feature = featureMap[pathname]
    if (feature && !discoveredFeatures.current.has(feature)) {
      discoveredFeatures.current.add(feature)
      analytics.session.featureDiscovered({
        userId: currentUserId,
        feature: feature,
        context: pathname,
      })
    }
  }, [analyticsAllowed, pathname])

  // Count basic user interactions for the session summary
  useEffect(() => {
    if (!analyticsAllowed) return

    const handleInteraction = () => {
      interactionCountRef.current += 1
    }

    for (const eventName of INTERACTION_EVENTS) {
      document.addEventListener(eventName, handleInteraction, true)
    }

    return () => {
      for (const eventName of INTERACTION_EVENTS) {
        document.removeEventListener(eventName, handleInteraction, true)
      }
    }
  }, [analyticsAllowed])

  // Track session duration on page unloading
  useEffect(() => {
    if (!analyticsAllowed || sessionStartRef.current === null || !sessionIdRef.current) return

    const handleBeforeUnload = () => {
      if (sessionStartRef.current === null || !sessionIdRef.current) return

      const sessionDuration = Date.now() - sessionStartRef.current

      analytics.session.sessionEnded({
        userId: currentUserIdRef.current,
        sessionId: sessionIdRef.current,
        duration: sessionDuration,
        pageViews: pageViewCountRef.current,
        interactions: interactionCountRef.current,
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analyticsAllowed])

  return null
}

export default SessionTracker
