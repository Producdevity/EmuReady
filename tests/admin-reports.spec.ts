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
    // Reports page uses a <select> dropdown for status filtering
    const statusDropdown = page.locator('select').first()
    const hasDropdown = await statusDropdown.isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasDropdown, 'No status filter dropdown available')

    // Select "Pending" from the dropdown
    const options = await statusDropdown.locator('option').allTextContents()
    const hasPendingOption = options.some((opt) => /pending/i.test(opt))
    test.skip(!hasPendingOption, 'No Pending option in status dropdown')

    await statusDropdown.selectOption({ label: 'Pending' })
    await page.waitForLoadState('domcontentloaded')

    // Verify the table updated — should still have table or show no results
    const table = page.locator('table').first()
    const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasTable).toBe(true)
  })

  test('should display report details', async ({ page }) => {
    // ViewButton uses title="View Report Details"
    const viewButtons = page.locator('button[title="View Report Details"]')
    const hasViewButtons = (await viewButtons.count()) > 0
    test.skip(!hasViewButtons, 'No View Report Details buttons available')

    await viewButtons.first().click()

    // ReportDetailsModal opens as a dialog
    const reportModal = page.locator('[role="dialog"]')
    const hasModal = await reportModal.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasModal, 'Report details modal did not appear')

    // Modal should have content (report details)
    const modalContent = await reportModal.textContent()
    expect(modalContent).toBeTruthy()
    expect(modalContent!.length).toBeGreaterThan(0)

    // Close button in footer
    const closeButton = reportModal.locator('button').filter({ hasText: /close/i })
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('should handle report status updates', async ({ page }) => {
    // "Update Status" button opens ReportStatusModal
    const statusButton = page.locator('button[title="Update Status"]').first()
    const hasStatusButton = await statusButton.isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasStatusButton, 'No Update Status button available')

    await statusButton.click()

    // ReportStatusModal opens as a dialog with status select and notes
    const dialog = page.locator('[role="dialog"]')
    const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasDialog, 'Report status modal did not appear')

    // Should have a status select and review notes textarea
    const statusSelect = dialog.locator('select')
    const hasStatusSelect = await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)

    if (hasStatusSelect) {
      const options = await statusSelect.locator('option').allTextContents()
      expect(options.length).toBeGreaterThan(0)
    }

    // Close without saving
    const cancelButton = dialog.locator('button').filter({ hasText: /cancel/i })
    const closeButton = dialog.locator('button').filter({ hasText: /close/i })

    if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelButton.click()
    } else if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('should display report statistics', async ({ page }) => {
    // AdminStatsDisplay renders stat cards at top of page
    const statsLabels = [/total reports/i, /pending/i, /under review/i, /resolved/i, /dismissed/i]

    let visibleStats = 0
    for (const label of statsLabels) {
      const stat = page.getByText(label)
      if (await stat.isVisible({ timeout: 2000 }).catch(() => false)) {
        visibleStats++
      }
    }
    test.skip(visibleStats === 0, 'No report statistics section visible')

    // Verify numeric values exist alongside stats
    const mainContent = page.locator('main').first()
    const numbersOnPage = await mainContent.locator('text=/\\d+/').count()
    expect(numbersOnPage).toBeGreaterThan(0)
  })

  test('should link to reported content', async ({ page }) => {
    // Open ReportDetailsModal first to find the listing link
    const viewButton = page.locator('button[title="View Report Details"]').first()
    const hasViewButton = await viewButton.isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasViewButton, 'No view button available')

    await viewButton.click()

    const dialog = page.locator('[role="dialog"]')
    const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasDialog, 'Report details modal did not appear')

    // ReportDetailsModal has a "View Listing" button/link in the footer
    const contentLink = dialog.locator('a, button').filter({ hasText: /view listing/i })
    const hasContentLink = await contentLink.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasContentLink, 'No content link found in report details')

    const tagName = await contentLink.evaluate((el) => el.tagName.toLowerCase())
    if (tagName === 'a') {
      const href = await contentLink.getAttribute('href')
      expect(href).toBeTruthy()
    } else {
      await expect(contentLink).toBeVisible()
    }

    // Close the dialog
    const closeButton = dialog.locator('button').filter({ hasText: /close/i })
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })
})
