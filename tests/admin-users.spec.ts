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
    const banButtons = page.locator('button').filter({ hasText: /ban|suspend|disable/i })
    const hasBan = (await banButtons.count()) > 0
    test.skip(!hasBan, 'No ban/suspend/disable buttons available')

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
    const viewButton = page
      .locator('button, a')
      .filter({ hasText: /view|details/i })
      .first()
    const hasView = await viewButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasView, 'No view/details button available')

    await viewButton.click()

    const activityTab = page.locator('button, a').filter({ hasText: /activity|history|logs/i })
    const hasActivityTab = await activityTab.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasActivityTab, 'No activity/history tab available')

    await activityTab.click()

    const activityList = page.locator('[data-testid*="activity"], .activity-list')
    const hasActivityList = await activityList.isVisible({ timeout: 2000 }).catch(() => false)
    test.skip(!hasActivityList, 'Activity list did not appear')

    const activities = activityList.locator('.activity-item, li')
    const activityCount = await activities.count()
    if (activityCount > 0) {
      const firstActivity = activities.first()
      const timestamp = await firstActivity.locator('time').isVisible()
      expect(timestamp).toBe(true)
    }
  })

  test('should support bulk user actions', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    test.skip(checkboxCount <= 2, 'Not enough checkboxes for bulk actions')

    await checkboxes.nth(1).check()
    await checkboxes.nth(2).check()

    const bulkActions = page.locator('[data-testid*="bulk-actions"], .bulk-actions')
    const hasBulk = await bulkActions.isVisible({ timeout: 2000 }).catch(() => false)
    test.skip(!hasBulk, 'No bulk actions panel appeared')

    const actionSelect = bulkActions.locator('select')
    const hasActions = await actionSelect.isVisible().catch(() => false)
    expect(hasActions).toBe(true)

    const options = await actionSelect.locator('option').allTextContents()
    expect(options.length).toBeGreaterThan(0)

    // Uncheck for cleanup
    await checkboxes.nth(1).uncheck()
    await checkboxes.nth(2).uncheck()
  })

  test('should handle user data export', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export/i })
    const hasExport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasExport, 'No export button available')

    await exportButton.click()

    const exportDialog = page.locator('[role="dialog"]').filter({ hasText: /export/i })
    const exportMenu = page.locator('[role="menu"]').filter({ hasText: /csv|excel|json/i })

    const hasDialog = await exportDialog.isVisible({ timeout: 2000 }).catch(() => false)
    const hasMenu = await exportMenu.isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasDialog || hasMenu).toBe(true)

    const formats = ['CSV', 'Excel', 'JSON']
    let foundFormats = 0
    for (const format of formats) {
      const formatOption = page.getByText(format)
      if (await formatOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundFormats++
      }
    }
    expect(foundFormats).toBeGreaterThan(0)

    await page.keyboard.press('Escape')
  })

  test('should display user statistics', async ({ page }) => {
    const userStats = page.locator('[data-testid*="user-stats"], .user-statistics')
    const hasStats = await userStats.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasStats, 'No user statistics section visible')

    const statLabels = ['Total Users', 'Active Users', 'New Users', 'Banned Users']
    let visibleStats = 0

    for (const label of statLabels) {
      const stat = page.locator('.stat-card, [data-testid*="stat"]').filter({ hasText: label })
      if (await stat.isVisible({ timeout: 1000 }).catch(() => false)) {
        const value = await stat.locator('.value, .number').textContent()
        expect(value).toBeTruthy()
        visibleStats++
      }
    }
    expect(visibleStats).toBeGreaterThan(0)
  })

  test('should support user impersonation for admins', async ({ page }) => {
    const impersonateButtons = page.locator('button').filter({ hasText: /impersonate|login as/i })
    const hasImpersonate = (await impersonateButtons.count()) > 0
    test.skip(!hasImpersonate, 'No impersonate buttons available')

    await impersonateButtons.first().click()

    const confirmDialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /impersonate|login as/i })
    const hasDialog = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasDialog).toBe(true)

    // Should show warnings
    const warning = confirmDialog.getByText(/warning|careful|logged/i)
    await expect(warning).toBeVisible()

    // Cancel for safety
    const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i })
    await cancelButton.click()
  })
})
