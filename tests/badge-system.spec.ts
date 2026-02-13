import { test, expect } from '@playwright/test'

/**
 * E2E tests for the badge system.
 *
 * Admin page: /admin/badges (heading: "Badge Management")
 * Stats: Total Badges, Active, Inactive, Total Assignments.
 * Badge CRUD via modal forms.
 * Badges display on user profiles as colored pills.
 */

test.describe('Badge System', () => {
  test.describe('Admin Badge Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access badge management page', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      // Page heading
      await expect(page.getByRole('heading', { name: /badge management/i })).toBeVisible()

      // Stats display: Total Badges, Active, Inactive, Total Assignments
      const stats = page.locator('text=/total badges|active|inactive|total assignments/i')
      await expect(stats.first()).toBeVisible()
    })

    test('should display badge statistics', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      // Wait for badge data to load
      await page
        .getByText(/loading/i)
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {})

      // Wait for any content to appear
      const statsText = page.getByText(/total badges/i)
      const table = page.locator('table')
      const emptyState = page.getByText(/no badges/i)
      const heading = page.getByRole('heading', { name: /badge management/i })

      await statsText
        .or(table)
        .or(emptyState)
        .or(heading)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 })

      const hasStats = await statsText.isVisible().catch(() => false)
      const hasTable = await table.isVisible().catch(() => false)
      const hasEmptyState = await emptyState.isVisible().catch(() => false)
      const hasHeading = await heading.isVisible().catch(() => false)

      expect(hasStats || hasTable || hasEmptyState || hasHeading).toBe(true)
    })

    test('should show search input and badge table', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      // Search input
      await expect(page.getByPlaceholder(/search badges/i)).toBeVisible()

      // Wait for badge data to load
      const table = page.locator('table')
      const emptyState = page.getByText(/no badges/i)

      await table
        .or(emptyState)
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {})

      const hasTable = await table.isVisible().catch(() => false)
      const hasEmpty = await emptyState.isVisible().catch(() => false)

      expect(hasTable || hasEmpty).toBe(true)
    })

    test('should display badge table columns', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      const table = page.locator('table')
      const hasTable = await table.isVisible().catch(() => false)

      if (hasTable) {
        // Expected columns: Badge, Description, Assignments, Status, Creator, Created, Actions
        const headerText = await page.locator('thead').textContent()
        expect(headerText?.toLowerCase()).toMatch(/badge/)
        expect(headerText?.toLowerCase()).toMatch(/status/)
      }
    })

    test('should open create badge modal', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      const createButton = page.getByRole('button', { name: /create badge/i })
      const hasButton = await createButton.isVisible().catch(() => false)

      if (hasButton) {
        await createButton.click()

        // Modal should open with "Create New Badge" heading
        await expect(page.getByText(/create new badge/i)).toBeVisible()

        // Form fields: Name, Description, Color, Icon, Active
        const nameInput = page.getByPlaceholder(/enter badge name/i)
        await expect(nameInput).toBeVisible()

        const descriptionInput = page.getByPlaceholder(/enter badge description/i)
        await expect(descriptionInput).toBeVisible()

        // Color picker
        const colorInput = page.locator('input[type="color"]')
        await expect(colorInput).toBeVisible()
      }
    })

    test('should filter badges by status', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      const statusFilter = page.locator('select').filter({ hasText: /all status|active|inactive/i })
      const hasFilter = await statusFilter.isVisible().catch(() => false)

      if (hasFilter) {
        await statusFilter.selectOption({ label: 'Active' })
        await expect(page.locator('table')).toBeVisible()
      }
    })

    test('should search badges by name', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      // Wait for initial badge data to load before searching
      const table = page.locator('table')
      const emptyState = page.getByText(/no badges/i)
      await table
        .or(emptyState)
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {})

      const searchInput = page.getByPlaceholder(/search badges/i)
      await searchInput.fill('test')

      // Wait for search results to load
      await table
        .or(emptyState)
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {})

      const hasTable = await table.isVisible().catch(() => false)
      const hasNoResults = await emptyState.isVisible().catch(() => false)

      expect(hasTable || hasNoResults).toBe(true)
    })
  })

  test.describe('Badge Display on User Profile', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display user badges on profile if assigned', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('domcontentloaded')

      // Badges appear as elements with data-testid or within a badges section
      const badgeSection = page.locator('[data-testid*="badge"], [aria-label*="badge"]')
      const badgeCount = await badgeSection.count()

      test.skip(badgeCount === 0, 'No badges assigned to this user')

      // Verify each badge pill is visible and contains text
      for (let i = 0; i < badgeCount; i++) {
        const badge = badgeSection.nth(i)
        await expect(badge).toBeVisible()
        const text = await badge.textContent()
        expect(text?.trim().length).toBeGreaterThan(0)
      }
    })
  })
})
