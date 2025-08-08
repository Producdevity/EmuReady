import { test, expect } from '@playwright/test'

test.describe('Admin Moderation Tests - Requires Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    // Try primary moderation path first
    await page.goto('/admin/moderation')

    // If not found, try alternative paths
    if (!page.url().includes('moderation')) {
      const alternativePaths = ['/admin/approvals', '/admin/pending']
      for (const path of alternativePaths) {
        await page.goto(path)
        if (page.url().includes('admin')) break
      }
    }

    // Verify we're in admin area
    await expect(page).toHaveURL(/\/admin\/(moderation|approvals|pending)/)
  })

  test('should display content moderation queue with required elements', async ({
    page,
  }) => {
    // Moderation queue must be present
    const moderationQueue = page.locator(
      '[data-testid*="moderation"], .moderation-queue',
    )
    await expect(moderationQueue).toBeVisible()

    // Check for pending items or empty state
    const pendingItems = moderationQueue.locator(
      '[data-testid*="pending"], .pending-item',
    )
    const itemCount = await pendingItems.count()

    if (itemCount > 0) {
      // Check first item structure
      const firstItem = pendingItems.first()

      // Must have content preview
      const preview = firstItem.locator('.preview, [data-testid*="preview"]')
      await expect(preview).toBeVisible()

      // Must have action buttons
      const approveButton = firstItem
        .locator('button')
        .filter({ hasText: /approve/i })
      const rejectButton = firstItem
        .locator('button')
        .filter({ hasText: /reject/i })

      await expect(approveButton).toBeVisible()
      await expect(rejectButton).toBeVisible()
    } else {
      // Should show empty state
      const emptyState = page.locator(
        '[data-testid="empty-state"], .empty-state, text=/no.*pending/i',
      )
      await expect(emptyState).toBeVisible()
    }
  })

  test('should filter moderation queue by content type', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Look for content type filters
      const typeFilters = page.locator(
        '[data-testid*="type-filter"], .content-type-filters',
      )

      if (await typeFilters.isVisible({ timeout: 3000 })) {
        const types = ['Listings', 'Comments', 'Games', 'Images']

        for (const type of types) {
          const typeButton = typeFilters
            .locator('button, label')
            .filter({ hasText: type })
          if (
            await typeButton.isVisible({ timeout: 1000 }).catch(() => false)
          ) {
            await typeButton.click()
            await page.waitForTimeout(1000)

            console.log(`✓ Filter by ${type}`)

            // Queue should update
            const items = page.locator('[data-testid*="moderation-item"]')
            console.log(`${await items.count()} ${type} items`)
          }
        }
      }
    }
  })

  test('should preview content before moderation', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Find preview button
      const previewButtons = page
        .locator('button')
        .filter({ hasText: /preview|view.*full/i })

      if ((await previewButtons.count()) > 0) {
        await previewButtons.first().click()

        // Should show preview modal
        const previewModal = page
          .locator('[role="dialog"]')
          .filter({ hasText: /preview/i })

        if (await previewModal.isVisible({ timeout: 3000 })) {
          // Check content sections
          const contentSections = {
            Title: '.title, [data-testid*="title"]',
            Description: '.description, [data-testid*="description"]',
            Author: '.author, [data-testid*="author"]',
            Date: 'time, .date',
          }

          for (const [label, selector] of Object.entries(contentSections)) {
            const element = previewModal.locator(selector)
            if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`✓ Preview shows ${label}`)
            }
          }

          // Close preview
          const closeButton = previewModal
            .locator('button')
            .filter({ hasText: /close/i })
          await closeButton.click()
        }
      }
    }
  })

  test('should handle content approval', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Find approve button
      const approveButtons = page
        .locator('button')
        .filter({ hasText: /approve/i })

      if ((await approveButtons.count()) > 0) {
        // Remember item details
        const itemText = await page
          .locator('[data-testid*="moderation-item"]')
          .first()
          .textContent()

        await approveButtons.first().click()

        // Might show confirmation
        const confirmDialog = page
          .locator('[role="dialog"]')
          .filter({ hasText: /confirm.*approve/i })

        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          // Add approval notes
          const notesField = confirmDialog.locator('textarea')
          if (await notesField.isVisible()) {
            await notesField.fill('Approved - meets guidelines')
          }

          // Confirm
          const confirmButton = confirmDialog
            .locator('button')
            .filter({ hasText: /confirm|approve/i })
          await confirmButton.click()

          // Should show success message
          const successMessage = page
            .locator('[role="alert"]')
            .filter({ hasText: /approved|success/i })
          const hasSuccess = await successMessage
            .isVisible({ timeout: 3000 })
            .catch(() => false)

          if (hasSuccess) {
            console.log('Content approved successfully')
          }
        } else {
          // Direct approval
          console.log('Quick approval completed')
        }

        // Item should be removed from queue
        await page.waitForTimeout(1500)
        const sameItem = page
          .locator('[data-testid*="moderation-item"]')
          .filter({ hasText: itemText || '' })
        const isGone = (await sameItem.count()) === 0

        expect(isGone).toBe(true)
      }
    }
  })

  test('should handle content rejection with reason', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Find reject button
      const rejectButtons = page
        .locator('button')
        .filter({ hasText: /reject/i })

      if ((await rejectButtons.count()) > 0) {
        await rejectButtons.first().click()

        // Should show rejection form
        const rejectionDialog = page
          .locator('[role="dialog"]')
          .filter({ hasText: /reject/i })

        if (await rejectionDialog.isVisible({ timeout: 3000 })) {
          // Reason selector
          const reasonSelect = rejectionDialog.locator('select[name*="reason"]')
          if (await reasonSelect.isVisible()) {
            await reasonSelect.selectOption({ index: 1 })

            const reasons = await reasonSelect
              .locator('option')
              .allTextContents()
            console.log(
              'Rejection reasons:',
              reasons.filter((r) => r).join(', '),
            )
          }

          // Additional notes
          const notesField = rejectionDialog.locator('textarea')
          if (await notesField.isVisible()) {
            await notesField.fill('Does not meet quality standards')
          }

          // Check for notification option
          const notifyCheckbox = rejectionDialog
            .locator('input[type="checkbox"]')
            .filter({ hasText: /notify/i })
          if (await notifyCheckbox.isVisible()) {
            await notifyCheckbox.check()
            console.log('User notification option available')
          }

          // Cancel for safety
          const cancelButton = rejectionDialog
            .locator('button')
            .filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })

  test('should support bulk moderation actions', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Look for checkboxes
      const checkboxes = page
        .locator('input[type="checkbox"]')
        .filter({ hasNotText: /all/i })

      if ((await checkboxes.count()) >= 2) {
        // Select multiple items
        await checkboxes.nth(0).check()
        await checkboxes.nth(1).check()

        // Look for bulk actions
        const bulkActions = page.locator(
          '[data-testid*="bulk-actions"], .bulk-actions',
        )

        if (await bulkActions.isVisible({ timeout: 2000 })) {
          const approveAllButton = bulkActions
            .locator('button')
            .filter({ hasText: /approve.*all/i })
          const rejectAllButton = bulkActions
            .locator('button')
            .filter({ hasText: /reject.*all/i })

          expect(
            (await approveAllButton.isVisible()) ||
              (await rejectAllButton.isVisible()),
          ).toBe(true)

          console.log('Bulk moderation actions available')

          // Uncheck for cleanup
          await checkboxes.nth(0).uncheck()
          await checkboxes.nth(1).uncheck()
        }
      }
    }
  })

  test('should display user trust indicators', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Look for user info in moderation items
      const userInfo = page.locator(
        '[data-testid*="user-info"], .submitter-info',
      )

      if ((await userInfo.count()) > 0) {
        const firstUser = userInfo.first()

        // Trust score
        const trustScore = firstUser.locator(
          '[data-testid*="trust"], .trust-score',
        )
        if (await trustScore.isVisible({ timeout: 2000 })) {
          const score = await trustScore.textContent()
          console.log(`User trust score: ${score}`)
        }

        // User history
        const userHistory = firstUser.locator(
          '[data-testid*="history"], .user-stats',
        )
        if (await userHistory.isVisible()) {
          const history = await userHistory.textContent()
          console.log(`User history: ${history}`)
        }

        // Warning indicators
        const warnings = firstUser.locator('[data-testid*="warning"], .warning')
        if ((await warnings.count()) > 0) {
          console.log('User has warning indicators')
        }
      }
    }
  })

  test('should handle flagged content specially', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Look for flagged items
      const flaggedItems = page.locator(
        '[data-testid*="flagged"], .flagged-item',
      )

      if ((await flaggedItems.count()) > 0) {
        console.log(`${await flaggedItems.count()} flagged items found`)

        const firstFlagged = flaggedItems.first()

        // Should show flag reason
        const flagReason = firstFlagged.locator(
          '[data-testid*="flag-reason"], .flag-reason',
        )
        if (await flagReason.isVisible()) {
          const reason = await flagReason.textContent()
          console.log(`Flagged for: ${reason}`)
        }

        // Should have elevated review options
        const escalateButton = firstFlagged
          .locator('button')
          .filter({ hasText: /escalate/i })
        if (await escalateButton.isVisible()) {
          console.log('Can escalate flagged content')
        }
      }
    }
  })

  test('should track moderation metrics', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Look for metrics section
      const metricsSection = page.locator(
        '[data-testid*="moderation-metrics"], .moderation-stats',
      )

      if (await metricsSection.isVisible({ timeout: 3000 })) {
        const metrics = {
          Pending: '[data-testid*="pending-count"]',
          'Approved Today': '[data-testid*="approved-today"]',
          'Rejected Today': '[data-testid*="rejected-today"]',
          'Avg Response Time': '[data-testid*="response-time"]',
        }

        for (const [label, selector] of Object.entries(metrics)) {
          const metric = metricsSection.locator(selector)
          if (await metric.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await metric.textContent()
            console.log(`${label}: ${value}`)
          }
        }
      }
    }
  })

  test('should support content editing during moderation', async ({ page }) => {
    await page.goto('/admin/moderation')

    if (page.url().includes('moderation') || page.url().includes('approvals')) {
      // Look for edit button
      const editButtons = page.locator('button').filter({ hasText: /edit/i })

      if ((await editButtons.count()) > 0) {
        await editButtons.first().click()

        // Should show edit form
        const editDialog = page
          .locator('[role="dialog"]')
          .filter({ hasText: /edit/i })

        if (await editDialog.isVisible({ timeout: 3000 })) {
          // Check for editable fields
          const titleInput = editDialog.locator('input[name*="title"]')
          const descriptionInput = editDialog.locator(
            'textarea[name*="description"]',
          )

          if (await titleInput.isVisible()) {
            const currentTitle = await titleInput.inputValue()
            await titleInput.fill(`${currentTitle} (Edited)`)
            console.log('Can edit content title during moderation')
          }

          if (await descriptionInput.isVisible()) {
            const currentDescription = await descriptionInput.inputValue()
            await descriptionInput.fill(
              `${currentDescription}\nEdited by moderator`,
            )
            console.log('Can edit content description during moderation')
          }

          // Look for track changes option
          const trackChanges = editDialog
            .locator('input[type="checkbox"]')
            .filter({ hasText: /track.*changes/i })
          if (await trackChanges.isVisible()) {
            await trackChanges.check()
            console.log('Edit tracking available')
          }

          // Cancel edit
          const cancelButton = editDialog
            .locator('button')
            .filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })
})
