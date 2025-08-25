import { test, expect } from '@playwright/test'

test.describe('User Ban & Moderation System', () => {
  test.describe('Moderator Ban Management', () => {
    test.use({ storageState: 'tests/.auth/moderator.json' })

    test('should access user bans panel', async ({ page }) => {
      await page.goto('/admin/user-bans')

      await expect(page.locator('h1')).toContainText('User Bans')
      await expect(page.locator('[data-testid="active-bans-tab"]')).toBeVisible()
      await expect(page.locator('[data-testid="expired-bans-tab"]')).toBeVisible()
      await expect(page.locator('[data-testid="all-bans-tab"]')).toBeVisible()
    })

    test('should create a temporary ban', async ({ page }) => {
      await page.goto('/admin/users')

      // Find a user to ban (preferably a test user)
      await page.fill('[data-testid="search-users"]', 'testuser')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="user-row"]')

      const userRow = page.locator('[data-testid="user-row"]').first()
      if (await userRow.isVisible()) {
        // Open ban modal
        await userRow.locator('[data-testid="ban-user"]').click()

        // Fill ban details
        await page.fill('[name="reason"]', 'Temporary ban for testing')
        await page.selectOption('[name="duration"]', '7') // 7 days
        await page.check('[name="shadowBan"]') // Enable shadow ban

        // Submit ban
        await page.click('[data-testid="confirm-ban"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('banned')

        // Verify ban appears in list
        await page.goto('/admin/user-bans')
        await expect(page.locator('[data-testid="ban-entry"]')).toContainText('testuser')
      }
    })

    test('should create a permanent ban', async ({ page }) => {
      await page.goto('/admin/users')

      await page.fill('[data-testid="search-users"]', 'spammer')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="user-row"]')

      const userRow = page.locator('[data-testid="user-row"]').first()
      if (await userRow.isVisible()) {
        await userRow.locator('[data-testid="ban-user"]').click()

        // Fill permanent ban details
        await page.fill('[name="reason"]', 'Permanent ban for spamming')
        await page.selectOption('[name="duration"]', 'permanent')
        await page.check('[name="shadowBan"]')
        await page.check('[name="deleteContent"]') // Also delete their content

        await page.click('[data-testid="confirm-ban"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText(
          'permanently banned',
        )
      }
    })

    test('should update existing ban', async ({ page }) => {
      await page.goto('/admin/user-bans')

      await page.click('[data-testid="active-bans-tab"]')

      const activeBans = await page.locator('[data-testid="ban-entry"]').count()

      if (activeBans > 0) {
        // Edit first active ban
        await page.locator('[data-testid="edit-ban"]').first().click()

        // Update ban details
        await page.fill('[name="reason"]', 'Updated: Extended ban duration')
        await page.selectOption('[name="duration"]', '30') // Extend to 30 days

        await page.click('[data-testid="save-ban"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
      }
    })

    test('should lift a ban early', async ({ page }) => {
      await page.goto('/admin/user-bans')

      await page.click('[data-testid="active-bans-tab"]')

      const activeBans = await page.locator('[data-testid="ban-entry"]').count()

      if (activeBans > 0) {
        const firstBan = page.locator('[data-testid="ban-entry"]').first()
        const username = await firstBan.locator('[data-testid="banned-user"]').textContent()

        // Lift the ban
        await firstBan.locator('[data-testid="lift-ban"]').click()

        // Confirm and provide reason
        await page.fill('[name="liftReason"]', 'Ban lifted after appeal')
        await page.click('[data-testid="confirm-lift"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('lifted')

        // Verify ban is no longer active
        await page.click('[data-testid="expired-bans-tab"]')
        await expect(page.locator('[data-testid="ban-entry"]')).toContainText(username || '')
      }
    })

    test('should view ban statistics', async ({ page }) => {
      await page.goto('/admin/user-bans/stats')

      // Verify statistics display
      await expect(page.locator('[data-testid="total-bans"]')).toBeVisible()
      await expect(page.locator('[data-testid="active-bans"]')).toBeVisible()
      await expect(page.locator('[data-testid="shadow-bans"]')).toBeVisible()
      await expect(page.locator('[data-testid="permanent-bans"]')).toBeVisible()

      // Check charts
      await expect(page.locator('[data-testid="bans-timeline"]')).toBeVisible()
      await expect(page.locator('[data-testid="ban-reasons"]')).toBeVisible()
    })

    test('should search and filter bans', async ({ page }) => {
      await page.goto('/admin/user-bans')

      // Search by username
      await page.fill('[data-testid="search-bans"]', 'test')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="ban-entry"]')

      // Verify search results
      const bans = await page.locator('[data-testid="banned-user"]').all()
      for (const ban of bans) {
        const username = await ban.textContent()
        expect(username?.toLowerCase()).toContain('test')
      }

      // Filter by shadow bans
      await page.click('[data-testid="clear-search"]')
      await page.check('[data-testid="filter-shadow-bans"]')
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="ban-entry"]')

      // Verify all are shadow bans
      const shadowBadges = await page.locator('[data-testid="shadow-ban-badge"]').count()
      const totalBans = await page.locator('[data-testid="ban-entry"]').count()
      expect(shadowBadges).toBe(totalBans)
    })
  })

  test.describe('Shadow Ban Behavior', () => {
    test('shadow banned user should not know they are banned', async ({ browser }) => {
      // Create a new context for the shadow banned user
      const context = await browser.newContext({ storageState: 'tests/.auth/shadowbanned.json' })
      const page = await context.newPage()

      await page.goto('/')

      // User should be able to navigate normally
      await expect(page).not.toHaveURL(/banned|suspended/)

      // User can still create content
      await page.goto('/listings/new')
      await expect(page.locator('[data-testid="listing-form"]')).toBeVisible()

      // Fill and submit a listing
      await page.fill('[name="title"]', 'Shadow banned test listing')
      await page.selectOption('[name="gameId"]', { index: 1 })
      await page.selectOption('[name="deviceId"]', { index: 1 })
      await page.selectOption('[name="emulatorId"]', { index: 1 })
      await page.click('[data-testid="submit-listing"]')

      // Should appear successful to the banned user
      await expect(page.locator('[data-testid="success-message"]')).toContainText('created')

      await context.close()
    })

    test('shadow banned content should be hidden from others', async ({ page }) => {
      // As a regular user, shadow banned content should not be visible
      await page.goto('/listings')

      // Search for shadow banned content
      await page.fill('[data-testid="search-input"]', 'Shadow banned test')
      await page.click('[data-testid="search-button"]')

      // Should not find the shadow banned listing
      await expect(page.locator('[data-testid="no-results"]')).toBeVisible()
    })

    test('moderators should see shadow banned content with indicator', async ({ page }) => {
      // This test requires moderator authentication to be set up in the test context
      await page.goto('/listings')

      // Search for shadow banned content
      await page.fill('[data-testid="search-input"]', 'Shadow banned test')
      await page.click('[data-testid="search-button"]')

      // Should see the listing with shadow ban indicator
      const shadowBannedListing = page
        .locator('[data-testid="listing-card"]')
        .filter({ has: page.locator('[data-testid="shadow-banned-indicator"]') })

      await expect(shadowBannedListing).toBeVisible()
    })
  })

  test.describe('User Report Management', () => {
    test.use({ storageState: 'tests/.auth/moderator.json' })

    test('should view user reports', async ({ page }) => {
      await page.goto('/admin/reports')

      await expect(page.locator('h1')).toContainText('User Reports')
      await expect(page.locator('[data-testid="pending-reports"]')).toBeVisible()
      await expect(page.locator('[data-testid="under-review"]')).toBeVisible()
      await expect(page.locator('[data-testid="resolved-reports"]')).toBeVisible()
    })

    test('should process a user report', async ({ page }) => {
      await page.goto('/admin/reports')

      await page.click('[data-testid="pending-reports"]')

      const pendingReports = await page.locator('[data-testid="report-item"]').count()

      if (pendingReports > 0) {
        // Open first report
        await page.locator('[data-testid="view-report"]').first().click()

        // Review report details
        await expect(page.locator('[data-testid="reported-user"]')).toBeVisible()
        await expect(page.locator('[data-testid="report-reason"]')).toBeVisible()
        await expect(page.locator('[data-testid="report-description"]')).toBeVisible()

        // Take action
        await page.selectOption('[name="action"]', 'warn') // Issue warning
        await page.fill('[name="moderatorNotes"]', 'User warned for inappropriate content')
        await page.click('[data-testid="process-report"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('processed')
      }
    })

    test('should ban user from report', async ({ page }) => {
      await page.goto('/admin/reports')

      await page.click('[data-testid="pending-reports"]')

      const reports = page
        .locator('[data-testid="report-item"]')
        .filter({ hasText: 'SPAM' })
        .first()

      if (await reports.isVisible()) {
        await reports.locator('[data-testid="view-report"]').click()

        // Choose to ban the user
        await page.selectOption('[name="action"]', 'ban')
        await page.selectOption('[name="banDuration"]', '30')
        await page.fill('[name="moderatorNotes"]', 'Banned for repeated spam violations')
        await page.click('[data-testid="process-report"]')

        // Confirm ban
        await page.click('[data-testid="confirm-ban"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('banned')
      }
    })

    test('should view user report statistics', async ({ page }) => {
      await page.goto('/admin/reports/stats')

      // Check user with most reports
      await expect(page.locator('[data-testid="most-reported-users"]')).toBeVisible()

      // Check report trends
      await expect(page.locator('[data-testid="reports-by-reason"]')).toBeVisible()
      await expect(page.locator('[data-testid="reports-timeline"]')).toBeVisible()

      // Check moderator activity
      await expect(page.locator('[data-testid="moderator-actions"]')).toBeVisible()
    })
  })

  test.describe('Ban Appeals and Review', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should review ban appeals', async ({ page }) => {
      await page.goto('/admin/user-bans/appeals')

      const appeals = await page.locator('[data-testid="appeal-item"]').count()

      if (appeals > 0) {
        // Open first appeal
        await page.locator('[data-testid="view-appeal"]').first().click()

        // Review appeal details
        await expect(page.locator('[data-testid="appeal-reason"]')).toBeVisible()
        await expect(page.locator('[data-testid="ban-history"]')).toBeVisible()

        // Approve appeal
        await page.click('[data-testid="approve-appeal"]')
        await page.fill('[name="reviewNotes"]', 'Appeal approved - ban reduced')
        await page.selectOption('[name="newDuration"]', '3') // Reduce to 3 days
        await page.click('[data-testid="confirm-appeal"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('approved')
      }
    })

    test('should delete a ban record', async ({ page }) => {
      await page.goto('/admin/user-bans')

      // Go to expired bans
      await page.click('[data-testid="expired-bans-tab"]')

      const expiredBans = await page.locator('[data-testid="ban-entry"]').count()

      if (expiredBans > 0) {
        // Delete first expired ban
        await page.locator('[data-testid="delete-ban"]').first().click()

        // Confirm deletion
        await page.click('[data-testid="confirm-delete"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('deleted')

        // Verify count decreased
        const newCount = await page.locator('[data-testid="ban-entry"]').count()
        expect(newCount).toBeLessThan(expiredBans)
      }
    })

    test('should export ban records', async ({ page }) => {
      await page.goto('/admin/user-bans')

      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download')

      // Export bans
      await page.click('[data-testid="export-bans"]')
      await page.selectOption('[name="exportFormat"]', 'csv')
      await page.click('[data-testid="confirm-export"]')

      // Wait for download
      const download = await downloadPromise

      // Verify download
      expect(download.suggestedFilename()).toContain('user-bans')
      expect(download.suggestedFilename()).toContain('.csv')
    })
  })

  test.describe('Automated Moderation Rules', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should create auto-moderation rule', async ({ page }) => {
      await page.goto('/admin/moderation/rules')

      // Create new rule
      await page.click('[data-testid="create-rule"]')

      // Configure rule
      await page.fill('[name="ruleName"]', 'Auto-ban spam accounts')
      await page.selectOption('[name="trigger"]', 'spam_score')
      await page.fill('[name="threshold"]', '5')
      await page.selectOption('[name="action"]', 'shadow_ban')
      await page.fill('[name="duration"]', '7')

      // Save rule
      await page.click('[data-testid="save-rule"]')

      // Verify rule created
      await expect(page.locator('[data-testid="rule-item"]')).toContainText(
        'Auto-ban spam accounts',
      )
    })

    test('should test moderation rule', async ({ page }) => {
      await page.goto('/admin/moderation/rules')

      const rules = await page.locator('[data-testid="rule-item"]').count()

      if (rules > 0) {
        // Test first rule
        await page.locator('[data-testid="test-rule"]').first().click()

        // Enter test user
        await page.fill('[name="testUsername"]', 'testuser123')
        await page.click('[data-testid="run-test"]')

        // View test results
        await expect(page.locator('[data-testid="test-result"]')).toBeVisible()
        await expect(page.locator('[data-testid="rule-match"]')).toBeVisible()
      }
    })

    test('should view moderation activity log', async ({ page }) => {
      await page.goto('/admin/moderation/activity')

      // Verify activity log
      await expect(page.locator('[data-testid="activity-log"]')).toBeVisible()

      // Filter by action type
      await page.selectOption('[data-testid="action-filter"]', 'ban')
      await page.click('[data-testid="apply-filters"]')

      // Verify filtered results
      const actions = await page.locator('[data-testid="action-type"]').all()
      for (const action of actions) {
        await expect(action).toContainText('Ban')
      }

      // Filter by moderator
      await page.selectOption('[data-testid="moderator-filter"]', { index: 1 })
      await page.click('[data-testid="apply-filters"]')

      // Verify results
      await expect(page.locator('[data-testid="activity-entry"]')).toBeVisible()
    })
  })
})
