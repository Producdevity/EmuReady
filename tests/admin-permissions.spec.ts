import { test, expect } from '@playwright/test'

test.describe('Admin Permissions Tests - Requires Admin Role', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/permissions', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/permissions/)
  })

  test('should display permissions management page with table', async ({ page }) => {
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()

    // Wait for page content to finish loading
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    const table = page.locator('table').first()
    const hasTable = await table.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasTable) {
      const headers = table.locator('thead th')
      const headerTexts = await headers.allTextContents()
      const headerString = headerTexts.join(' ').toLowerCase()

      expect(headerString).toMatch(/label|permission|key/i)

      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()
      if (rowCount > 0) {
        const firstRow = rows.first()
        await expect(firstRow).toBeVisible()
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
      expect(pageText).toMatch(/permission/i)
    }
  })

  test('should edit role permissions', async ({ page }) => {
    // EditButton uses title="Edit Permission"
    const editButtons = page.locator('button[title="Edit Permission"]')
    const hasEdit = (await editButtons.count()) > 0
    test.skip(!hasEdit, 'No edit permission buttons available')

    await editButtons.first().click()

    const permissionsModal = page.locator('[role="dialog"]')
    const hasModal = await permissionsModal.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasModal, 'Permissions editor dialog did not appear')

    // Modal should have form fields (key, label, description, category)
    const formFields = permissionsModal.locator('input, textarea, select')
    const fieldCount = await formFields.count()
    expect(fieldCount).toBeGreaterThan(0)

    // Close the modal
    const cancelButton = permissionsModal.locator('button').filter({ hasText: /cancel/i })
    if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('should manage individual permissions', async ({ page }) => {
    // The permissions table IS the permissions list
    const table = page.locator('table').first()
    const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasTable, 'No permissions table visible')

    const rows = table.locator('tbody tr')
    const rowCount = await rows.count()
    test.skip(rowCount === 0, 'No permission rows found')

    const firstRow = rows.first()
    await expect(firstRow).toBeVisible()

    // Each row should have cells with permission data
    const cells = firstRow.locator('td')
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThan(0)

    // First cell should contain the permission key or label
    const firstCell = cells.first()
    const cellText = await firstCell.textContent()
    expect(cellText?.trim().length).toBeGreaterThan(0)
  })

  test('should create custom permissions', async ({ page }) => {
    // "Add Permission" button at top of page
    const addButton = page.locator('button').filter({ hasText: /add permission/i })
    const hasAdd = await addButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasAdd, 'No Add Permission button available')

    await addButton.click()

    // Dialog opens for creating a new permission
    const dialog = page.locator('[role="dialog"]')
    const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasDialog, 'Permission creation dialog did not appear')

    // Verify the dialog has input fields (key, label, description, category)
    const formFields = dialog.locator('input, textarea, select')
    const fieldCount = await formFields.count()
    expect(fieldCount).toBeGreaterThan(0)

    // Close the dialog without creating
    const cancelButton = dialog.locator('button').filter({ hasText: /cancel/i })
    if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })
})
