import { test, expect } from './fixtures'
import {
  createPendingHandheldListingFixture,
  createPendingPcListingFixture,
} from './helpers/data-factory'
import type { Locator, Page } from '@playwright/test'

async function openReviewDialog(page: Page, path: string, name: RegExp) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.getByRole('button', { name }).click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  return dialog
}

async function expectSharedReviewDetails(dialog: Locator) {
  await expect(dialog.getByRole('heading', { name: 'Game' })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Emulator' })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Submitted By' })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Performance' })).toBeVisible()
}

async function closeDialog(dialog: Locator) {
  await dialog.getByRole('button', { name: /cancel/i }).click()
  await expect(dialog).toBeHidden()
}

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

  test('should use the shared approval modal on listing detail pages', async ({ page }) => {
    const fixture = await createPendingHandheldListingFixture()

    const approveDialog = await openReviewDialog(page, fixture.path, /^approve listing$/i)
    await expect(approveDialog.getByText(/approve listing:/i)).toBeVisible()
    await expectSharedReviewDetails(approveDialog)
    await expect(approveDialog.getByText('Device')).toBeVisible()
    await expect(
      approveDialog.getByRole('button', { name: /confirm approval|approve anyway/i }),
    ).toBeVisible()
    await closeDialog(approveDialog)

    const rejectDialog = await openReviewDialog(page, fixture.path, /^reject listing$/i)
    await expect(rejectDialog.getByText(/reject listing:/i)).toBeVisible()
    await expectSharedReviewDetails(rejectDialog)
    await expect(rejectDialog.getByText('Missing information')).toBeVisible()
    await expect(rejectDialog.getByRole('button', { name: /confirm rejection/i })).toBeVisible()
    await closeDialog(rejectDialog)
  })

  test('should use the shared approval modal on PC listing detail pages', async ({ page }) => {
    const fixture = await createPendingPcListingFixture()

    const approveDialog = await openReviewDialog(page, fixture.path, /^approve pc listing$/i)
    await expect(approveDialog.getByText(/approve pc listing:/i)).toBeVisible()
    await expectSharedReviewDetails(approveDialog)
    await expect(approveDialog.getByText('Hardware')).toBeVisible()
    await expect(approveDialog.getByText(/CPU:/)).toBeVisible()
    await expect(
      approveDialog.getByRole('button', { name: /confirm approval|approve anyway/i }),
    ).toBeVisible()
    await closeDialog(approveDialog)

    const rejectDialog = await openReviewDialog(page, fixture.path, /^reject pc listing$/i)
    await expect(rejectDialog.getByText(/reject pc listing:/i)).toBeVisible()
    await expectSharedReviewDetails(rejectDialog)
    await expect(rejectDialog.getByText('Missing information')).toBeVisible()
    await expect(rejectDialog.getByRole('button', { name: /confirm rejection/i })).toBeVisible()
    await closeDialog(rejectDialog)
  })
})
