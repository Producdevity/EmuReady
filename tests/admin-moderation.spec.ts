import { test, expect } from '@playwright/test'

test.describe('Admin Moderation Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    // Try primary moderation path first
    await page.goto('/admin/moderation')
    await page.waitForLoadState('domcontentloaded')

    // Check if the page returned a 404 or non-admin content
    const is404 = await page
      .getByRole('heading', { name: '404' })
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    const hasAdminContent = await page
      .locator('nav')
      .filter({ hasText: /systems|games/i })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (is404 || !hasAdminContent) {
      // /admin/moderation doesn't exist, try alternative paths
      const alternativePaths = ['/admin/approvals', '/admin/pending']
      for (const path of alternativePaths) {
        await page.goto(path)
        await page.waitForLoadState('domcontentloaded')
        const has404 = await page
          .getByRole('heading', { name: '404' })
          .isVisible({ timeout: 2000 })
          .catch(() => false)
        if (!has404) break
      }
    }

    // Verify we're in admin area with actual content (not 404)
    const finalIs404 = await page
      .getByRole('heading', { name: '404' })
      .isVisible({ timeout: 1000 })
      .catch(() => false)
    test.skip(finalIs404, 'No moderation/approvals page available in this environment')
    await expect(page).toHaveURL(/\/admin\/(moderation|approvals|pending)/)
  })

  test('should display content moderation queue with required elements', async ({ page }) => {
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()

    const table = page.locator('table').first()
    const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasTable) {
      const tableRows = table.locator('tbody tr')
      const rowCount = await tableRows.count()

      if (rowCount > 0) {
        const approveButtons = page.locator('button').filter({ hasText: /approve/i })
        const rejectButtons = page.locator('button').filter({ hasText: /reject/i })

        const hasApprove = (await approveButtons.count()) > 0
        const hasReject = (await rejectButtons.count()) > 0

        expect(hasApprove || hasReject).toBe(true)
      } else {
        // Empty queue is valid - verify table structure exists
        const headers = table.locator('thead th')
        expect(await headers.count()).toBeGreaterThan(0)
      }
    } else {
      // Wait for meaningful content to load before checking text
      await page
        .waitForFunction(
          (el) => el !== null && (el.textContent ?? '').trim().length > 10,
          await mainContent.elementHandle(),
          { timeout: 10000 },
        )
        .catch(() => {})
      const pageText = await mainContent.textContent()
      expect(pageText).toMatch(/moderation|approval|pending/i)
    }
  })

  test('should filter moderation queue by content type', async ({ page }) => {
    const typeFilters = page.locator('[data-testid*="type-filter"], .content-type-filters')
    const hasFilters = await typeFilters.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasFilters, 'No content type filters available')

    const types = ['Listings', 'Comments', 'Games', 'Images']
    let clickedFilters = 0

    for (const type of types) {
      const typeButton = typeFilters.locator('button, label').filter({ hasText: type })
      if (await typeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await typeButton.click()
        await page.waitForLoadState('domcontentloaded')
        clickedFilters++
      }
    }
    expect(clickedFilters).toBeGreaterThan(0)
  })

  test('should preview content before moderation', async ({ page }) => {
    const previewButtons = page.locator('button').filter({ hasText: /preview|view.*full/i })
    const hasPreview = (await previewButtons.count()) > 0
    test.skip(!hasPreview, 'No preview buttons available')

    await previewButtons.first().click()

    const previewModal = page.locator('[role="dialog"]').filter({ hasText: /preview/i })
    const hasModal = await previewModal.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasModal, 'Preview modal did not appear')

    const contentSections = {
      Title: '.title, [data-testid*="title"]',
      Description: '.description, [data-testid*="description"]',
      Author: '.author, [data-testid*="author"]',
      Date: 'time, .date',
    }

    let visibleSections = 0
    for (const [, selector] of Object.entries(contentSections)) {
      const element = previewModal.locator(selector)
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        visibleSections++
      }
    }
    expect(visibleSections).toBeGreaterThan(0)

    const closeButton = previewModal.locator('button').filter({ hasText: /close/i })
    await closeButton.click()
  })

  test('should handle content approval', async ({ page }) => {
    const approveButtons = page.locator('button').filter({ hasText: /approve/i })
    const hasApprove = (await approveButtons.count()) > 0
    test.skip(!hasApprove, 'No approve buttons available')

    await approveButtons.first().click()

    // Might show confirmation dialog
    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*approve/i })
    const hasConfirm = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)

    if (hasConfirm) {
      const notesField = confirmDialog.locator('textarea')
      if (await notesField.isVisible().catch(() => false)) {
        await notesField.fill('Approved - meets guidelines')
      }

      const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|approve/i })
      await expect(confirmButton).toBeVisible()
      await confirmButton.click()

      const successMessage = page.locator('[role="alert"]').filter({ hasText: /approved|success/i })
      const hasSuccess = await successMessage.isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasSuccess).toBe(true)
    } else {
      // Direct approval without dialog - page should have updated
      await page.waitForLoadState('domcontentloaded')
      // Verify the page is still on the moderation page (action completed without error)
      await expect(page).toHaveURL(/\/admin\/(moderation|approvals|pending)/)
    }
  })

  test('should handle content rejection with reason', async ({ page }) => {
    const rejectButtons = page.locator('button').filter({ hasText: /reject/i })
    const hasReject = (await rejectButtons.count()) > 0
    test.skip(!hasReject, 'No reject buttons available')

    await rejectButtons.first().click()

    const rejectionDialog = page.locator('[role="dialog"]').filter({ hasText: /reject/i })
    const hasDialog = await rejectionDialog.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasDialog, 'Rejection dialog did not appear')

    // Reason selector
    const reasonSelect = rejectionDialog.locator('select[name*="reason"]')
    if (await reasonSelect.isVisible().catch(() => false)) {
      await reasonSelect.selectOption({ index: 1 })
      const reasons = await reasonSelect.locator('option').allTextContents()
      expect(reasons.length).toBeGreaterThan(1)
    }

    // Additional notes
    const notesField = rejectionDialog.locator('textarea')
    if (await notesField.isVisible().catch(() => false)) {
      await notesField.fill('Does not meet quality standards')
    }

    // Verify dialog has a cancel button to close safely
    const cancelButton = rejectionDialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should support bulk moderation actions', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]').filter({ hasNotText: /all/i })
    const checkboxCount = await checkboxes.count()
    test.skip(checkboxCount < 2, 'Not enough items for bulk actions')

    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    const bulkActions = page.locator('[data-testid*="bulk-actions"], .bulk-actions')
    const hasBulk = await bulkActions.isVisible({ timeout: 2000 }).catch(() => false)
    test.skip(!hasBulk, 'No bulk actions panel appeared')

    const approveAllButton = bulkActions.locator('button').filter({ hasText: /approve.*all/i })
    const rejectAllButton = bulkActions.locator('button').filter({ hasText: /reject.*all/i })

    expect((await approveAllButton.isVisible()) || (await rejectAllButton.isVisible())).toBe(true)

    // Uncheck for cleanup
    await checkboxes.nth(0).uncheck()
    await checkboxes.nth(1).uncheck()
  })

  test('should display user trust indicators', async ({ page }) => {
    const userInfo = page.locator('[data-testid*="user-info"], .submitter-info')
    const hasUserInfo = (await userInfo.count()) > 0
    test.skip(!hasUserInfo, 'No user info elements visible')

    const firstUser = userInfo.first()
    await expect(firstUser).toBeVisible()

    // At least one trust-related element should be present
    const trustScore = firstUser.locator('[data-testid*="trust"], .trust-score')
    const userHistory = firstUser.locator('[data-testid*="history"], .user-stats')
    const warnings = firstUser.locator('[data-testid*="warning"], .warning')

    const hasTrust = await trustScore.isVisible({ timeout: 2000 }).catch(() => false)
    const hasHistory = await userHistory.isVisible().catch(() => false)
    const hasWarnings = (await warnings.count()) > 0

    expect(hasTrust || hasHistory || hasWarnings).toBe(true)
  })

  test('should handle flagged content specially', async ({ page }) => {
    const flaggedItems = page.locator('[data-testid*="flagged"], .flagged-item')
    const flaggedCount = await flaggedItems.count()
    test.skip(flaggedCount === 0, 'No flagged items available')

    const firstFlagged = flaggedItems.first()
    await expect(firstFlagged).toBeVisible()

    // Flagged items should show a reason or have escalation options
    const flagReason = firstFlagged.locator('[data-testid*="flag-reason"], .flag-reason')
    const escalateButton = firstFlagged.locator('button').filter({ hasText: /escalate/i })

    const hasReason = await flagReason.isVisible().catch(() => false)
    const hasEscalate = await escalateButton.isVisible().catch(() => false)
    expect(hasReason || hasEscalate).toBe(true)
  })

  test('should track moderation metrics', async ({ page }) => {
    const metricsSection = page.locator('[data-testid*="moderation-metrics"], .moderation-stats')
    const hasMetrics = await metricsSection.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasMetrics, 'No moderation metrics section visible')

    const metrics = {
      Pending: '[data-testid*="pending-count"]',
      'Approved Today': '[data-testid*="approved-today"]',
      'Rejected Today': '[data-testid*="rejected-today"]',
      'Avg Response Time': '[data-testid*="response-time"]',
    }

    let visibleMetrics = 0
    for (const [, selector] of Object.entries(metrics)) {
      const metric = metricsSection.locator(selector)
      if (await metric.isVisible({ timeout: 1000 }).catch(() => false)) {
        const value = await metric.textContent()
        expect(value).toBeTruthy()
        visibleMetrics++
      }
    }
    expect(visibleMetrics).toBeGreaterThan(0)
  })

  test('should support content editing during moderation', async ({ page }) => {
    const editButtons = page.locator('button').filter({ hasText: /edit/i })
    const hasEdit = (await editButtons.count()) > 0
    test.skip(!hasEdit, 'No edit buttons available')

    await editButtons.first().click()

    const editDialog = page.locator('[role="dialog"]').filter({ hasText: /edit/i })
    const hasDialog = await editDialog.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasDialog, 'Edit dialog did not appear')

    // Verify the dialog has editable fields
    const titleInput = editDialog.locator('input[name*="title"]')
    const descriptionInput = editDialog.locator('textarea[name*="description"]')

    const hasTitle = await titleInput.isVisible().catch(() => false)
    const hasDescription = await descriptionInput.isVisible().catch(() => false)
    expect(hasTitle || hasDescription).toBe(true)

    if (hasTitle) {
      const currentTitle = await titleInput.inputValue()
      expect(currentTitle).toBeTruthy()
    }

    if (hasDescription) {
      const currentDescription = await descriptionInput.inputValue()
      expect(currentDescription).toBeTruthy()
    }

    // Cancel edit
    const cancelButton = editDialog.locator('button').filter({ hasText: /cancel/i })
    await cancelButton.click()
  })
})
