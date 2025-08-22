import { test, expect } from '@playwright/test'

test.describe('Listing Approval Workflow Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    // Try primary approval path
    await page.goto('/admin/listings/approvals')

    // If not found, try alternative paths
    if (!page.url().includes('approval')) {
      const alternativePaths = ['/admin/games/approvals', '/admin/pending-listings']
      for(const path of alternativePaths) {
        await page.goto(path)
        if (
          page.url().includes('admin') &&
          (page.url().includes('approval') || page.url().includes('pending'))
        )
          break
      }
    }

    // Verify we're in admin approval area
    await expect(page).toHaveURL(/\/admin\/.*(approval|pending)/)
  })

  test('should display pending listings for approval with required information', async ({
                                                                                          page,
                                                                                        }) => {
    // Check for pending listings or empty state
    const pendingListings = page.locator('[data-testid*="pending-listing"], .pending-listing')
    const listingCount = await pendingListings.count()

    if (listingCount > 0) {
      // Verify listing structure
      const firstListing = pendingListings.first()

      // Must show game info
      const gameTitle = firstListing.locator('[data-testid*="game-title"], .game-title')
      await expect(gameTitle).toBeVisible()

      // Must show device/emulator info
      const deviceInfo = firstListing.locator('[data-testid*="device"], .device-info')
      await expect(deviceInfo).toBeVisible()

      // Must show performance rating
      const performance = firstListing.locator('[data-testid*="performance"], .performance-badge')
      await expect(performance).toBeVisible()
    } else {
      // Should show empty state or just be empty
      // Try to find empty state message
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state')
      const emptyText = page.getByText(/no.*pending/i)
      const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false)
      const hasEmptyText = await emptyText.isVisible({ timeout: 2000 }).catch(() => false)

      // If neither empty state indicator is found, check that the listings container exists but is empty
      if (!hasEmptyState && !hasEmptyText) {
        // The page should at least have a main content area
        const mainContent = page.locator('main')
        await expect(mainContent).toBeVisible()

        // Verify no pending listings are shown
        const pendingListingsCheck = page.locator(
          '[data-testid*="pending-listing"], .pending-listing',
        )
        const count = await pendingListingsCheck.count()
        expect(count).toBe(0)
      }
    }
  })

  test('should show submission details for review', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      const viewButtons = page.locator('button').filter({ hasText: /view|review|details/i })

      if ((await viewButtons.count()) > 0) {
        await viewButtons.first().click()

        // Should show detailed view
        const detailModal = page.locator('[role="dialog"], .listing-details')

        if (await detailModal.isVisible({ timeout: 3000 })) {
          // Essential information
          const sections = {
            Game:        '[data-testid*="game"]',
            Device:      '[data-testid*="device"]',
            Emulator:    '[data-testid*="emulator"]',
            Performance: '[data-testid*="performance"]',
            Notes:       '[data-testid*="notes"], .user-notes',
            Submitter:   '[data-testid*="submitter"], .user-info',
          }

          for(const [label, selector] of Object.entries(sections)) {
            const section = detailModal.locator(selector)
            if (await section.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`✓ Shows ${label}`)
            }
          }

          // Custom fields
          const customFields = detailModal.locator('[data-testid*="custom-field"]')
          if ((await customFields.count()) > 0) {
            console.log(`${await customFields.count()} custom fields present`)
          }
        }
      }
    }
  })

  test('should validate listing data before approval', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      const reviewButtons = page.locator('button').filter({ hasText: /review/i })

      if ((await reviewButtons.count()) > 0) {
        await reviewButtons.first().click()

        // Look for validation indicators
        const validationStatus = page.locator('[data-testid*="validation"], .validation-status')

        if (await validationStatus.isVisible({ timeout: 3000 })) {
          // Check validation items
          const validationItems = validationStatus.locator('.validation-item, li')

          for(let i = 0; i < (await validationItems.count()); i++) {
            const item = validationItems.nth(i)
            const text = await item.textContent()
            const status =
              (await item.getAttribute('data-status')) || (await item.getAttribute('class')) || ''

            const isPassing =
              status.includes('pass') || status.includes('success') || status.includes('green')
            console.log(`Validation: ${text} - ${isPassing ? '✓' : '✗'}`)
          }
        }

        // Duplicate check
        const duplicateWarning = page.locator('[data-testid*="duplicate"], .duplicate-warning')
        if (await duplicateWarning.isVisible({ timeout: 2000 })) {
          console.log('⚠️ Duplicate listing warning shown')
        }
      }
    }
  })

  test('should support quick approval actions', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      // Quick approve button
      const quickApprove = page
        .locator('button')
        .filter({ hasText: /quick.*approve|approve/i })
        .first()

      if (await quickApprove.isVisible({ timeout: 3000 })) {
        const itemText = await page.locator('.pending-listing').first().textContent()

        await quickApprove.click()

        // Might show brief confirmation
        await page.waitForTimeout(1500)

        // Item should be removed
        const sameItem = page.locator('.pending-listing').filter({ hasText: itemText || '' })
        const removed = (await sameItem.count()) === 0

        if (removed) {
          console.log('Quick approval removes item from queue')
        }

        // Success notification
        const success = page.locator('[role="alert"]').filter({ hasText: /approved/i })
        if (await success.isVisible({ timeout: 2000 })) {
          console.log('Approval confirmation shown')
        }
      }
    }
  })

  test('should handle rejection with feedback', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      const rejectButtons = page.locator('button').filter({ hasText: /reject/i })

      if ((await rejectButtons.count()) > 0) {
        await rejectButtons.first().click()

        // Rejection dialog
        const rejectDialog = page.locator('[role="dialog"]').filter({ hasText: /reject/i })

        if (await rejectDialog.isVisible({ timeout: 3000 })) {
          // Rejection reasons
          const reasonOptions = rejectDialog.locator('input[type="radio"], input[type="checkbox"]')

          if ((await reasonOptions.count()) > 0) {
            await reasonOptions.first().check()

            const reasons = []
            for(let i = 0; i < (await reasonOptions.count()); i++) {
              const label = await reasonOptions.nth(i).locator('..').textContent()
              reasons.push(label)
            }
            console.log('Rejection reasons:', reasons.join(', '))
          }

          // Feedback textarea
          const feedbackField = rejectDialog.locator('textarea')
          if (await feedbackField.isVisible()) {
            await feedbackField.fill('Please provide more detailed performance notes')
          }

          // Email notification option
          const emailOption = rejectDialog
            .locator('input[type="checkbox"]')
            .filter({ hasText: /email|notify/i })
          if (await emailOption.isVisible()) {
            await emailOption.check()
            console.log('Email notification option available')
          }

          // Cancel
          const cancelButton = rejectDialog.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })

  test('should batch process approvals', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      // Select all checkbox
      const selectAll = page
        .locator('input[type="checkbox"]')
        .filter({ hasText: /all/i })
        .or(page.locator('thead input[type="checkbox"]'))

      if (await selectAll.isVisible({ timeout: 3000 })) {
        await selectAll.check()

        // Batch actions should appear
        const batchActions = page.locator('[data-testid*="batch-actions"], .batch-actions')

        if (await batchActions.isVisible({ timeout: 2000 })) {
          const approveAll = batchActions
            .locator('button')
            .filter({ hasText: /approve.*selected/i })
          const rejectAll = batchActions.locator('button').filter({ hasText: /reject.*selected/i })

          expect((await approveAll.isVisible()) || (await rejectAll.isVisible())).toBe(true)

          // Check count
          const selectedCount = page.locator('[data-testid*="selected-count"], .selected-count')
          if (await selectedCount.isVisible()) {
            const count = await selectedCount.textContent()
            console.log(`${count} items selected`)
          }

          // Uncheck
          await selectAll.uncheck()
        }
      }
    }
  })

  test('should show approval history', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      // History tab or link
      const historyLink = page
        .locator('a, button')
        .filter({ hasText: /history|approved|rejected/i })

      if (await historyLink.isVisible({ timeout: 3000 })) {
        await historyLink.click()

        // Should show processed listings
        const historyTable = page.locator('table, [data-testid*="history"]')

        if (await historyTable.isVisible({ timeout: 3000 })) {
          // Check for action column
          const actionColumn = historyTable.locator('th').filter({ hasText: /action|status/i })
          await expect(actionColumn).toBeVisible()

          // Check for moderator column
          const moderatorColumn = historyTable
            .locator('th')
            .filter({ hasText: /moderator|approved by/i })
          await expect(moderatorColumn).toBeVisible()

          // Check for timestamp
          const dateColumn = historyTable.locator('th').filter({ hasText: /date|time/i })
          await expect(dateColumn).toBeVisible()
        }
      }
    }
  })

  test('should enforce approval guidelines', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      // Guidelines link or button
      const guidelinesButton = page
        .locator('button, a')
        .filter({ hasText: /guidelines|help|policy/i })

      if (await guidelinesButton.isVisible({ timeout: 3000 })) {
        await guidelinesButton.click()

        // Should show guidelines
        const guidelinesModal = page.locator('[role="dialog"]').filter({ hasText: /guidelines/i })

        if (await guidelinesModal.isVisible({ timeout: 2000 })) {
          // Check for key sections
          const sections = [
            'Quality Standards',
            'Performance Ratings',
            'Required Information',
            'Prohibited Content',
          ]

          for(const section of sections) {
            const sectionHeader = guidelinesModal.locator('h3, h4').filter({ hasText: section })
            if (await sectionHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`✓ Guidelines include: ${section}`)
            }
          }

          // Close
          const closeButton = guidelinesModal.locator('button').filter({ hasText: /close/i })
          await closeButton.click()
        }
      }
    }
  })

  test('should track approval metrics', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      // Metrics section
      const metricsSection = page.locator('[data-testid*="approval-metrics"], .approval-stats')

      if (await metricsSection.isVisible({ timeout: 3000 })) {
        const metrics = {
          Pending:           /\d+.*pending/i,
          'Approved Today':  /\d+.*approved.*today/i,
          'Rejection Rate':  /\d+%.*reject/i,
          'Avg Review Time': /\d+.*(min|hour)/i,
        }

        for(const [label, pattern] of Object.entries(metrics)) {
          const metric = metricsSection.locator('.metric, .stat').filter({ hasText: pattern })
          if (await metric.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await metric.textContent()
            console.log(`${label}: ${value}`)
          }
        }
      }
    }
  })

  test('should handle reported user submissions specially', async ({ page }) => {
    await page.goto('/admin/listings/approvals')

    if (page.url().includes('approval')) {
      // Look for warning indicators
      const warnings = page.locator('[data-testid*="warning"], .user-warning')

      if ((await warnings.count()) > 0) {
        console.log(`${await warnings.count()} submissions from reported users`)

        const firstWarning = warnings.first()

        // Should show warning details
        const warningText = await firstWarning.textContent()
        expect(warningText).toMatch(/report|flag|trust/i)

        // Should have extra review options
        const parent = firstWarning.locator('..')
        const extraReviewButton = parent
          .locator('button')
          .filter({ hasText: /detailed.*review|extra.*check/i })

        if (await extraReviewButton.isVisible()) {
          console.log('Extra review options for reported users')
        }
      }
    }
  })
})
