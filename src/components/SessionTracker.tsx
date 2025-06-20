'use client'

import { useUser } from '@clerk/nextjs'
import { sendGAEvent } from '@next/third-parties/google'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import useCookieConsent from '@/hooks/useCookieConsent'
import analytics from '@/lib/analytics'

function SessionTracker() {
  const { user } = useUser()
  const pathname = usePathname()
  const { analyticsAllowed } = useCookieConsent()
  const sessionStartRef = useRef<number>(Date.now())
  const pageLoadTimeRef = useRef<number>(Date.now())
  const sessionIdRef = useRef<string>(crypto.randomUUID())
  const hasTrackedSessionStart = useRef<boolean>(false)
  const discoveredFeatures = useRef<Set<string>>(new Set())

  // Track session start on first load
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
      console.log('📊 Page View:', {
        page: pathname,
        loadTime,
        userId: user?.id,
      })
      return
    }

    // Client-side: Send to Google Analytics via Next.js integration
    sendGAEvent('event', 'page_view', {
      page_location: pathname,
      page_load_time: loadTime,
      user_id: user?.id,
    })

    // Server-side: Send to analytics endpoint for additional processing
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_view',
        category: 'navigation',
        page: pathname,
        session_id: sessionIdRef.current,
        load_time: loadTime,
      }),
    }).catch((error) => {
      // Silently fail - analytics shouldn't break the app
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics endpoint failed:', error)
      }
    })

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
  }, [pathname, analyticsAllowed, user?.id])

  // Track session duration on page unload
  useEffect(() => {
    if (!analyticsAllowed) return

    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStartRef.current

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Session End:', {
          duration: sessionDuration,
          userId: user?.id,
        })
        return
      }

      // Track session end with analytics
      analytics.session.sessionEnded({
        userId: user?.id,
        sessionId: sessionIdRef.current,
        duration: sessionDuration,
        pageViews: 1, // This would need to be tracked separately for accuracy
        interactions: 0, // This would need to be tracked separately for accuracy
      })

      // Use sendBeacon for reliable delivery on page unload
      const data = JSON.stringify({
        event: 'session_end',
        category: 'engagement',
        session_id: sessionIdRef.current,
        session_duration: sessionDuration,
      })

      // Fallback to fetch if sendBeacon is not available
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', data)
      } else {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {
          // Silently fail on page unload
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analyticsAllowed, user?.id])

  return null
}

export default SessionTracker
