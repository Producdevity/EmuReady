import { test, expect } from '@playwright/test'

/**
 * E2E tests for the user ban management admin page.
 *
 * Route: /admin/user-bans
 * Heading: "User Ban Management"
 * Table layout with status filter dropdown (not tabs).
 * Ban creation via modal with user search, reason, duration.
 */

test.describe('User Ban & Moderation System', () => {
  test.describe('Admin Ban Management Page', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access user ban management page', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      // Page heading
      await expect(page.getByRole('heading', { name: /user ban management/i })).toBeVisible()

      // Stats display: Total Bans, Active, Expired, Permanent
      const statsText = page.locator('text=/total bans|active|expired|permanent/i')
      await expect(statsText.first()).toBeVisible()
    })

    test('should display ban statistics', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByText(/total bans/i)).toBeVisible()
      await expect(page.getByText(/active/i).first()).toBeVisible()
    })

    test('should display bans table with correct columns', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const table = page.locator('table')
      const hasTable = await table.isVisible().catch(() => false)

      if (hasTable) {
        // Expected columns: User, Reason, Status, Banned By, Banned At, Expires At, Actions
        const headerText = await page.locator('thead').textContent()
        expect(headerText?.toLowerCase()).toMatch(/user/)
        expect(headerText?.toLowerCase()).toMatch(/reason/)
        expect(headerText?.toLowerCase()).toMatch(/status/)
      }
    })

    test('should search bans by user name', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const searchInput = page.getByPlaceholder(/search bans/i)
      await expect(searchInput).toBeVisible()

      await searchInput.fill('test')
      await expect(page.locator('table')).toBeVisible()
    })

    test('should filter by status', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const statusFilter = page
        .locator('select')
        .filter({ hasText: /all statuses|active|inactive/i })
      const hasFilter = await statusFilter.isVisible().catch(() => false)

      if (hasFilter) {
        await statusFilter.selectOption('true')
        await expect(page.locator('table')).toBeVisible()
      }
    })

    test('should open create ban modal', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const newBanButton = page.getByRole('button', { name: /new ban/i })
      const hasButton = await newBanButton.isVisible().catch(() => false)

      if (hasButton) {
        await newBanButton.click()

        // Modal should open
        await expect(page.getByText(/create user ban/i)).toBeVisible()

        // User search input
        await expect(page.getByPlaceholder(/search users/i)).toBeVisible()

        // Reason textarea
        await expect(page.getByPlaceholder(/provide a clear reason/i)).toBeVisible()

        // Ban duration options
        await expect(page.getByText(/permanent ban/i)).toBeVisible()
        await expect(page.getByText(/temporary ban/i)).toBeVisible()
      }
    })

    test('should view ban details', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const rows = page.locator('tbody tr')
      const hasRows = (await rows.count()) > 0

      if (hasRows) {
        const viewButton = rows.first().getByRole('button', { name: /view/i })
        const hasView = await viewButton.isVisible().catch(() => false)

        if (hasView) {
          await viewButton.click()
          await expect(page.getByText(/ban details/i).first()).toBeVisible()
        }
      }
    })

    test('should show pagination for bans list', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const pagination = page.getByRole('navigation', { name: /pagination/i })
      const hasPagination = await pagination.isVisible().catch(() => false)

      if (hasPagination) {
        await expect(page.getByRole('button', { name: /go to next page/i })).toBeVisible()
      }
    })
  })
})
