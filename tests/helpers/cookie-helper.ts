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
      localStorage.setItem(`${PREFIX}cookie_consent_date`, new Date().toISOString())
    })
  } catch {
    // Ignore if localStorage is not available
  }

  // Wait for page to be ready before checking cookie banner
  await page.waitForLoadState('domcontentloaded')

  // Try to dismiss cookie banner if it appears
  await cookieBanner.dismissIfPresent()

  // Double-check it's gone
  const stillVisible = await cookieBanner.isVisible()
  if (stillVisible) {
    console.warn('Cookie banner still visible after dismissal attempt')
    try {
      await page.getByLabel('Close cookie banner').click({ force: true })
    } catch {
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
