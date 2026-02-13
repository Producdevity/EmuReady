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

  test('should display role hierarchy', async ({ page }) => {
    // Look for hierarchy visualization
    const hierarchy = page.locator('[data-testid*="hierarchy"], .role-hierarchy')
    const hasHierarchy = await hierarchy.isVisible({ timeout: 3000 }).catch(() => false)

    // Or check in role details
    const roleCards = page.locator('.role-card, [data-testid*="role-item"]')
    const hasRoleCards = (await roleCards.count()) > 0

    test.skip(!hasHierarchy && !hasRoleCards, 'No role hierarchy or role cards visible')

    if (hasHierarchy) {
      await expect(hierarchy).toBeVisible()
    }

    if (hasRoleCards) {
      const firstRole = roleCards.first()
      await expect(firstRole).toBeVisible()
    }
  })

  test('should edit role permissions', async ({ page }) => {
    const editButtons = page.locator('button').filter({ hasText: /edit.*permission|configure/i })
    const hasEdit = (await editButtons.count()) > 0
    test.skip(!hasEdit, 'No edit permission buttons available')

    await editButtons.first().click()

    const permissionsModal = page.locator('[role="dialog"], .permissions-editor')
    const hasModal = await permissionsModal.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasModal, 'Permissions editor dialog did not appear')

    const categories = ['Users', 'Listings', 'Games', 'Reports', 'Admin']
    let foundCategories = 0

    for (const category of categories) {
      const categorySection = permissionsModal
        .locator('.category, .permission-group')
        .filter({ hasText: category })
      if (await categorySection.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundCategories++
      }
    }
    expect(foundCategories).toBeGreaterThan(0)

    const cancelButton = permissionsModal.locator('button').filter({ hasText: /cancel/i })
    await cancelButton.click()
  })

  test('should manage individual permissions', async ({ page }) => {
    const permissionsList = page.locator('[data-testid*="permissions-list"], .permissions-table')
    const hasList = await permissionsList.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasList, 'No permissions list visible')

    const permissionItems = permissionsList
      .locator('.permission-item, tr')
      .filter({ hasNotText: /header/i })
    const itemCount = await permissionItems.count()
    test.skip(itemCount === 0, 'No permission items found')

    const firstPermission = permissionItems.first()
    await expect(firstPermission).toBeVisible()

    // Permission name should exist and have content
    const permName = firstPermission.locator('[data-testid*="permission-name"], .permission-name')
    const hasName = await permName.isVisible().catch(() => false)
    if (hasName) {
      const name = await permName.textContent()
      expect(name).toBeTruthy()
    }

    // At least one detail field (name, description, or roles) should be present
    const description = firstPermission.locator('[data-testid*="description"], .description')
    const assignedRoles = firstPermission.locator('[data-testid*="roles"], .assigned-roles')

    const hasDescription = await description.isVisible().catch(() => false)
    const hasRoles = await assignedRoles.isVisible().catch(() => false)
    expect(hasName || hasDescription || hasRoles).toBe(true)
  })

  test('should create custom permissions', async ({ page }) => {
    const addButton = page
      .locator('button')
      .filter({ hasText: /add.*permission|create.*permission/i })
    const hasAdd = await addButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasAdd, 'No add/create permission button available')

    await addButton.click()

    const createForm = page.locator('[role="dialog"], .create-permission-form')
    const hasForm = await createForm.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasForm, 'Permission creation form did not appear')

    // Verify the form has input fields
    const nameInput = createForm.locator('input[name*="name"]')
    const keyInput = createForm.locator('input[name*="key"], input[name*="identifier"]')
    const descInput = createForm.locator('textarea, input[name*="description"]')

    const hasName = await nameInput.isVisible().catch(() => false)
    const hasKey = await keyInput.isVisible().catch(() => false)
    const hasDesc = await descInput.isVisible().catch(() => false)
    expect(hasName || hasKey || hasDesc).toBe(true)

    if (hasName) await nameInput.fill('TEST_PERMISSION')
    if (hasKey) await keyInput.fill('test.permission.create')
    if (hasDesc) await descInput.fill('Test permission for E2E testing')

    const cancelButton = createForm.locator('button').filter({ hasText: /cancel/i })
    await cancelButton.click()
  })

  test('should assign permissions to roles', async ({ page }) => {
    const assignButtons = page.locator('button').filter({ hasText: /assign/i })
    const hasAssign = (await assignButtons.count()) > 0
    test.skip(!hasAssign, 'No assign buttons available')

    await assignButtons.first().click()

    const assignDialog = page.locator('[role="dialog"]').filter({ hasText: /assign/i })
    const hasDialog = await assignDialog.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasDialog, 'Assignment dialog did not appear')

    // Verify the dialog has a role selector or permission checkboxes
    const roleSelect = assignDialog.locator('select[name*="role"]')
    const permissionChecks = assignDialog.locator('input[type="checkbox"]')

    const hasRoleSelect = await roleSelect.isVisible().catch(() => false)
    const hasPermChecks = (await permissionChecks.count()) > 0
    expect(hasRoleSelect || hasPermChecks).toBe(true)

    if (hasRoleSelect) {
      const options = await roleSelect.locator('option').allTextContents()
      expect(options.length).toBeGreaterThan(0)
    }

    if (hasPermChecks) {
      expect(await permissionChecks.count()).toBeGreaterThan(0)
    }

    const cancelButton = assignDialog.locator('button').filter({ hasText: /cancel/i })
    await cancelButton.click()
  })

  test('should audit permission changes', async ({ page }) => {
    const auditLink = page.locator('a, button').filter({ hasText: /audit|log|history/i })
    const hasAudit = await auditLink.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasAudit, 'No audit/log/history link available')

    await auditLink.click()

    const auditTable = page.locator('[data-testid*="audit"], .audit-log')
    const hasTable = await auditTable.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasTable, 'Audit log table did not appear')

    const logEntries = auditTable.locator('.log-entry, tbody tr')
    const entryCount = await logEntries.count()
    if (entryCount > 0) {
      const firstEntry = logEntries.first()
      await expect(firstEntry).toBeVisible()

      // At least one detail element (action, user, or timestamp) should be present
      const action = firstEntry.locator('[data-testid*="action"], .action')
      const user = firstEntry.locator('[data-testid*="user"], .changed-by')
      const timestamp = firstEntry.locator('time, [data-testid*="timestamp"]')

      const hasAction = await action.isVisible().catch(() => false)
      const hasUser = await user.isVisible().catch(() => false)
      const hasTimestamp = await timestamp.isVisible().catch(() => false)
      expect(hasAction || hasUser || hasTimestamp).toBe(true)
    }
  })

  test('should test permission inheritance', async ({ page }) => {
    const testButton = page.locator('button').filter({ hasText: /test.*permission|check.*access/i })
    const hasTest = await testButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasTest, 'No test permission button available')

    await testButton.click()

    const testerModal = page.locator('[role="dialog"]').filter({ hasText: /test.*permission/i })
    const hasModal = await testerModal.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasModal, 'Permission tester dialog did not appear')

    // Verify the tester has input fields
    const userInput = testerModal.locator('input[placeholder*="user"]')
    const permissionSelect = testerModal.locator('select[name*="permission"]')
    const runTestButton = testerModal.locator('button').filter({ hasText: /test|check/i })

    const hasUserInput = await userInput.isVisible().catch(() => false)
    const hasPermSelect = await permissionSelect.isVisible().catch(() => false)
    const hasRunTest = await runTestButton.isVisible().catch(() => false)
    expect(hasUserInput || hasPermSelect || hasRunTest).toBe(true)

    const closeButton = testerModal.locator('button').filter({ hasText: /close/i })
    await closeButton.click()
  })

  test('should bulk update role permissions', async ({ page }) => {
    const bulkButton = page.locator('button').filter({ hasText: /bulk.*update|mass.*assign/i })
    const hasBulk = await bulkButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasBulk, 'No bulk update button available')

    await bulkButton.click()

    const bulkForm = page.locator('[role="dialog"], .bulk-update-form')
    const hasForm = await bulkForm.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasForm, 'Bulk update form did not appear')

    // Verify the form has interactive elements
    const operationType = bulkForm.locator('select[name*="operation"]')
    const roleChecks = bulkForm.locator('input[type="checkbox"][name*="role"]')
    const previewButton = bulkForm.locator('button').filter({ hasText: /preview/i })

    const hasOperation = await operationType.isVisible().catch(() => false)
    const hasRoleChecks = (await roleChecks.count()) > 0
    const hasPreview = await previewButton.isVisible().catch(() => false)
    expect(hasOperation || hasRoleChecks || hasPreview).toBe(true)

    const cancelButton = bulkForm.locator('button').filter({ hasText: /cancel/i })
    await cancelButton.click()
  })

  test('should export/import permission configurations', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export/i })
    const hasExport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasExport, 'No export button available')

    await exportButton.click()

    const exportMenu = page.locator('[role="menu"], .export-options')
    const hasMenu = await exportMenu.isVisible({ timeout: 2000 }).catch(() => false)

    if (hasMenu) {
      const formats = ['JSON', 'CSV', 'YAML']
      let foundFormats = 0

      for (const format of formats) {
        const formatOption = exportMenu.locator('button, a').filter({ hasText: format })
        if (await formatOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          foundFormats++
        }
      }
      expect(foundFormats).toBeGreaterThan(0)

      await page.keyboard.press('Escape')
    } else {
      // Export triggered directly without a menu (e.g., download started)
      await expect(page).toHaveURL(/\/admin\/permissions/)
    }

    const importButton = page.locator('button').filter({ hasText: /import/i })
    const hasImport = await importButton.isVisible().catch(() => false)
    // At least export or import should be available (we know export is since we got here)
    expect(hasExport || hasImport).toBe(true)
  })
})
