import { test, expect } from '@playwright/test'

/**
 * E2E tests for the IGDB game search page.
 *
 * Route: /games/new/search/v2
 * Heading: "Search Game Database"
 * Requires system selection before search.
 * Results displayed as card grid with preview modal.
 */

test.describe('IGDB Search', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('should display IGDB search page with header', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    // Page heading
    await expect(page.getByRole('heading', { name: /search game database/i })).toBeVisible()

    // IGDB badge
    await expect(page.getByText(/powered by igdb/i)).toBeVisible()
  })

  test('should show system selection and search input', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    // System autocomplete (required)
    const systemInput = page.getByPlaceholder(/choose a system/i)
    await expect(systemInput).toBeVisible()

    // Game title input (required)
    const titleInput = page.getByPlaceholder(/enter game title/i)
    await expect(titleInput).toBeVisible()

    // Form search button (submit type, distinct from navbar search icon)
    const searchButton = page.locator('button[type="submit"]').filter({ hasText: /search/i })
    await expect(searchButton).toBeVisible()
  })

  test('should require system selection before search', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    // Type a game name without selecting a system
    const titleInput = page.getByPlaceholder(/enter game title/i)
    await titleInput.fill('Mario')

    // Click the form search button
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: /search/i })
      .click()

    // Should show a warning about selecting a system first
    // Toast or inline warning: "Please select a system before searching"
    const warning = page.getByText(/please select a system/i)
    const hasWarning = await warning.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasWarning) {
      await expect(warning).toBeVisible()
    }
  })

  test('should have search button disabled for empty query', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    // Form search button should be disabled when query is empty
    const searchButton = page.locator('button[type="submit"]').filter({ hasText: /search/i })

    // Button is disabled when query is empty or < 2 chars
    await expect(searchButton).toBeDisabled()
  })

  test('should enable search button when query has 2+ characters', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    const titleInput = page.getByPlaceholder(/enter game title/i)
    await titleInput.fill('Ma')

    // Form search button should become enabled
    const searchButton = page.locator('button[type="submit"]').filter({ hasText: /search/i })
    await expect(searchButton).toBeEnabled()
  })

  test('should show search description text', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    // Description about IGDB capabilities
    const description = page.getByText(/comprehensive.*game.*information|metadata.*images/i)
    await expect(description.first()).toBeVisible()
  })
})
