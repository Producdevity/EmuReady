import { type Page, test } from '@playwright/test'
import { CookieBanner } from '../pages/CookieBanner'

/**
 * Helper to ensure cookie banners are properly handled
 */
export async function ensureCookieBannerDismissed(page: Page) {
  const cookieBanner = new CookieBanner(page)

  // Wait a bit for cookie banner to potentially appear
  await page.waitForTimeout(1000)

  // Try to dismiss cookie banner
  await cookieBanner.dismissIfPresent()

  // Double-check it's gone
  const stillVisible = await cookieBanner.isVisible()
  if (stillVisible) {
    console.warn('Cookie banner still visible after dismissal attempt')
    // Try one more time with force
    await cookieBanner.dismissIfPresent()
  }
}

/**
 * Custom test fixture that handles cookie banners automatically
 */
export const testWithCookieHandling = test.extend<{
  autoHandleCookies: void
}>({
  autoHandleCookies: [
    async ({ page }, use) => {
      // Handle cookies before each test
      await ensureCookieBannerDismissed(page)

      // Run the test
      await use()
    },
    { auto: true },
  ],
})
