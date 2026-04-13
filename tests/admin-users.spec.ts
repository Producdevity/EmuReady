import { test, expect } from '@playwright/test'

test.describe('Admin User Management Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/users/)

    await expect(page.locator('tbody tr').first()).toBeVisible()
  })

  test('should display users list with required columns', async ({ page }) => {
    const usersTable = page.locator('table').first()
    await expect(usersTable).toBeVisible()

    const headers = usersTable.locator('thead th')
    const headerTexts = await headers.allTextContents()

    const expectedHeaders = ['Name', 'Email', 'Role', 'Actions']
    for (const header of expectedHeaders) {
      const hasHeader = headerTexts.some((text) =>
        text.toLowerCase().includes(header.toLowerCase()),
      )
      expect(hasHeader).toBe(true)
    }

    const userRows = usersTable.locator('tbody tr')
    const rowCount = await userRows.count()
    expect(rowCount).toBeGreaterThan(0)

    const firstRow = userRows.first()
    const email = await firstRow.locator('td').filter({ hasText: /@/ }).textContent()
    expect(email).toMatch(/^.+@.+\..+$/)
  })

  test('should support user search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()

    await searchInput.fill('test')
    await page.keyboard.press('Enter')

    await expect(
      page
        .locator('tbody tr')
        .first()
        .or(page.getByText(/no users found|no results/i)),
    ).toBeVisible()
  })

  test('should handle user role changes', async ({ page }) => {
    const roleButtons = page.locator('button[title="Change Role"]')
    await expect(roleButtons.first()).toBeVisible()
    expect(await roleButtons.count()).toBeGreaterThan(0)

    await roleButtons.first().click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const cancelButton = dialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should display user details modal', async ({ page }) => {
    const viewButton = page.locator('button[title="View User Details"]').first()
    await expect(viewButton).toBeVisible()

    await viewButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    const closeButton = modal.locator('button').filter({ hasText: /close/i }).first()
    await expect(closeButton).toBeVisible()
    await closeButton.click()
  })

  test('should handle user banning navigation', async ({ page }) => {
    const banButtons = page.locator('button[title="Ban User"]')
    await expect(banButtons.first()).toBeVisible()
    expect(await banButtons.count()).toBeGreaterThan(0)

    await banButtons.first().click()

    await expect(page).toHaveURL(/\/admin\/user-bans/)

    await page.goBack()
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test('should display user activity history', async ({ page }) => {
    const viewButton = page.locator('button[title="View User Details"]').first()
    await expect(viewButton).toBeVisible()

    await viewButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    // Wait for modal content to finish loading
    await expect(modal.getByText(/loading/i)).toBeHidden()

    const tabButtons = modal.locator('button').filter({ hasText: /listings|votes|trust/i })
    await expect(tabButtons.first()).toBeVisible()

    await tabButtons.first().click()

    await expect(modal).toBeVisible()

    const closeButton = modal.locator('button').filter({ hasText: /close/i }).first()
    await expect(closeButton).toBeVisible()
    await closeButton.click()
  })

  test('should display user statistics', async ({ page }) => {
    const statsLabels = [/total users/i, /authors/i]

    for (const label of statsLabels) {
      await expect(page.getByText(label).first()).toBeVisible()
    }

    const mainContent = page.locator('main').first()
    const numbersOnPage = await mainContent.locator('text=/\\d+/').count()
    expect(numbersOnPage).toBeGreaterThan(0)
  })
})
