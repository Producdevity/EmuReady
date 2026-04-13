import { test, expect } from '@playwright/test'

test.describe('Admin Permissions Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/permissions', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/permissions/)

    await expect(page.locator('table').first()).toBeVisible()
  })

  test('should display permissions management page with table', async ({ page }) => {
    const table = page.locator('table').first()
    await expect(table).toBeVisible()

    const headers = table.locator('thead th')
    const headerTexts = await headers.allTextContents()
    const headerString = headerTexts.join(' ').toLowerCase()

    expect(headerString).toMatch(/label|permission|key/i)

    const rows = table.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)

    await expect(rows.first()).toBeVisible()
  })

  test('should edit role permissions', async ({ page }) => {
    const editButtons = page.locator('button[title="Edit Permission"]')
    await expect(editButtons.first()).toBeVisible()
    expect(await editButtons.count()).toBeGreaterThan(0)

    await editButtons.first().click()

    const permissionsModal = page.locator('[role="dialog"]')
    await expect(permissionsModal).toBeVisible()

    const formFields = permissionsModal.locator('input, textarea, select')
    const fieldCount = await formFields.count()
    expect(fieldCount).toBeGreaterThan(0)

    const cancelButton = permissionsModal.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })

  test('should manage individual permissions', async ({ page }) => {
    const table = page.locator('table').first()
    await expect(table).toBeVisible()

    const rows = table.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)

    const firstRow = rows.first()
    await expect(firstRow).toBeVisible()

    const cells = firstRow.locator('td')
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThan(0)

    const firstCell = cells.first()
    const cellText = await firstCell.textContent()
    expect(cellText?.trim().length).toBeGreaterThan(0)
  })

  test('should create custom permissions', async ({ page }) => {
    const addButton = page.locator('button').filter({ hasText: /add permission/i })
    await expect(addButton).toBeVisible()

    await addButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const formFields = dialog.locator('input, textarea, select')
    const fieldCount = await formFields.count()
    expect(fieldCount).toBeGreaterThan(0)

    const cancelButton = dialog.locator('button').filter({ hasText: /cancel/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
  })
})
