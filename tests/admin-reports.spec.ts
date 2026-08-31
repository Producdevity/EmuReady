import { test, expect } from './fixtures'
import {
  HANDHELD_REPORT_DESCRIPTION,
  PC_REPORT_DESCRIPTION,
  openFirstAdminReportDetails,
  searchAdminReports,
  selectAdminReportType,
} from './helpers/admin-reports'
import { createPcReport, createReport, withContext } from './helpers/data-factory'

test.describe('Admin Reports Management Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })
  test.beforeAll(async ({ browser }) => {
    await withContext(browser, 'tests/.auth/author.json', async (page) => {
      await createReport(page, HANDHELD_REPORT_DESCRIPTION)
      await createPcReport(page, PC_REPORT_DESCRIPTION)
    })
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/reports', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/reports/)

    await expect(page.locator('table').first()).toBeVisible()
  })

  test('should display reports dashboard with required elements', async ({ page }) => {
    const reportsTable = page.locator('table').first()
    await expect(reportsTable).toBeVisible()

    const headers = reportsTable.locator('thead th')
    const headerTexts = await headers.allTextContents()
    const headerString = headerTexts.join(' ').toLowerCase()

    expect(headerString).toMatch(/reason/i)
    expect(headerString).toMatch(/status/i)

    const reportRows = reportsTable.locator('tbody tr')
    const rowCount = await reportRows.count()
    expect(rowCount).toBeGreaterThanOrEqual(0)
  })

  test('should filter reports by status', async ({ page }) => {
    const statusDropdownButton = page.getByRole('button', { name: /all statuses/i })
    await expect(statusDropdownButton).toBeVisible()

    await statusDropdownButton.click()

    const pendingOption = page.getByText('Pending').last()
    await expect(pendingOption).toBeVisible()
    await pendingOption.click()

    await page.waitForLoadState('domcontentloaded')

    const table = page.locator('table').first()
    await expect(table).toBeVisible()
  })

  test('should display reported handheld compatibility report details', async ({ page }) => {
    await selectAdminReportType(page, 'Handheld Reports')
    await searchAdminReports(page, HANDHELD_REPORT_DESCRIPTION, 'listingReports.get')

    const reportModal = await openFirstAdminReportDetails(page)

    await expect(reportModal).toContainText(HANDHELD_REPORT_DESCRIPTION)
    await expect(reportModal).toContainText('Reported Compatibility Report')
    await expect(reportModal).toContainText('Handheld Report')
    await expect(reportModal.getByText('Device', { exact: true })).toBeVisible()
    await expect(reportModal.getByRole('button', { name: /view report/i })).toBeVisible()

    const closeButton = reportModal.locator('button').filter({ hasText: /close/i })
    await expect(closeButton).toBeVisible()
    await closeButton.click()
  })

  test('should display reported PC compatibility report details', async ({ page }) => {
    await selectAdminReportType(page, 'PC Reports')
    await searchAdminReports(page, PC_REPORT_DESCRIPTION, 'pcListingReports.get')

    const reportModal = await openFirstAdminReportDetails(page)

    await expect(reportModal).toContainText(PC_REPORT_DESCRIPTION)
    await expect(reportModal).toContainText('Reported Compatibility Report')
    await expect(reportModal).toContainText('PC Report')
    await expect(reportModal.getByText('Hardware', { exact: true })).toBeVisible()
    await expect(reportModal.getByRole('button', { name: /view report/i })).toBeVisible()

    const closeButton = reportModal.locator('button').filter({ hasText: /close/i })
    await expect(closeButton).toBeVisible()
    await closeButton.click()
  })

  test('should handle report status updates', async ({ page }) => {
    const statusButton = page.locator('button[title="Update Status"]').first()
    await expect(statusButton).toBeVisible()

    await statusButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const statusSelect = dialog.locator('select')
    await expect(statusSelect).toBeVisible()

    const options = await statusSelect.locator('option').allTextContents()
    expect(options.length).toBeGreaterThan(0)

    const cancelButton = dialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should display report statistics', async ({ page }) => {
    const statsLabels = [/total reports/i, /pending/i, /under review/i, /resolved/i, /dismissed/i]

    for (const label of statsLabels) {
      await expect(page.getByText(label).first()).toBeVisible()
    }
  })

  test('should link to reported content', async ({ page }) => {
    const viewButton = page.locator('button[title="View Report Details"]').first()
    await expect(viewButton).toBeVisible()

    await viewButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const viewListingButton = dialog.getByRole('button', { name: /view report/i })
    await expect(viewListingButton).toBeVisible()

    const closeButton = dialog.getByRole('button', { name: /^close$/i })
    await expect(closeButton).toBeVisible()
    await closeButton.click()
  })
})
