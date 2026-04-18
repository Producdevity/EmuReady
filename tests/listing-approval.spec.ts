import { test, expect } from '@playwright/test'

test.describe('Listing Approval Workflow Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/approvals', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/approvals/)

    await expect(page.locator('main').first()).toBeVisible()
  })

  test('should display pending listings for approval with required information', async ({
    page,
  }) => {
    const table = page.locator('table').first()
    await expect(table).toBeVisible()

    const approveButtons = page.locator('button[title="Approve Listing"]')
    const rejectButtons = page.locator('button[title="Reject Listing"]')

    expect(await approveButtons.count()).toBeGreaterThan(0)
    expect(await rejectButtons.count()).toBeGreaterThan(0)
  })

  test('should track approval metrics', async ({ page }) => {
    const statsText = page.getByText(/total|pending|approved|rejected/i)
    await expect(statsText.first()).toBeVisible()

    const mainContent = page.locator('main').first()
    const numbersOnPage = await mainContent.locator('text=/\\d+/').count()
    expect(numbersOnPage).toBeGreaterThan(0)
  })

  test('should show submission details for review', async ({ page }) => {
    const table = page.locator('table').first()
    await expect(table).toBeVisible()

    const viewLinks = page.locator('tbody a:has(button[title="View Details"])')
    await expect(viewLinks.first()).toBeVisible()

    const href = await viewLinks.first().getAttribute('href')
    expect(href).toMatch(/\/listings\/[^/]+/)
  })

  test('should handle rejection with feedback', async ({ page }) => {
    const rejectButtons = page.locator('button[title="Reject Listing"]')
    await expect(rejectButtons.first()).toBeVisible()

    await rejectButtons.first().click()

    const rejectDialog = page.locator('[role="dialog"]')
    await expect(rejectDialog).toBeVisible()

    const feedbackField = rejectDialog.locator('textarea')
    await expect(feedbackField).toBeVisible()
    await feedbackField.fill('Please provide more detailed performance notes')

    const cancelButton = rejectDialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should support quick approval actions', async ({ page }) => {
    const approveButton = page.locator('button[title="Approve Listing"]').first()
    await expect(approveButton).toBeVisible()

    await approveButton.click()

    const confirmDialog = page.locator('[role="dialog"]')
    await expect(confirmDialog).toBeVisible()

    const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()

    await expect(page).toHaveURL(/\/admin\/approvals/)
  })

  test('should batch process approvals', async ({ page }) => {
    const selectAll = page.locator('thead input[type="checkbox"]')
    await expect(selectAll).toBeVisible()

    await selectAll.check()

    const approveSelected = page.locator('button').filter({ hasText: /approve selected/i })
    await expect(approveSelected).toBeVisible()

    await selectAll.uncheck()
  })
})
