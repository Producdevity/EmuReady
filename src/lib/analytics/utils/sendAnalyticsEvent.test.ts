import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANALYTICS_CATEGORIES } from '../actions'

const mocks = vi.hoisted(() => ({
  isTrackingAllowed: vi.fn(() => true),
  loggerLog: vi.fn(),
  sendGAEvent: vi.fn(),
}))

vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: mocks.sendGAEvent,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    log: mocks.loggerLog,
  },
}))

vi.mock('./isTrackingAllowed', () => ({
  isTrackingAllowed: mocks.isTrackingAllowed,
}))

async function loadSendAnalyticsEvent(overrides: Record<string, string>) {
  vi.resetModules()
  vi.unstubAllEnvs()

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value)
  }

  return import('./sendAnalyticsEvent')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
  Reflect.deleteProperty(window, 'dataLayer')
})

describe('sendAnalyticsEvent', () => {
  it('does not send analytics when the master analytics flag is disabled', async () => {
    const { sendAnalyticsEvent } = await loadSendAnalyticsEvent({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'false',
      NEXT_PUBLIC_GA_ID: 'G-TEST',
    })

    sendAnalyticsEvent({
      category: ANALYTICS_CATEGORIES.ENGAGEMENT,
      action: 'support_banner_shown',
    })

    expect(mocks.sendGAEvent).not.toHaveBeenCalled()
  })

  it('sends Google Analytics events when analytics are enabled', async () => {
    Object.defineProperty(window, 'dataLayer', {
      value: [],
      configurable: true,
    })

    const { sendAnalyticsEvent } = await loadSendAnalyticsEvent({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
      NEXT_PUBLIC_GA_ID: 'G-TEST',
    })

    sendAnalyticsEvent({
      category: ANALYTICS_CATEGORIES.ENGAGEMENT,
      action: 'support_banner_shown',
    })

    expect(mocks.sendGAEvent).toHaveBeenCalledWith(
      'event',
      'support_banner_shown',
      expect.objectContaining({ event_category: ANALYTICS_CATEGORIES.ENGAGEMENT }),
    )
  })

  it('initializes dataLayer before sending Google Analytics events', async () => {
    const { sendAnalyticsEvent } = await loadSendAnalyticsEvent({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'production',
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
      NEXT_PUBLIC_GA_ID: 'G-TEST',
    })

    sendAnalyticsEvent({
      category: ANALYTICS_CATEGORIES.ENGAGEMENT,
      action: 'support_banner_shown',
    })

    expect(window.dataLayer).toEqual([])
    expect(mocks.sendGAEvent).toHaveBeenCalledWith(
      'event',
      'support_banner_shown',
      expect.objectContaining({ event_category: ANALYTICS_CATEGORIES.ENGAGEMENT }),
    )
  })
})
