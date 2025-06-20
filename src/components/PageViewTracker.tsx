'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import analytics from '@/lib/analytics'

function PageViewTracker() {
  const pathname = usePathname()
  const previousPathname = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Don't track the initial page load or if pathname hasn't changed
    if (previousPathname.current === pathname) return

    const startTime = performance.now()

    // Track page view
    analytics.navigation.pageView({
      page: pathname,
      referrer: previousPathname.current,
      loadTime: Math.round(performance.now() - startTime),
    })

    // Update the previous pathname
    previousPathname.current = pathname
  }, [pathname])

  // Track initial page load
  useEffect(() => {
    if (!previousPathname.current) {
      const startTime = performance.now()

      analytics.navigation.pageView({
        page: pathname,
        referrer: document.referrer || undefined,
        loadTime: Math.round(performance.now() - startTime),
      })

      previousPathname.current = pathname
    }
  }, [pathname])

  return null
}

export default PageViewTracker
