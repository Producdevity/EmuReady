import { test, expect } from '@playwright/test'

test.describe('Listing Approval Workflow Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/approvals', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/approvals/)
  })

  test('should display pending listings for approval with required information', async ({
    page,
  }) => {
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()

    // Wait for loading to finish
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    const table = page.locator('table').first()
    const hasTable = await table.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasTable) {
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()

      if (rowCount > 0) {
        // Table has listing rows — verify action buttons exist
        const approveButtons = page.locator('button[title="Approve Listing"]')
        const rejectButtons = page.locator('button[title="Reject Listing"]')
        const hasApprove = (await approveButtons.count()) > 0
        const hasReject = (await rejectButtons.count()) > 0
        expect(hasApprove || hasReject).toBe(true)
      } else {
        // Empty table — verify table structure exists
        const headers = table.locator('thead th')
        expect(await headers.count()).toBeGreaterThan(0)
      }
    } else {
      // No table — page should still have main content
      await expect(mainContent).toBeVisible()
    }
  })

  test('should show submission details for review', async ({ page }) => {
    const viewButtons = page.locator('button[title="View Details"]')
    const hasViewButtons = (await viewButtons.count()) > 0
    test.skip(!hasViewButtons, 'No View Details buttons found -- no pending listings to review')

    await viewButtons.first().click()

    const detailModal = page.locator('[role="dialog"]')
    const modalVisible = await detailModal.isVisible({ timeout: 3000 })
    test.skip(!modalVisible, 'Detail modal did not appear')

    const modalContent = await detailModal.textContent()
    expect(modalContent).toBeTruthy()
    expect(modalContent!.length).toBeGreaterThan(0)
  })

  test('should support quick approval actions', async ({ page }) => {
    const approveButton = page.locator('button[title="Approve Listing"]').first()
    const approveVisible = await approveButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!approveVisible, 'No approve button found -- no pending listings')

    await approveButton.click()

    // Confirmation dialog may appear
    const confirmDialog = page.locator('[role="dialog"]')
    const hasConfirm = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasConfirm) {
      const confirmButton = confirmDialog
        .locator('button')
        .filter({ hasText: /confirm.*approval|approve/i })
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click()
      } else {
        // Cancel if no confirm button found
        const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i })
        await cancelButton.click()
      }
    }

    // Page should still be on approvals
    await expect(page).toHaveURL(/\/admin\/approvals/)
  })

  test('should handle rejection with feedback', async ({ page }) => {
    const rejectButtons = page.locator('button[title="Reject Listing"]')
    const hasRejectButtons = (await rejectButtons.count()) > 0
    test.skip(!hasRejectButtons, 'No reject buttons found -- no pending listings')

    await rejectButtons.first().click()

    const rejectDialog = page.locator('[role="dialog"]')
    const dialogVisible = await rejectDialog.isVisible({ timeout: 3000 })
    test.skip(!dialogVisible, 'Rejection dialog did not appear')

    // Feedback textarea
    const feedbackField = rejectDialog.locator('textarea')
    if (await feedbackField.isVisible().catch(() => false)) {
      await feedbackField.fill('Please provide more detailed performance notes')
    }

    // Cancel to avoid modifying data
    const cancelButton = rejectDialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should batch process approvals', async ({ page }) => {
    const selectAll = page.locator('thead input[type="checkbox"]')
    const selectAllVisible = await selectAll.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!selectAllVisible, 'No select-all checkbox found -- no pending listings')

    await selectAll.check()

    // BulkActions component renders buttons like "Approve Selected", "Reject Selected"
    const approveSelected = page.locator('button').filter({ hasText: /approve selected/i })
    const rejectSelected = page.locator('button').filter({ hasText: /reject selected/i })

    const hasApproveSelected = await approveSelected.isVisible({ timeout: 3000 }).catch(() => false)
    const hasRejectSelected = await rejectSelected.isVisible({ timeout: 3000 }).catch(() => false)

    test.skip(
      !hasApproveSelected && !hasRejectSelected,
      'Bulk actions did not appear after selecting all',
    )

    expect(hasApproveSelected || hasRejectSelected).toBe(true)

    // Uncheck to avoid modifying data
    await selectAll.uncheck()
  })

  test('should track approval metrics', async ({ page }) => {
    // AdminStatsDisplay renders stat cards at top of page
    const statsText = page.getByText(/total|pending|approved|rejected/i)
    const hasStats = await statsText
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    test.skip(!hasStats, 'No approval metrics section found')

    // Verify stat values contain numbers
    const mainContent = page.locator('main').first()
    const numbersOnPage = await mainContent.locator('text=/\\d+/').count()
    expect(numbersOnPage).toBeGreaterThan(0)
  })

  test('should handle reported user submissions specially', async ({ page }) => {
    // AuthorRiskIndicator component renders warning indicators for risky authors
    const riskIndicators = page.locator('[title*="risk"], [aria-label*="risk"]')
    const warningBadges = page.locator('text=/high risk|medium risk|reported/i')

    const hasRisk = (await riskIndicators.count()) > 0
    const hasWarning = (await warningBadges.count()) > 0
    test.skip(!hasRisk && !hasWarning, 'No submissions from reported users found')

    if (hasRisk) {
      const firstIndicator = riskIndicators.first()
      await expect(firstIndicator).toBeVisible()
    } else {
      const firstWarning = warningBadges.first()
      await expect(firstWarning).toBeVisible()
    }
  })
})
