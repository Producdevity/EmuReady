import { test as base, type Page, type BrowserContext } from '@playwright/test'
import { TEST_CONFIG } from '../helpers/test-config'

/**
 * Custom test fixtures with optimized settings for production builds
 */
export const test = base.extend({
  // Override default page fixture with custom settings
  page: async ({ page }, applyPage: (p: Page) => Promise<void>) => {
    // Set default timeouts
    page.setDefaultTimeout(TEST_CONFIG.timeouts.action)
    page.setDefaultNavigationTimeout(TEST_CONFIG.timeouts.navigation)

    // Add request interceptor to log slow API calls
    page.on('requestfailed', (request) => {
      console.error(
        `Request failed: ${request.url()} - ${request.failure()?.errorText}`,
      )
    })

    // Log slow responses in dev mode
    if (process.env.DEBUG) {
      page.on('response', (response) => {
        const timing = response.timing()
        if (timing && timing.responseEnd - timing.requestStart > 5000) {
          console.warn(
            `Slow response: ${response.url()} took ${timing.responseEnd - timing.requestStart}ms`,
          )
        }
      })
    }

    await applyPage(page)
  },

  // Auto-dismiss cookie consent for all tests
  context: async (
    { context },
    applyContext: (ctx: BrowserContext) => Promise<void>,
  ) => {
    // Add cookie consent to context
    await context.addInitScript(() => {
      localStorage.setItem('emuready-cookie-consent', 'true')
      localStorage.setItem(
        'emuready-cookie-preferences',
        JSON.stringify({
          necessary: true,
          analytics: false,
          performance: false,
        }),
      )
      localStorage.setItem(
        'emuready-cookie-consent-date',
        new Date().toISOString(),
      )
    })

    await applyContext(context)
  },
})

export { expect } from '@playwright/test'
