import type { Page } from '@playwright/test'

/**
 * Centralized test configuration for E2E tests.
 */

export const TEST_CONFIG = {
  timeouts: {
    navigation: 30000,
    action: 10000,
    wait: 5000,
    pageLoad: 20000,
    apiCall: 15000,
  },

  viewports: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },

  testData: {
    cookieConsentKey: '@StagingEmuReady_cookie_consent',
    cookiePrefix: '@StagingEmuReady_',
  },
} as const

export async function waitForPageStability(page: Page, timeout = 5000) {
  await page.waitForLoadState('domcontentloaded', { timeout })
}
