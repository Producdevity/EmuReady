'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/hooks'
import analytics from '@/lib/analytics'

type SignInMethod = NonNullable<Parameters<typeof analytics.user.signedIn>[0]['method']>
type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>

const INTERACTION_EVENTS: (keyof DocumentEventMap)[] = ['click', 'keydown', 'change', 'submit']
const FEATURE_BY_PATHNAME: Partial<Record<string, string>> = {
  '/pc-listings/new': 'pc-listing_creation',
  '/listings/new': 'listing_creation',
  '/profile': 'profile_management',
  '/admin': 'admin_panel',
  '/listings': 'listing_browser',
  '/pc-listings': 'pc-listing_browser',
  '/games': 'game_browser',
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
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
  const initialPageViewStartedAtRef = useRef<number | null>(null)
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
    initialPageViewStartedAtRef.current = now
    sessionIdRef.current = generateUUID()
  }, [])

  useEffect(() => {
    currentUserIdRef.current = userId
  }, [userId])

  useEffect(() => {
    if (!analyticsAllowed) return

    const previousUserId = previousUserIdRef.current

    if (userId && !previousUserId && hasTrackedSessionStart.current) {
      analytics.user.signedIn({
        userId,
        method: signInMethod,
      })
    }

    previousUserIdRef.current = userId
  }, [analyticsAllowed, signInMethod, userId])

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

  useEffect(() => {
    if (!analyticsAllowed || initialPageViewStartedAtRef.current === null) return

    const initialLoadTime = hasTrackedPageViewRef.current
      ? undefined
      : Date.now() - initialPageViewStartedAtRef.current
    const currentUserId = currentUserIdRef.current
    const pageViewEvent: Parameters<typeof analytics.session.pageView>[0] = {
      pathname,
      userId: currentUserId,
    }
    if (initialLoadTime !== undefined) pageViewEvent.loadTime = initialLoadTime

    hasTrackedPageViewRef.current = true
    pageViewCountRef.current += 1

    if (process.env.NODE_ENV === 'development') {
      return console.log('Page View:', {
        pathname,
        loadTime: initialLoadTime,
        userSession: currentUserId ? 'authenticated' : 'anonymous',
      })
    }

    analytics.session.pageView(pageViewEvent)

    const feature = FEATURE_BY_PATHNAME[pathname]
    if (feature && !discoveredFeatures.current.has(feature)) {
      discoveredFeatures.current.add(feature)
      analytics.session.featureDiscovered({
        userId: currentUserId,
        feature,
        context: pathname,
      })
    }
  }, [analyticsAllowed, pathname])

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
