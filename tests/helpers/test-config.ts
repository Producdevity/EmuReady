import type { Page } from '@playwright/test'

/**
 * Centralized test configuration for E2E tests
 * Optimized for production builds to prevent timeouts
 */

export const TEST_CONFIG = {
  // Timeouts
  timeouts: {
    navigation: 30000, // 30s for page navigation
    action: 10000, // 10s for element actions
    wait: 5000, // 5s for general waits
    pageLoad: 20000, // 20s for initial page load
    apiCall: 15000, // 15s for API calls
  },

  // Retry configuration
  retries: {
    click: 3,
    navigation: 2,
    assertion: 3,
  },

  // Wait strategies
  waitStrategies: {
    // Wait for network to be idle
    networkIdle: { waitUntil: 'networkidle' as const, timeout: 30000 },
    // Wait for DOM to be ready
    domContentLoaded: {
      waitUntil: 'domcontentloaded' as const,
      timeout: 20000,
    },
    // Wait for full page load
    load: { waitUntil: 'load' as const, timeout: 30000 },
  },

  // Viewport sizes
  viewports: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },

  // Test data
  testData: {
    defaultWaitForSelector: '[data-testid], [role], a, button',
    cookieConsentKey: '@TestEmuReady_cookie_consent',
    cookiePrefix: '@TestEmuReady_',
  },
} as const

/**
 * Helper to wait for page stability
 */
export async function waitForPageStability(page: Page, timeout = 5000) {
  try {
    // Wait for no network activity for 500ms
    await page.waitForLoadState('networkidle', { timeout })
  } catch {
    // Fallback to DOM ready if network idle times out
    await page.waitForLoadState('domcontentloaded', { timeout: timeout / 2 })
  }

  // Additional stability check - wait for no animations
  await page.waitForTimeout(300)
}

/**
 * Retry helper for flaky operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        console.log(`Retry ${i + 1}/${maxRetries} after error:`, lastError.message)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

export async function gotoWithRetry(page: Page, url: string) {
  return retryOperation(async () => {
    await page.goto(url, TEST_CONFIG.waitStrategies.networkIdle)
    await waitForPageStability(page)
  }, TEST_CONFIG.retries.navigation)
}
