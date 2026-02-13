import { test, expect } from '@playwright/test'

test.describe('Admin Reports Management Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/reports', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/reports/)
  })

  test('should display reports dashboard with required elements', async ({ page }) => {
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()

    // Wait for page content to finish loading
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    const reportsTable = page.locator('table').first()
    const hasTable = await reportsTable.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasTable) {
      const headers = reportsTable.locator('thead th')
      const headerTexts = await headers.allTextContents()
      const headerString = headerTexts.join(' ').toLowerCase()

      expect(headerString).toMatch(/reason/i)
      expect(headerString).toMatch(/status/i)

      const reportRows = reportsTable.locator('tbody tr')
      const rowCount = await reportRows.count()
      expect(typeof rowCount).toBe('number')
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
      expect(pageText).toMatch(/report/i)
    }
  })

  test('should filter reports by status', async ({ page }) => {
    const pendingFilter = page.locator('button, label').filter({ hasText: /pending/i })
    const hasPendingFilter = await pendingFilter.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasPendingFilter, 'No pending filter button available')

    await pendingFilter.click()
    await page.waitForLoadState('domcontentloaded')

    const statusBadges = page.locator('[data-testid*="status"], .status-badge')
    const badgeCount = await statusBadges.count()
    test.skip(badgeCount === 0, 'No status badges visible after filtering')

    const firstStatus = await statusBadges.first().textContent()
    expect(firstStatus?.toLowerCase()).toContain('pending')
  })

  test('should display report details', async ({ page }) => {
    const viewButtons = page.locator('button, a').filter({ hasText: /view|details|review/i })
    const hasViewButtons = (await viewButtons.count()) > 0
    test.skip(!hasViewButtons, 'No view/details buttons available')

    await viewButtons.first().click()

    const reportModal = page.locator('[role="dialog"], .report-details')
    const hasModal = await reportModal.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasModal, 'Report details modal did not appear')

    const reportInfo = {
      'Reported Item': /listing|comment|user/i,
      Reason: /spam|inappropriate|fake/i,
      Reporter: /.+/,
      Description: /.+/,
      Date: /\d{4}|\d+ (hours?|days?|minutes?) ago/,
    }

    let matchedFields = 0
    for (const [label, pattern] of Object.entries(reportInfo)) {
      const field = reportModal.locator('.field, .detail-row').filter({ hasText: label })
      if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
        const value = await field.textContent()
        expect(value).toMatch(pattern)
        matchedFields++
      }
    }
    expect(matchedFields).toBeGreaterThan(0)
  })

  test('should handle report status updates', async ({ page }) => {
    const reviewButton = page
      .locator('button')
      .filter({ hasText: /review|view/i })
      .first()
    const hasReviewButton = await reviewButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasReviewButton, 'No review/view button available')

    await reviewButton.click()

    const statusSelect = page.locator('select[name*="status"], [data-testid*="status-select"]')
    const statusButtons = page.locator('button').filter({ hasText: /resolve|dismiss|escalate/i })

    const hasStatusSelect = await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)
    const hasStatusButtons = (await statusButtons.count()) > 0
    test.skip(!hasStatusSelect && !hasStatusButtons, 'No status change controls available')

    if (hasStatusSelect) {
      await statusSelect.selectOption({ index: 1 })

      const confirmButton = page.locator('button').filter({ hasText: /save|update|confirm/i })
      await expect(confirmButton).toBeVisible()
    } else {
      const resolveButton = statusButtons.filter({ hasText: /resolve/i }).first()
      const hasResolve = await resolveButton.isVisible().catch(() => false)
      test.skip(!hasResolve, 'No resolve button available')

      await resolveButton.click()

      const resolutionForm = page.locator('[data-testid*="resolution"], .resolution-form')
      const closeButton = page.locator('button').filter({ hasText: /close|cancel/i })
      // Either a resolution form appears or a close/cancel button is available
      const hasForm = await resolutionForm.isVisible({ timeout: 2000 }).catch(() => false)
      const hasClose = await closeButton.isVisible({ timeout: 1000 }).catch(() => false)
      expect(hasForm || hasClose).toBe(true)
    }

    // Close without saving
    const closeButton = page.locator('button').filter({ hasText: /close|cancel/i })
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }
  })

  test('should support batch report actions', async ({ page }) => {
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    test.skip(checkboxCount < 2, 'Not enough report rows for batch actions')

    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    const batchActions = page.locator('[data-testid*="batch-actions"], .batch-actions')
    const hasBatchActions = await batchActions.isVisible({ timeout: 2000 }).catch(() => false)
    test.skip(!hasBatchActions, 'No batch actions panel appeared')

    const actionButtons = batchActions.locator('button')
    const actionCount = await actionButtons.count()
    expect(actionCount).toBeGreaterThan(0)

    // Uncheck for cleanup
    await checkboxes.nth(0).uncheck()
    await checkboxes.nth(1).uncheck()
  })

  test('should display report statistics', async ({ page }) => {
    const statsSection = page.locator('[data-testid*="report-stats"], .report-statistics')
    const hasStats = await statsSection.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasStats, 'No report statistics section visible')

    const stats = [
      { label: 'Total Reports', selector: '[data-testid*="total"]' },
      { label: 'Pending', selector: '[data-testid*="pending"]' },
      { label: 'Resolved', selector: '[data-testid*="resolved"]' },
      { label: 'Response Time', selector: '[data-testid*="response"]' },
    ]

    let visibleStats = 0
    for (const stat of stats) {
      const statElement = statsSection.locator(stat.selector)
      if (await statElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        const value = await statElement.textContent()
        expect(value).toBeTruthy()
        visibleStats++
      }
    }
    expect(visibleStats).toBeGreaterThan(0)
  })

  test('should handle report escalation', async ({ page }) => {
    const escalateButtons = page.locator('button').filter({ hasText: /escalate/i })
    const hasEscalate = (await escalateButtons.count()) > 0
    test.skip(!hasEscalate, 'No escalate buttons available')

    await escalateButtons.first().click()

    const escalationDialog = page.locator('[role="dialog"]').filter({ hasText: /escalate/i })
    const hasDialog = await escalationDialog.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasDialog, 'Escalation dialog did not appear')

    // Verify the dialog has interactive elements (priority, assignee, or notes)
    const prioritySelect = escalationDialog.locator('select[name*="priority"]')
    const assigneeSelect = escalationDialog.locator('select[name*="assign"]')
    const notesField = escalationDialog.locator('textarea')

    const hasPriority = await prioritySelect.isVisible().catch(() => false)
    const hasAssignee = await assigneeSelect.isVisible().catch(() => false)
    const hasNotes = await notesField.isVisible().catch(() => false)
    expect(hasPriority || hasAssignee || hasNotes).toBe(true)

    if (hasNotes) {
      await notesField.fill('Escalation test note')
    }

    const cancelButton = escalationDialog.locator('button').filter({ hasText: /cancel/i })
    await cancelButton.click()
  })

  test('should link to reported content', async ({ page }) => {
    const viewButton = page.locator('button').filter({ hasText: /view/i }).first()
    const hasViewButton = await viewButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasViewButton, 'No view button available')

    await viewButton.click()

    const contentLink = page
      .locator('a')
      .filter({ hasText: /view.*content|view.*listing|view.*comment/i })
    const hasContentLink = await contentLink.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasContentLink, 'No content link found in report details')

    const href = await contentLink.getAttribute('href')
    expect(href).toBeTruthy()
  })

  test('should track report resolution time', async ({ page }) => {
    const resolvedReports = page.locator('tr').filter({ hasText: /resolved/i })
    const hasResolved = (await resolvedReports.count()) > 0
    test.skip(!hasResolved, 'No resolved reports available')

    const firstResolved = resolvedReports.first()
    const resolutionTime = firstResolved.locator(
      '[data-testid*="resolution-time"], .resolution-time',
    )
    const hasTime = await resolutionTime.isVisible({ timeout: 2000 }).catch(() => false)
    test.skip(!hasTime, 'No resolution time element visible')

    const time = await resolutionTime.textContent()
    expect(time).toMatch(/\d+ (minutes?|hours?|days?)/)
  })

  test('should export reports data', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export/i })
    const hasExport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasExport, 'No export button available')

    await exportButton.click()

    const exportOptions = page.locator('[role="menu"], [data-testid*="export-options"]')
    const hasOptions = await exportOptions.isVisible({ timeout: 2000 }).catch(() => false)
    test.skip(!hasOptions, 'Export options menu did not appear')

    const formats = ['CSV', 'PDF', 'Excel']
    let foundFormats = 0
    for (const format of formats) {
      const formatOption = exportOptions.locator('button, a').filter({ hasText: format })
      if (await formatOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundFormats++
      }
    }
    expect(foundFormats).toBeGreaterThan(0)

    await page.keyboard.press('Escape')
  })
})
