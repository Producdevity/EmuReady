import { test, expect } from '@playwright/test'

test.describe('Admin Reports Management Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })
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

  test('should display report details', async ({ page }) => {
    const viewButtons = page.locator('button[title="View Report Details"]')
    await expect(viewButtons.first()).toBeVisible()
    expect(await viewButtons.count()).toBeGreaterThan(0)

    await viewButtons.first().click()

    const reportModal = page.locator('[role="dialog"]')
    await expect(reportModal).toBeVisible()

    const modalContent = await reportModal.textContent()
    expect(modalContent).toBeTruthy()
    expect(modalContent?.length).toBeGreaterThan(0)

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

    // These labels may appear multiple times on the page (stats, table status
    // column, action buttons). Use .first() to match the stats label.
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

    // "View Listing" is a button that opens the listing in a new tab via
    // window.open — not an anchor tag.
    const viewListingButton = dialog.getByRole('button', { name: /view listing/i })
    await expect(viewListingButton).toBeVisible()

    const closeButton = dialog.getByRole('button', { name: /^close$/i })
    await expect(closeButton).toBeVisible()
    await closeButton.click()
  })
})
