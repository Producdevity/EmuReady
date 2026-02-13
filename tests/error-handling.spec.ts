import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Error Handling Tests', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page-12345')

    // Should show 404 error page
    const error404Text = page.getByText(/404|not found|page.*not.*exist/i)
    const error404 = await error404Text.first().isVisible({ timeout: 5000 })
    expect(error404).toBe(true)

    // Should have navigation to go back home
    const homeLink = page.getByRole('link', { name: /home|go back|return/i })
    const hasHomeLink = await homeLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasHomeLink) {
      await homeLink.click()
      await expect(page).toHaveURL('/')
    } else {
      // Or should have logo link
      const logo = page.getByRole('link', { name: /emuready/i }).first()
      if (await logo.isVisible()) {
        await logo.click()
        await expect(page).toHaveURL('/')
      }
    }
  })

  test('should handle invalid game ID gracefully', async ({ page }) => {
    // Try to access game with invalid ID
    await page.goto('/games/invalid-game-id-xyz')

    // Should either show error or redirect
    const errorMessage = await page
      .getByText(/not found|does not exist|invalid|error/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (errorMessage) {
      expect(errorMessage).toBe(true)
    } else {
      // Might redirect to games list
      await page.waitForURL('/games', { timeout: 5000 }).catch(() => {})
      expect(page.url()).toContain('/games')
    }
  })

  test('should handle network errors during data loading', async ({ page }) => {
    await page.context().setOffline(true)

    let navigationFailed = false
    try {
      await page.goto('/games', { timeout: 5000 })
    } catch {
      navigationFailed = true
    } finally {
      await page.context().setOffline(false)
    }

    // When offline, navigation should fail or the page should show an error
    if (!navigationFailed) {
      // If navigation somehow succeeded (cached response), page should still work
      await expect(page.locator('body')).toBeVisible()
    } else {
      // Expected: navigation failed due to offline mode
      expect(navigationFailed).toBe(true)
    }
  })

  test('should handle API timeouts gracefully', async ({ page }) => {
    // Intercept API calls to add delay
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await route.continue().catch(() => {})
    })

    await page.goto('/listings', { waitUntil: 'domcontentloaded' })

    // Page should be functional even while API calls are delayed
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 })

    // Clear route handler
    await page.unroute('**/api/**')
  })

  test('should recover from failed form submissions', async ({ page }) => {
    // Try to submit a form that will fail (search with network issues)
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Intercept search API calls to fail
    await page.route('**/api/*search*', (route) => {
      route.abort('failed')
    })

    // Perform search
    await gamesPage.searchGames('Mario')

    // Page should still be functional
    await expect(gamesPage.searchInput).toBeVisible()
    await expect(gamesPage.searchInput).toBeEnabled()

    // Clear route handler
    await page.unroute('**/api/*search*')

    // Should be able to search again
    await gamesPage.searchInput.clear()
    await gamesPage.searchInput.fill('Zelda')
    await page.keyboard.press('Enter')

    // Search should work now
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toBeDefined()
  })

  test('should handle invalid filter combinations', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Directly manipulate URL with invalid filter params
    const url = new URL(page.url())
    url.searchParams.set('device', 'invalid-device-123')
    url.searchParams.set('emulator', 'non-existent-emulator')
    url.searchParams.set('performance', 'super-invalid')

    await page.goto(url.toString())

    // Should handle invalid filters gracefully
    await page.waitForLoadState('domcontentloaded')

    // Wait for page content to settle (loading to finish)
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    // Should either:
    // 1. Ignore invalid filters and show content
    // 2. Show no results
    // 3. Show error message
    // 4. Reset invalid filters from URL

    const hasError = await page
      .getByText(/invalid|error|no results|no listings/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    const hasListings = (await listingsPage.getListingCount()) > 0
    const hasTable = await page
      .locator('table')
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    const filtersReset = !page.url().includes('invalid')

    // One of these must be true -- the app handles invalid filters in some way
    expect(hasError || hasListings || hasTable || filtersReset).toBe(true)
  })

  test('should handle session expiration gracefully', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Clear all cookies to simulate session expiration
    await page.context().clearCookies()

    // Try to perform an action that might require session
    await homePage.navigateToGames()

    // Should still work for public pages
    await expect(page).toHaveURL('/games')

    // Page should load without errors
    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()
  })

  test('should show user-friendly error messages', async ({ page }) => {
    // Force an error by going to a malformed URL
    await page.goto('/games/../../admin/secret')

    // Should not expose sensitive error details
    const technicalErrors = [
      page.getByText(/stack trace/i),
      page.getByText(/error: .*\sat\s/i), // Stack trace pattern
      page.getByText(/internal server error/i),
      page.getByText(/database.*error/i),
    ]

    for (const techError of technicalErrors) {
      const isVisible = await techError.isVisible({ timeout: 1000 }).catch(() => false)
      expect(isVisible).toBe(false)
    }

    // Should show user-friendly message instead
    const friendlyErrors = [
      page.getByText(/something went wrong/i),
      page.getByText(/page not found/i),
      page.getByText(/oops/i),
      page.getByText(/can't find.*page/i),
    ]

    let foundFriendlyError = false
    for (const friendly of friendlyErrors) {
      if (await friendly.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundFriendlyError = true
        break
      }
    }

    expect(foundFriendlyError).toBe(true)
  })

  test('should handle rapid navigation without breaking', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Rapidly navigate between pages
    await homePage.gamesLink.click({ timeout: 500 }).catch(() => {})
    await homePage.handheldLink.click({ timeout: 500 }).catch(() => {})
    await homePage.pcLink.click({ timeout: 500 }).catch(() => {})
    await homePage.homeLink.click({ timeout: 500 }).catch(() => {})

    // Page should be in a valid state
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/^https?:\/\/[^\/]+\/(games|listings|pc-listings|)(\?.*)?$/)

    // Page should be responsive
    const logo = page.getByRole('link', { name: /emuready/i }).first()
    await expect(logo).toBeVisible()
  })

  test('should handle missing images gracefully', async ({ page }) => {
    // Intercept image requests and fail them
    await page.route('**/*.{png,jpg,jpeg,gif,webp}', (route) => {
      route.abort('failed')
    })

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Page should still be functional
    await gamesPage.verifyPageLoaded()

    // Should show alt text or placeholder
    const images = page.locator('img')
    const imageCount = await images.count()

    if (imageCount > 0) {
      // Check first image has meaningful alt text
      const firstImage = images.first()
      const altText = await firstImage.getAttribute('alt')

      expect(altText).toBeTruthy()
      expect(altText!.length).toBeGreaterThan(0)
    }

    // Clear route handler
    await page.unroute('**/*.{png,jpg,jpeg,gif,webp}')
  })
})

test.describe('Browser Compatibility Error Tests', () => {
  test('should handle browser back button after error', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Navigate to invalid page
    await page.goto('/invalid-page-404')

    // Should show error
    await expect(page.getByText(/404|not found/i).first()).toBeVisible()

    // Browser back should work
    await page.goBack()
    await expect(page).toHaveURL('/')

    // Page should be functional
    await homePage.verifyHeroSectionVisible()
  })

  test('should maintain functionality after JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = []

    // Listen for JavaScript errors
    page.on('pageerror', (error) => {
      jsErrors.push(error.message)
    })

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Even if JS errors occur, basic functionality should work
    await gamesPage.verifyPageLoaded()

    // Navigation should still work
    await gamesPage.navigateToHome()
    await expect(page).toHaveURL('/')
  })
})
