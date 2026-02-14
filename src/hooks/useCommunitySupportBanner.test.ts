import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCommunitySupportBanner } from './useCommunitySupportBanner'

let mockLocalDismissed = false
const mockSetLocalDismissed = vi.fn()
let mockIsHydrated = true

vi.mock('@/data/storageKeys', () => ({
  default: {
    popups: {
      supportBannerDismissed: '@EmuReady_support_banner_dismissed',
    },
  },
}))

vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [mockLocalDismissed, mockSetLocalDismissed, mockIsHydrated]),
}))

vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: {
      supportBannerShown: vi.fn(),
      supportBannerDismissed: vi.fn(),
      supportBannerCTA: vi.fn(),
    },
    contentDiscovery: {
      externalLinkClicked: vi.fn(),
    },
  },
}))

vi.mock('@/lib/env', () => ({
  env: {
    PATREON_URL: 'https://www.patreon.com/Producdevity',
  },
}))

describe('useCommunitySupportBanner', () => {
  beforeEach(() => {
    mockLocalDismissed = false
    mockIsHydrated = true
    vi.clearAllMocks()
  })

  it('should be visible when not dismissed and hydrated', () => {
    const { result } = renderHook(() =>
      useCommunitySupportBanner({ variant: 'home', page: 'home' }),
    )

    expect(result.current.isVisible).toBe(true)
  })

  it('should not be visible when locally dismissed', () => {
    mockLocalDismissed = true

    const { result } = renderHook(() =>
      useCommunitySupportBanner({ variant: 'home', page: 'home' }),
    )

    expect(result.current.isVisible).toBe(false)
  })

  it('should not be visible before hydration', () => {
    mockIsHydrated = false

    const { result } = renderHook(() =>
      useCommunitySupportBanner({ variant: 'home', page: 'home' }),
    )

    expect(result.current.isVisible).toBe(false)
  })

  it('should fire supportBannerShown on mount when visible', async () => {
    const analytics = (await import('@/lib/analytics')).default

    renderHook(() => useCommunitySupportBanner({ variant: 'home', page: 'home' }))

    expect(analytics.engagement.supportBannerShown).toHaveBeenCalledWith({
      variant: 'home',
      page: 'home',
    })
  })

  it('should not fire supportBannerShown when dismissed', async () => {
    mockLocalDismissed = true
    const analytics = (await import('@/lib/analytics')).default

    renderHook(() => useCommunitySupportBanner({ variant: 'home', page: 'home' }))

    expect(analytics.engagement.supportBannerShown).not.toHaveBeenCalled()
  })

  it('should set localStorage on dismiss', () => {
    const { result } = renderHook(() =>
      useCommunitySupportBanner({ variant: 'list', page: 'listings' }),
    )

    act(() => {
      result.current.dismiss()
    })

    expect(mockSetLocalDismissed).toHaveBeenCalledWith(true)
  })

  it('should fire analytics with timeToInteraction on dismiss', async () => {
    const analytics = (await import('@/lib/analytics')).default

    const { result } = renderHook(() =>
      useCommunitySupportBanner({ variant: 'list', page: 'listings' }),
    )

    act(() => {
      result.current.dismiss()
    })

    expect(analytics.engagement.supportBannerDismissed).toHaveBeenCalledWith({
      variant: 'list',
      page: 'listings',
      timeToInteraction: expect.any(Number),
    })
  })

  it('should fire analytics with timeToInteraction on CTA click', async () => {
    const analytics = (await import('@/lib/analytics')).default

    const { result } = renderHook(() =>
      useCommunitySupportBanner({ variant: 'home', page: 'home' }),
    )

    act(() => {
      result.current.handleCTAClick()
    })

    expect(analytics.engagement.supportBannerCTA).toHaveBeenCalledWith({
      variant: 'home',
      page: 'home',
      timeToInteraction: expect.any(Number),
    })
    expect(analytics.contentDiscovery.externalLinkClicked).toHaveBeenCalledWith({
      url: 'https://www.patreon.com/Producdevity',
      context: 'support_banner_home',
    })
  })

  it('should hide after dismiss is called', () => {
    const { result } = renderHook(() =>
      useCommunitySupportBanner({ variant: 'home', page: 'home' }),
    )

    expect(result.current.isVisible).toBe(true)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.isVisible).toBe(false)
  })
})
