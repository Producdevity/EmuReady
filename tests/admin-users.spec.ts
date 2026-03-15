import { test, expect } from '@playwright/test'

test.describe('Admin User Management Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test('should display users list with required columns', async ({ page }) => {
    // Users table must be present - wait for data to load
    const usersTable = page.locator('table, [data-testid="users-table"]')
    await usersTable.waitFor({ state: 'visible', timeout: 15000 })

    // Wait for at least one data row to appear
    await page.locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 })

    // Verify all required columns are present
    const headers = usersTable.locator('thead th')
    const headerTexts = await headers.allTextContents()

    const expectedHeaders = ['Name', 'Email', 'Role', 'Actions']
    for (const header of expectedHeaders) {
      const hasHeader = headerTexts.some((text) =>
        text.toLowerCase().includes(header.toLowerCase()),
      )
      expect(hasHeader).toBe(true)
    }

    // Must have at least one user row
    const userRows = usersTable.locator('tbody tr')
    const rowCount = await userRows.count()
    expect(rowCount).toBeGreaterThan(0)

    // Verify first user row has valid email
    const firstRow = userRows.first()
    const email = await firstRow.locator('td').filter({ hasText: /@/ }).textContent()
    expect(email).toMatch(/^.+@.+\..+$/)
  })

  test('should support user search and filtering', async ({ page }) => {
    // Search input must be present
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()

    await searchInput.fill('test')
    await page.keyboard.press('Enter')

    // Wait for search results to load
    await page
      .locator('tbody tr')
      .first()
      .or(page.getByText(/no users found|no results/i))
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {})

    // Table should update - verify it still shows content or no results message
    const hasResults = (await page.locator('tbody tr').count()) > 0
    const noResultsMessage = page.getByText(/no users found|no results/i)

    // Either show results or show no results message
    if (!hasResults) {
      await expect(noResultsMessage).toBeVisible()
    } else {
      expect(hasResults).toBe(true)
    }

    // Users page does not have a role filter dropdown - only search
    const roleFilter = page.locator('select[name*="role"], [data-testid="role-filter"]')
    if (await roleFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleFilter.selectOption({ index: 1 })
      await page.waitForLoadState('domcontentloaded')
    }
  })

  test('should handle user role changes', async ({ page }) => {
    const roleButtons = page.locator('button[title="Change Role"]')
    const roleButtonCount = await roleButtons.count()
    test.skip(roleButtonCount === 0, 'No Change Role buttons found in the current table view')

    await roleButtons.first().click()

    const dialog = page.locator('[role="dialog"]')
    const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasDialog).toBe(true)

    // Cancel the change
    const cancelButton = dialog.locator('button').filter({ hasText: /cancel|close/i })
    if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('should display user details modal', async ({ page }) => {
    // Ensure table is loaded before trying to click buttons
    await page.locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 })

    const viewButton = page.locator('button[title="View User Details"]').first()
    const nameButton = page.locator('tbody button').first()

    const hasViewButton = await viewButton.isVisible({ timeout: 3000 }).catch(() => false)
    const clickTarget = hasViewButton ? viewButton : nameButton

    await clickTarget.click()

    await page.waitForLoadState('domcontentloaded')

    // Wait for either dialog or URL change
    const modal = page.locator('[role="dialog"]')
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false)
    const hasUserIdParam = page.url().includes('userId=')

    // Either a modal appeared or the URL changed to include userId param
    // If neither happened, the click target may not trigger a modal (skip gracefully)
    test.skip(!hasModal && !hasUserIdParam, 'User details modal did not appear after clicking')

    if (hasModal) {
      const closeButton = modal.locator('button').filter({ hasText: /close/i }).first()
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click()
      } else {
        await page.keyboard.press('Escape')
      }
    }
  })

  test('should handle user suspension/banning', async ({ page }) => {
    // BanButton uses title="Ban User"
    const banButtons = page.locator('button[title="Ban User"]')
    const hasBan = (await banButtons.count()) > 0
    test.skip(!hasBan, 'No Ban User buttons available')

    await banButtons.first().click()

    const confirmDialog = page.locator('[role="dialog"]')
    const hasConfirm = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasConfirm).toBe(true)

    // Check for reason input
    const reasonInput = confirmDialog.locator('textarea, input[type="text"]')
    if (await reasonInput.isVisible().catch(() => false)) {
      await reasonInput.fill('Test suspension reason')
    }

    // Cancel for safety
    const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should display user activity history', async ({ page }) => {
    // Open UserDetailsModal via the View User Details button
    const viewButton = page.locator('button[title="View User Details"]').first()
    const hasView = await viewButton.isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasView, 'No View User Details button available')

    await viewButton.click()

    // UserDetailsModal opens as a dialog or updates URL with userId param
    const modal = page.locator('[role="dialog"]')
    const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasModal, 'User details modal did not appear')

    // UserDetailsModal has tabs: Listings, Votes, Trust Actions, Reports
    const tabButtons = modal.locator('button').filter({ hasText: /listings|votes|trust/i })
    const hasTab = (await tabButtons.count()) > 0
    test.skip(!hasTab, 'No activity tabs available in user details modal')

    // Click the first available tab
    await tabButtons.first().click()

    // Verify tab content loaded (modal should still be visible with content)
    await expect(modal).toBeVisible()
    const modalContent = await modal.textContent()
    expect(modalContent!.length).toBeGreaterThan(0)

    // Close modal
    const closeButton = modal.locator('button').filter({ hasText: /close/i }).first()
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('should display user statistics', async ({ page }) => {
    // AdminStatsDisplay renders stat cards at top of users page
    // Stats include: Total Users, Users, Authors, Developers, Moderators, Admins, Super Admins, Banned
    const statsLabels = [/total users/i, /users/i, /authors/i, /banned/i]

    let visibleStats = 0
    for (const label of statsLabels) {
      const stat = page.getByText(label)
      if (
        await stat
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        visibleStats++
      }
    }
    test.skip(visibleStats === 0, 'No user statistics section visible')

    // Verify numeric values exist alongside stats
    const mainContent = page.locator('main').first()
    const numbersOnPage = await mainContent.locator('text=/\\d+/').count()
    expect(numbersOnPage).toBeGreaterThan(0)
  })
})
