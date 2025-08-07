import { type Page, test } from '@playwright/test'
import { CookieBanner } from '../pages/CookieBanner'

/**
 * Helper to ensure cookie banners are properly handled
 */
export async function ensureCookieBannerDismissed(page: Page) {
  const cookieBanner = new CookieBanner(page)

  // First try to set consent in localStorage to prevent banner
  try {
    await page.evaluate(() => {
      const PREFIX = '@TestEmuReady_'
      localStorage.setItem(`${PREFIX}cookie_consent`, 'true')
      localStorage.setItem(
        `${PREFIX}cookie_preferences`,
        JSON.stringify({
          necessary: true,
          analytics: false,
          performance: false,
        }),
      )
      localStorage.setItem(
        `${PREFIX}cookie_consent_date`,
        new Date().toISOString(),
      )
    })
  } catch {
    // Ignore if localStorage is not available
  }

  // Wait a bit for cookie banner to potentially appear
  await page.waitForTimeout(500)

  // Try to dismiss cookie banner if it appears
  await cookieBanner.dismissIfPresent()

  // Double-check it's gone
  const stillVisible = await cookieBanner.isVisible()
  if (stillVisible) {
    console.warn('Cookie banner still visible after dismissal attempt')
    // Try one more time with force click
    try {
      await page
        .locator('[data-testid="cookie-banner"]')
        .click({ force: true, position: { x: 0, y: 0 } })
    } catch {
      // Last resort - reload page with consent set
      await page.reload()
    }
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
