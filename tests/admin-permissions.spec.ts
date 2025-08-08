import { test, expect } from '@playwright/test'

test.describe('Admin Permissions Tests - Requires Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/permissions')
    // Verify admin access - test should fail if not admin
    await expect(page).toHaveURL(/\/admin\/permissions/)
  })

  test('should display permissions management page with role hierarchy', async ({ page }) => {
    // Roles section must be present
    const rolesSection = page.locator('[data-testid*="roles"], .roles-section')
    await expect(rolesSection).toBeVisible()
    // All roles must be listed
    const roles = ['USER', 'AUTHOR', 'DEVELOPER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']

    for (const role of roles) {
      const roleCard = rolesSection
        .locator('.role-card, [data-testid*="role"]')
        .filter({ hasText: role })
      await expect(roleCard).toBeVisible()

      // Each role should show user count
      const userCount = roleCard.locator('[data-testid*="user-count"], .user-count')
      await expect(userCount).toBeVisible()

      const count = await userCount.textContent()
      expect(count).toMatch(/\d+/)
    }
  })

  test('should display role hierarchy', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Look for hierarchy visualization
      const hierarchy = page.locator('[data-testid*="hierarchy"], .role-hierarchy')

      if (await hierarchy.isVisible({ timeout: 3000 })) {
        console.log('Role hierarchy visualization present')

        // Check for inheritance indicators
        const inheritanceArrows = hierarchy.locator('.inheritance-arrow, [data-testid*="inherits"]')
        if ((await inheritanceArrows.count()) > 0) {
          console.log('Shows permission inheritance')
        }
      }

      // Or check in role details
      const roleCards = page.locator('.role-card, [data-testid*="role-item"]')
      if ((await roleCards.count()) > 0) {
        const firstRole = roleCards.first()
        const inheritsFrom = firstRole.locator('[data-testid*="inherits"], .inherits-from')

        if (await inheritsFrom.isVisible()) {
          const inheritance = await inheritsFrom.textContent()
          console.log(`Inheritance info: ${inheritance}`)
        }
      }
    }
  })

  test('should edit role permissions', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Find edit button for a role
      const editButtons = page.locator('button').filter({ hasText: /edit.*permission|configure/i })

      if ((await editButtons.count()) > 0) {
        await editButtons.first().click()

        // Should show permissions editor
        const permissionsModal = page.locator('[role="dialog"], .permissions-editor')

        if (await permissionsModal.isVisible({ timeout: 3000 })) {
          // Check for permission categories
          const categories = ['Users', 'Listings', 'Games', 'Reports', 'Admin']

          for (const category of categories) {
            const categorySection = permissionsModal
              .locator('.category, .permission-group')
              .filter({ hasText: category })
            if (await categorySection.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`✓ Permission category: ${category}`)

              // Check for individual permissions
              const permissions = categorySection.locator('input[type="checkbox"]')
              const permCount = await permissions.count()
              console.log(`  ${permCount} permissions in ${category}`)
            }
          }

          // Close without saving
          const cancelButton = permissionsModal.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })

  test('should manage individual permissions', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Look for permissions list
      const permissionsList = page.locator('[data-testid*="permissions-list"], .permissions-table')

      if (await permissionsList.isVisible({ timeout: 3000 })) {
        // Check permission structure
        const permissionItems = permissionsList
          .locator('.permission-item, tr')
          .filter({ hasNotText: /header/i })

        if ((await permissionItems.count()) > 0) {
          const firstPermission = permissionItems.first()

          // Permission name
          const permName = firstPermission.locator(
            '[data-testid*="permission-name"], .permission-name',
          )
          const name = await permName.textContent()
          console.log(`Permission: ${name}`)

          // Description
          const description = firstPermission.locator('[data-testid*="description"], .description')
          if (await description.isVisible()) {
            console.log(`Description: ${await description.textContent()}`)
          }

          // Assigned roles
          const assignedRoles = firstPermission.locator('[data-testid*="roles"], .assigned-roles')
          if (await assignedRoles.isVisible()) {
            const roles = await assignedRoles.textContent()
            console.log(`Assigned to: ${roles}`)
          }
        }
      }
    }
  })

  test('should create custom permissions', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Add permission button
      const addButton = page
        .locator('button')
        .filter({ hasText: /add.*permission|create.*permission/i })

      if (await addButton.isVisible({ timeout: 3000 })) {
        await addButton.click()

        // Permission creation form
        const createForm = page.locator('[role="dialog"], .create-permission-form')

        if (await createForm.isVisible({ timeout: 3000 })) {
          // Permission name
          const nameInput = createForm.locator('input[name*="name"]')
          if (await nameInput.isVisible()) {
            await nameInput.fill('TEST_PERMISSION')
          }

          // Permission key/identifier
          const keyInput = createForm.locator('input[name*="key"], input[name*="identifier"]')
          if (await keyInput.isVisible()) {
            await keyInput.fill('test.permission.create')
          }

          // Description
          const descInput = createForm.locator('textarea, input[name*="description"]')
          if (await descInput.isVisible()) {
            await descInput.fill('Test permission for E2E testing')
          }

          // Category/Module
          const categorySelect = createForm.locator('select[name*="category"]')
          if (await categorySelect.isVisible()) {
            await categorySelect.selectOption({ index: 1 })
          }

          console.log('Custom permission form available')

          // Cancel
          const cancelButton = createForm.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })

  test('should assign permissions to roles', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Find assign button
      const assignButtons = page.locator('button').filter({ hasText: /assign/i })

      if ((await assignButtons.count()) > 0) {
        await assignButtons.first().click()

        // Assignment dialog
        const assignDialog = page.locator('[role="dialog"]').filter({ hasText: /assign/i })

        if (await assignDialog.isVisible({ timeout: 3000 })) {
          // Role selector
          const roleSelect = assignDialog.locator('select[name*="role"]')
          if (await roleSelect.isVisible()) {
            const options = await roleSelect.locator('option').allTextContents()
            console.log('Available roles:', options.filter((o) => o).join(', '))
          }

          // Permission selector (might be checkboxes)
          const permissionChecks = assignDialog.locator('input[type="checkbox"]')
          if ((await permissionChecks.count()) > 0) {
            console.log(`${await permissionChecks.count()} permissions available to assign`)

            // Check first permission
            await permissionChecks.first().check()
          }

          // Effective date
          const effectiveDate = assignDialog.locator('input[type="date"]')
          if (await effectiveDate.isVisible()) {
            console.log('Can set effective date for permissions')
          }

          // Cancel
          const cancelButton = assignDialog.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })

  test('should audit permission changes', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Audit log link/tab
      const auditLink = page.locator('a, button').filter({ hasText: /audit|log|history/i })

      if (await auditLink.isVisible({ timeout: 3000 })) {
        await auditLink.click()

        // Audit log table
        const auditTable = page.locator('[data-testid*="audit"], .audit-log')

        if (await auditTable.isVisible({ timeout: 3000 })) {
          // Check log entries
          const logEntries = auditTable.locator('.log-entry, tbody tr')
          const entryCount = await logEntries.count()

          console.log(`${entryCount} audit log entries`)

          if (entryCount > 0) {
            const firstEntry = logEntries.first()

            // Action type
            const action = firstEntry.locator('[data-testid*="action"], .action')
            if (await action.isVisible()) {
              console.log(`Action: ${await action.textContent()}`)
            }

            // User who made change
            const user = firstEntry.locator('[data-testid*="user"], .changed-by')
            if (await user.isVisible()) {
              console.log(`Changed by: ${await user.textContent()}`)
            }

            // Timestamp
            const timestamp = firstEntry.locator('time, [data-testid*="timestamp"]')
            if (await timestamp.isVisible()) {
              console.log(`When: ${await timestamp.textContent()}`)
            }
          }
        }
      }
    }
  })

  test('should test permission inheritance', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Look for inheritance test tool
      const testButton = page
        .locator('button')
        .filter({ hasText: /test.*permission|check.*access/i })

      if (await testButton.isVisible({ timeout: 3000 })) {
        await testButton.click()

        // Permission tester
        const testerModal = page.locator('[role="dialog"]').filter({ hasText: /test.*permission/i })

        if (await testerModal.isVisible({ timeout: 3000 })) {
          // User selector
          const userInput = testerModal.locator('input[placeholder*="user"]')
          if (await userInput.isVisible()) {
            await userInput.fill('test@example.com')
          }

          // Permission to test
          const permissionSelect = testerModal.locator('select[name*="permission"]')
          if (await permissionSelect.isVisible()) {
            await permissionSelect.selectOption({ index: 1 })
          }

          // Test button
          const runTestButton = testerModal.locator('button').filter({ hasText: /test|check/i })
          if (await runTestButton.isVisible()) {
            await runTestButton.click()

            // Results
            const results = testerModal.locator('[data-testid*="results"], .test-results')
            if (await results.isVisible({ timeout: 2000 })) {
              const resultText = await results.textContent()
              console.log(`Test result: ${resultText}`)
            }
          }

          // Close
          const closeButton = testerModal.locator('button').filter({ hasText: /close/i })
          await closeButton.click()
        }
      }
    }
  })

  test('should bulk update role permissions', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Bulk actions button
      const bulkButton = page.locator('button').filter({ hasText: /bulk.*update|mass.*assign/i })

      if (await bulkButton.isVisible({ timeout: 3000 })) {
        await bulkButton.click()

        // Bulk update form
        const bulkForm = page.locator('[role="dialog"], .bulk-update-form')

        if (await bulkForm.isVisible({ timeout: 3000 })) {
          // Operation type
          const operationType = bulkForm.locator('select[name*="operation"]')
          if (await operationType.isVisible()) {
            const operations = await operationType.locator('option').allTextContents()
            console.log('Bulk operations:', operations.filter((o) => o).join(', '))
          }

          // Target roles
          const roleChecks = bulkForm.locator('input[type="checkbox"][name*="role"]')
          if ((await roleChecks.count()) > 0) {
            console.log(`Can target ${await roleChecks.count()} roles`)
          }

          // Preview changes
          const previewButton = bulkForm.locator('button').filter({ hasText: /preview/i })
          if (await previewButton.isVisible()) {
            await previewButton.click()

            const preview = bulkForm.locator('[data-testid*="preview"], .changes-preview')
            if (await preview.isVisible({ timeout: 2000 })) {
              console.log('Shows preview of changes before applying')
            }
          }

          // Cancel
          const cancelButton = bulkForm.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })

  test('should export/import permission configurations', async ({ page }) => {
    await page.goto('/admin/permissions')

    if (page.url().includes('/admin/permissions')) {
      // Export button
      const exportButton = page.locator('button').filter({ hasText: /export/i })

      if (await exportButton.isVisible({ timeout: 3000 })) {
        await exportButton.click()

        // Export options
        const exportMenu = page.locator('[role="menu"], .export-options')

        if (await exportMenu.isVisible({ timeout: 2000 })) {
          const formats = ['JSON', 'CSV', 'YAML']

          for (const format of formats) {
            const formatOption = exportMenu.locator('button, a').filter({ hasText: format })
            if (await formatOption.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`✓ Export format: ${format}`)
            }
          }
        }

        // Close menu
        await page.keyboard.press('Escape')
      }

      // Import button
      const importButton = page.locator('button').filter({ hasText: /import/i })
      if (await importButton.isVisible()) {
        console.log('Permission import functionality available')
      }
    }
  })
})
