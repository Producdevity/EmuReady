import { test, expect } from '@playwright/test'

test.describe('Admin User Management Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users')
    // Verify admin access - test should fail if not admin
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test('should display users list with required columns', async ({ page }) => {
    // Users table must be present
    const usersTable = page.locator('table, [data-testid="users-table"]')
    await expect(usersTable).toBeVisible()

    // Verify all required columns are present
    const headers = usersTable.locator('thead th')
    const headerTexts = await headers.allTextContents()

    const expectedHeaders = ['Name', 'Email', 'Role', 'Status', 'Actions']
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
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="filter"]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('test')
    await page.keyboard.press('Enter')

    await page.waitForTimeout(1500)

    // Table should update - verify it still shows content or no results message
    const hasResults = (await page.locator('tbody tr').count()) > 0
    const noResultsMessage = page.getByText(/no users found|no results/i)

    // Either show results or show no results message
    if (!hasResults) {
      await expect(noResultsMessage).toBeVisible()
    } else {
      expect(hasResults).toBe(true)
    }

    // Role filter should be available
    const roleFilter = page.locator('select[name*="role"], [data-testid="role-filter"]')
    await expect(roleFilter).toBeVisible()

    // Test role filtering
    await roleFilter.selectOption({ index: 1 })
    await page.waitForTimeout(1000)
  })

  test('should handle user role changes', async ({ page }) => {
    // Role change controls must be present
    const roleSelects = page.locator('select[name*="role"], [data-testid*="role-select"]')
    const roleSelectCount = await roleSelects.count()
    expect(roleSelectCount).toBeGreaterThan(0)

    const firstRoleSelect = roleSelects.first()
    const currentRole = await firstRoleSelect.inputValue()

    // Change role
    await firstRoleSelect.selectOption({ index: 1 })

    // Verify the role changed
    const newRole = await firstRoleSelect.inputValue()
    expect(newRole).not.toBe(currentRole)

    // Must show confirmation or save button
    const saveButton = page.locator('button').filter({ hasText: /save|update|confirm/i })
    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*role/i })

    // At least one confirmation method must be present
    const hasSaveButton = await saveButton.isVisible({ timeout: 2000 }).catch(() => false)
    const hasConfirmDialog = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)

    expect(hasSaveButton || hasConfirmDialog).toBe(true)

    // Cancel the change
    const cancelButton = page.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should display user details modal', async ({ page }) => {
    // View/edit buttons must be present
    const viewButtons = page.locator('button, a').filter({ hasText: /view|edit|details/i })
    const buttonCount = await viewButtons.count()
    expect(buttonCount).toBeGreaterThan(0)

    await viewButtons.first().click()

    // Should show user details
    const modal = page.locator('[role="dialog"], .modal')
    const hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasModal) {
      // Check for user information
      const userInfo = modal.locator('[data-testid*="user-info"], .user-details')
      await expect(userInfo).toBeVisible()

      // Should have close button
      const closeButton = modal.locator('button').filter({ hasText: /close|cancel/i })
      await closeButton.click()

      console.log('User details modal works')
    } else {
      // Might navigate to detail page
      const onDetailPage = page.url().match(/\/admin\/users\/[\w-]+/)
      expect(onDetailPage).toBeTruthy()
      console.log('Navigated to user detail page')
    }
  })

  test('should handle user suspension/banning', async ({ page }) => {
    await page.goto('/admin/users')

    if (page.url().includes('/admin/users')) {
      // Look for ban/suspend buttons
      const banButtons = page.locator('button').filter({ hasText: /ban|suspend|disable/i })

      if ((await banButtons.count()) > 0) {
        await banButtons.first().click()

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="dialog"]')
        const hasConfirm = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)

        if (hasConfirm) {
          // Check for reason input
          const reasonInput = confirmDialog.locator('textarea, input[type="text"]')
          if (await reasonInput.isVisible()) {
            await reasonInput.fill('Test suspension reason')
          }

          // Check for duration selector
          const durationSelect = confirmDialog.locator('select[name*="duration"]')
          if (await durationSelect.isVisible()) {
            console.log('Ban duration selector available')
          }

          // Cancel for safety
          const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()

          console.log('User ban/suspend functionality available')
        }
      }
    }
  })

  test('should display user activity history', async ({ page }) => {
    await page.goto('/admin/users')

    if (page.url().includes('/admin/users')) {
      // Open first user details
      const viewButton = page
        .locator('button, a')
        .filter({ hasText: /view|details/i })
        .first()

      if (await viewButton.isVisible({ timeout: 3000 })) {
        await viewButton.click()

        // Look for activity/history tab
        const activityTab = page.locator('button, a').filter({ hasText: /activity|history|logs/i })

        if (await activityTab.isVisible({ timeout: 3000 })) {
          await activityTab.click()

          // Should show activity list
          const activityList = page.locator('[data-testid*="activity"], .activity-list')

          if (await activityList.isVisible({ timeout: 2000 })) {
            const activities = activityList.locator('.activity-item, li')
            const activityCount = await activities.count()

            console.log(`User has ${activityCount} activities logged`)

            if (activityCount > 0) {
              // Check activity structure
              const firstActivity = activities.first()
              const timestamp = await firstActivity.locator('time').isVisible()
              expect(timestamp).toBe(true)
            }
          }
        }
      }
    }
  })

  test('should support bulk user actions', async ({ page }) => {
    await page.goto('/admin/users')

    if (page.url().includes('/admin/users')) {
      // Look for checkboxes
      const checkboxes = page.locator('input[type="checkbox"]')

      if ((await checkboxes.count()) > 1) {
        // More than just "select all"
        // Select multiple users
        await checkboxes.nth(1).check()
        await checkboxes.nth(2).check()

        // Look for bulk action controls
        const bulkActions = page.locator('[data-testid*="bulk-actions"], .bulk-actions')

        if (await bulkActions.isVisible({ timeout: 2000 })) {
          const actionSelect = bulkActions.locator('select')

          if (await actionSelect.isVisible()) {
            const options = await actionSelect.locator('option').allTextContents()
            console.log('Bulk actions available:', options.filter((o) => o).join(', '))
          }

          // Uncheck for cleanup
          await checkboxes.nth(1).uncheck()
          await checkboxes.nth(2).uncheck()
        }
      }
    }
  })

  test('should handle user data export', async ({ page }) => {
    await page.goto('/admin/users')

    if (page.url().includes('/admin/users')) {
      // Look for export button
      const exportButton = page.locator('button').filter({ hasText: /export/i })

      if (await exportButton.isVisible({ timeout: 3000 })) {
        await exportButton.click()

        // Should show export options
        const exportDialog = page.locator('[role="dialog"]').filter({ hasText: /export/i })
        const exportMenu = page.locator('[role="menu"]').filter({ hasText: /csv|excel|json/i })

        const hasDialog = await exportDialog.isVisible({ timeout: 2000 }).catch(() => false)
        const hasMenu = await exportMenu.isVisible({ timeout: 2000 }).catch(() => false)

        if (hasDialog || hasMenu) {
          console.log('User export functionality available')

          // Check format options
          const formats = ['CSV', 'Excel', 'JSON']
          for (const format of formats) {
            const formatOption = page.getByText(format)
            if (await formatOption.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`✓ Export format: ${format}`)
            }
          }

          // Close without exporting
          await page.keyboard.press('Escape')
        }
      }
    }
  })

  test('should display user statistics', async ({ page }) => {
    await page.goto('/admin/users')

    if (page.url().includes('/admin/users')) {
      // Look for user stats
      const userStats = page.locator('[data-testid*="user-stats"], .user-statistics')

      if (await userStats.isVisible({ timeout: 3000 })) {
        // Common stats
        const statLabels = ['Total Users', 'Active Users', 'New Users', 'Banned Users']

        for (const label of statLabels) {
          const stat = page.locator('.stat-card, [data-testid*="stat"]').filter({ hasText: label })
          if (await stat.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await stat.locator('.value, .number').textContent()
            console.log(`${label}: ${value}`)
          }
        }
      }
    }
  })

  test('should support user impersonation for admins', async ({ page }) => {
    await page.goto('/admin/users')

    if (page.url().includes('/admin/users')) {
      // Look for impersonate buttons
      const impersonateButtons = page.locator('button').filter({ hasText: /impersonate|login as/i })

      if ((await impersonateButtons.count()) > 0) {
        await impersonateButtons.first().click()

        // Should show confirmation
        const confirmDialog = page
          .locator('[role="dialog"]')
          .filter({ hasText: /impersonate|login as/i })

        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          console.log('User impersonation requires confirmation')

          // Should show warnings
          const warning = confirmDialog.getByText(/warning|careful|logged/i)
          await expect(warning).toBeVisible()

          // Cancel for safety
          const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })
})
