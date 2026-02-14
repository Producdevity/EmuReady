'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import analytics from '@/lib/analytics'
import { env } from '@/lib/env'

interface UseCommunitySupportBannerOptions {
  variant: 'home' | 'list' | 'detail'
  page: string
}

export function useCommunitySupportBanner(options: UseCommunitySupportBannerOptions) {
  const [isVisible, setIsVisible] = useState(false)
  const shownAtRef = useRef<number>(0)

  const [localDismissed, setLocalDismissed, isHydrated] = useLocalStorage(
    storageKeys.popups.supportBannerDismissed,
    false,
  )

  useEffect(() => {
    if (!isHydrated) return
    if (localDismissed) return

    setIsVisible(true)
    shownAtRef.current = Date.now()

    analytics.engagement.supportBannerShown({
      variant: options.variant,
      page: options.page,
    })
  }, [isHydrated, localDismissed, options.variant, options.page])

  const getTimeToInteraction = useCallback(() => {
    if (shownAtRef.current === 0) return 0
    return Math.round((Date.now() - shownAtRef.current) / 1000)
  }, [])

  const dismiss = useCallback(() => {
    setIsVisible(false)
    setLocalDismissed(true)

    analytics.engagement.supportBannerDismissed({
      variant: options.variant,
      page: options.page,
      timeToInteraction: getTimeToInteraction(),
    })
  }, [setLocalDismissed, options.variant, options.page, getTimeToInteraction])

  const handleCTAClick = useCallback(() => {
    analytics.engagement.supportBannerCTA({
      variant: options.variant,
      page: options.page,
      timeToInteraction: getTimeToInteraction(),
    })
    analytics.contentDiscovery.externalLinkClicked({
      url: env.PATREON_URL,
      context: `support_banner_${options.variant}`,
    })
  }, [options.variant, options.page, getTimeToInteraction])

  return {
    isVisible,
    dismiss,
    handleCTAClick,
  }
}
