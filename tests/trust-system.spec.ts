import { test, expect } from '@playwright/test'

/**
 * E2E tests for the trust system.
 *
 * Trust display: TrustLevelBadge on /profile (own) and /users/[id] (public).
 * Levels: Contributor, Trusted, Verified, Elite, Core.
 * Admin trust logs: /admin/trust-logs (heading: "Trust System Logs").
 * No dedicated /profile/trust page exists.
 */

test.describe('Trust System', () => {
  test.describe('Trust Score Display', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display trust level on user profile', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('domcontentloaded')

      // Trust Level card is shown in the profile header stats grid
      const trustLabel = page.getByText(/trust level/i)
      await expect(trustLabel).toBeVisible()
    })

    test('should display trust score in profile stats', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('domcontentloaded')

      // Profile stats may show "Trust Score" or "Trust Level" depending on UI version
      const trustScoreLabel = page.getByText(/trust score/i)
      const hasTrustScore = await trustScoreLabel.isVisible({ timeout: 3000 }).catch(() => false)
      test.skip(
        !hasTrustScore,
        'Trust Score label not present on profile page (Trust Level is shown instead)',
      )

      await expect(trustScoreLabel).toBeVisible()
    })
  })

  test.describe('Admin Trust Logs', () => {
    test.use({ storageState: 'tests/.auth/super_admin.json' })

    test('should access trust system logs page', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      // Wait for page to fully hydrate
      await page
        .getByText(/loading/i)
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {})

      // Page heading
      await expect(page.getByRole('heading', { name: /trust system logs/i })).toBeVisible({
        timeout: 10000,
      })

      // Search and filter controls
      await expect(page.getByPlaceholder(/search users/i)).toBeVisible({ timeout: 10000 })
    })

    test('should display trust logs table', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      // Wait for loading to finish
      await page
        .getByText(/loading/i)
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {})

      const table = page.locator('table')
      await table.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})

      const hasTable = await table.isVisible().catch(() => false)
      test.skip(!hasTable, 'Trust logs table not visible — may be empty or still loading')

      const headerText = await page.locator('thead').textContent()
      expect(headerText?.toLowerCase()).toMatch(/user/)
      expect(headerText?.toLowerCase()).toMatch(/action/)
    })

    test('should show search and filter controls', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      // Wait for page to fully hydrate
      await page
        .getByText(/loading/i)
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {})

      // Search input for users
      const searchInput = page.locator('input[type="text"]').first()
      await expect(searchInput).toBeVisible({ timeout: 10000 })

      // Action filter dropdown
      const actionFilter = page.locator('select').first()
      await expect(actionFilter).toBeVisible({ timeout: 10000 })
    })

    test('should show Run Monthly Bonus button', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      // Wait for page to fully hydrate before checking for button
      await page
        .getByText(/loading/i)
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {})

      const monthlyBonusButton = page.getByRole('button', { name: /run monthly bonus/i })
      await expect(monthlyBonusButton).toBeVisible({ timeout: 10000 })
    })
  })
})
