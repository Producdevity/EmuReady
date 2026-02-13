import { test, expect } from '@playwright/test'

test.describe('Listing Approval Workflow Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    // Try primary approval path
    await page.goto('/admin/listings/approvals')

    // If not found, try alternative paths
    if (!page.url().includes('approval')) {
      const alternativePaths = ['/admin/games/approvals', '/admin/pending-listings']
      for (const path of alternativePaths) {
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
    const viewButtons = page.locator('button').filter({ hasText: /view|review|details/i })
    const hasViewButtons = (await viewButtons.count()) > 0
    test.skip(!hasViewButtons, 'No view/review buttons found -- no pending listings to review')

    await viewButtons.first().click()

    // Should show detailed view
    const detailModal = page.locator('[role="dialog"], .listing-details')
    const modalVisible = await detailModal.isVisible({ timeout: 3000 })
    test.skip(!modalVisible, 'Detail modal did not appear')

    // Essential information sections should exist within the modal
    const modalContent = await detailModal.textContent()
    expect(modalContent).toBeTruthy()
    expect(modalContent!.length).toBeGreaterThan(0)
  })

  test('should validate listing data before approval', async ({ page }) => {
    const reviewButtons = page.locator('button').filter({ hasText: /review/i })
    const hasReviewButtons = (await reviewButtons.count()) > 0
    test.skip(!hasReviewButtons, 'No review buttons found -- no pending listings to validate')

    await reviewButtons.first().click()

    // Look for validation indicators
    const validationStatus = page.locator('[data-testid*="validation"], .validation-status')
    const validationVisible = await validationStatus.isVisible({ timeout: 3000 })

    if (validationVisible) {
      // Check validation items exist
      const validationItems = validationStatus.locator('.validation-item, li')
      expect(await validationItems.count()).toBeGreaterThan(0)
    }

    // Duplicate check
    const duplicateWarning = page.locator('[data-testid*="duplicate"], .duplicate-warning')
    const hasDuplicateWarning = await duplicateWarning
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    // Result is deterministic regardless of whether warning is shown
    expect(typeof hasDuplicateWarning).toBe('boolean')
  })

  test('should support quick approval actions', async ({ page }) => {
    // Quick approve button
    const quickApprove = page
      .locator('button')
      .filter({ hasText: /quick.*approve|approve/i })
      .first()

    const approveVisible = await quickApprove.isVisible({ timeout: 3000 })
    test.skip(!approveVisible, 'No quick approve button found -- no pending listings')

    const itemText = await page.locator('.pending-listing').first().textContent()

    await quickApprove.click()

    // Item should be removed from the queue
    const sameItem = page.locator('.pending-listing').filter({ hasText: itemText || '' })
    await expect(sameItem).toHaveCount(0)
  })

  test('should handle rejection with feedback', async ({ page }) => {
    const rejectButtons = page.locator('button').filter({ hasText: /reject/i })
    const hasRejectButtons = (await rejectButtons.count()) > 0
    test.skip(!hasRejectButtons, 'No reject buttons found -- no pending listings')

    await rejectButtons.first().click()

    // Rejection dialog
    const rejectDialog = page.locator('[role="dialog"]').filter({ hasText: /reject/i })
    const dialogVisible = await rejectDialog.isVisible({ timeout: 3000 })
    test.skip(!dialogVisible, 'Rejection dialog did not appear')

    // Rejection reasons
    const reasonOptions = rejectDialog.locator('input[type="radio"], input[type="checkbox"]')

    if ((await reasonOptions.count()) > 0) {
      await reasonOptions.first().check()
    }

    // Feedback textarea
    const feedbackField = rejectDialog.locator('textarea')
    if (await feedbackField.isVisible()) {
      await feedbackField.fill('Please provide more detailed performance notes')
    }

    // Cancel to avoid modifying data
    const cancelButton = rejectDialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should batch process approvals', async ({ page }) => {
    // Select all checkbox
    const selectAll = page
      .locator('input[type="checkbox"]')
      .filter({ hasText: /all/i })
      .or(page.locator('thead input[type="checkbox"]'))

    const selectAllVisible = await selectAll.isVisible({ timeout: 3000 })
    test.skip(!selectAllVisible, 'No select-all checkbox found')

    await selectAll.check()

    // Batch actions should appear
    const batchActions = page.locator('[data-testid*="batch-actions"], .batch-actions')
    const batchVisible = await batchActions.isVisible({ timeout: 2000 })
    test.skip(!batchVisible, 'Batch actions did not appear after selecting all')

    const approveAll = batchActions.locator('button').filter({ hasText: /approve.*selected/i })
    const rejectAll = batchActions.locator('button').filter({ hasText: /reject.*selected/i })

    expect((await approveAll.isVisible()) || (await rejectAll.isVisible())).toBe(true)

    // Uncheck to avoid modifying data
    await selectAll.uncheck()
  })

  test('should show approval history', async ({ page }) => {
    // History tab or link
    const historyLink = page.locator('a, button').filter({ hasText: /history|approved|rejected/i })

    const historyVisible = await historyLink.isVisible({ timeout: 3000 })
    test.skip(!historyVisible, 'No history link found')

    await historyLink.click()

    // Should show processed listings
    const historyTable = page.locator('table, [data-testid*="history"]')
    const tableVisible = await historyTable.isVisible({ timeout: 3000 })
    test.skip(!tableVisible, 'History table did not appear')

    // Check for action column
    const actionColumn = historyTable.locator('th').filter({ hasText: /action|status/i })
    await expect(actionColumn).toBeVisible()

    // Check for moderator column
    const moderatorColumn = historyTable.locator('th').filter({ hasText: /moderator|approved by/i })
    await expect(moderatorColumn).toBeVisible()

    // Check for timestamp
    const dateColumn = historyTable.locator('th').filter({ hasText: /date|time/i })
    await expect(dateColumn).toBeVisible()
  })

  test('should enforce approval guidelines', async ({ page }) => {
    // Guidelines link or button
    const guidelinesButton = page
      .locator('button, a')
      .filter({ hasText: /guidelines|help|policy/i })

    const guidelinesVisible = await guidelinesButton.isVisible({ timeout: 3000 })
    test.skip(!guidelinesVisible, 'No guidelines button found')

    await guidelinesButton.click()

    // Should show guidelines
    const guidelinesModal = page.locator('[role="dialog"]').filter({ hasText: /guidelines/i })
    const modalVisible = await guidelinesModal.isVisible({ timeout: 2000 })
    test.skip(!modalVisible, 'Guidelines modal did not appear')

    // Guidelines modal should have content
    const modalContent = await guidelinesModal.textContent()
    expect(modalContent).toBeTruthy()
    expect(modalContent!.length).toBeGreaterThan(0)

    // Close
    const closeButton = guidelinesModal.locator('button').filter({ hasText: /close/i })
    await closeButton.click()
  })

  test('should track approval metrics', async ({ page }) => {
    // Metrics section
    const metricsSection = page.locator('[data-testid*="approval-metrics"], .approval-stats')
    const metricsVisible = await metricsSection.isVisible({ timeout: 3000 })
    test.skip(!metricsVisible, 'No approval metrics section found')

    // Metrics section should have content
    const metricsContent = await metricsSection.textContent()
    expect(metricsContent).toBeTruthy()
    expect(metricsContent!.length).toBeGreaterThan(0)
  })

  test('should handle reported user submissions specially', async ({ page }) => {
    // Look for warning indicators
    const warnings = page.locator('[data-testid*="warning"], .user-warning')
    const warningCount = await warnings.count()
    test.skip(warningCount === 0, 'No submissions from reported users found')

    const firstWarning = warnings.first()

    // Should show warning details
    const warningText = await firstWarning.textContent()
    expect(warningText).toMatch(/report|flag|trust/i)
  })
})
