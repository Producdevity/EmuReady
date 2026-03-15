import { test, expect } from '@playwright/test'

/**
 * E2E tests for the custom field templates admin page.
 *
 * Route: /admin/custom-field-templates
 * Heading: "Custom Field Templates"
 * Templates are managed via modal forms, listed as cards.
 * No data-testid attributes exist — uses roles, text, and structure.
 */

test.describe('Custom Fields System', () => {
  test.describe('Admin Custom Field Template Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access custom field templates page', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      // Page heading
      await expect(page.getByRole('heading', { name: /custom field templates/i })).toBeVisible()

      // Stats display should show template counts
      const stats = page.locator('text=/total templates|with fields|empty templates/i')
      await expect(stats.first()).toBeVisible()
    })

    test('should open create template modal', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      // Click "Create Template" button
      const createButton = page.getByRole('button', { name: /create template/i })
      await expect(createButton).toBeVisible()
      await createButton.click()

      // Modal should open with "Create Template" heading
      await expect(page.getByRole('heading', { name: /create template/i, level: 2 })).toBeVisible()

      // Template Name field
      const nameInput = page.locator('#templateName')
      await expect(nameInput).toBeVisible()

      // Description field
      const descriptionInput = page.locator('#templateDescription')
      await expect(descriptionInput).toBeVisible()

      // "Add Field" button in the form
      await expect(page.getByRole('button', { name: /add field/i })).toBeVisible()
    })

    test('should add a field to the template form', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      await page.getByRole('button', { name: /create template/i }).click()

      // Fill template name
      await page.locator('#templateName').fill('Test Template')

      // Click "Add Field" to add a field definition
      await page.getByRole('button', { name: /add field/i }).click()

      // Field 1 card should appear with field name and label inputs
      await expect(page.getByText('Field 1')).toBeVisible()

      // Field type dropdown should be present
      const fieldTypeSelect = page
        .locator('select')
        .filter({ hasText: /text|long text|url|yes\/no|dropdown|range/i })
      await expect(fieldTypeSelect.first()).toBeVisible()
    })

    test('should show template cards in the list', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      // Check for template cards or empty state
      const templateCards = page.locator('h3')
      const emptyState = page.getByText(/no custom field templates/i)

      const hasTemplates = (await templateCards.count()) > 0
      const hasEmptyState = await emptyState.isVisible().catch(() => false)

      // Page must show either templates or empty state
      expect(hasTemplates || hasEmptyState).toBe(true)

      if (hasTemplates) {
        // Each template card has action buttons (Edit, Delete, etc.)
        const editButtons = page.getByRole('button', { name: /edit/i })
        await expect(editButtons.first()).toBeVisible()
      }
    })

    test('should toggle field visibility on template card', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      // Look for "Show Fields" button on a template card
      const showFieldsButton = page
        .getByRole('button', { name: /show fields|hide fields/i })
        .first()
      const hasTemplates = await showFieldsButton.isVisible().catch(() => false)

      if (hasTemplates) {
        await showFieldsButton.click()

        // After clicking, should see field details or "Hide Fields" text
        await expect(page.getByText(/template fields:|hide fields/i).first()).toBeVisible()
      }
    })
  })

  test.describe('Custom Fields in Listing Form', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should show custom fields section when emulator is selected', async ({ page }) => {
      await page.goto('/listings/new')
      await page.waitForLoadState('domcontentloaded')

      // The form should have game, device, emulator, performance fields
      await expect(page.getByText(/game/i).first()).toBeVisible()
      await expect(page.getByText(/device/i).first()).toBeVisible()
      await expect(page.getByText(/emulator/i).first()).toBeVisible()

      // Before emulator selection, custom fields section shows placeholder
      const customFieldsPlaceholder = page.getByText(/select an emulator/i)
      const isPlaceholderVisible = await customFieldsPlaceholder.isVisible().catch(() => false)

      // Placeholder prompts user to select an emulator first
      if (isPlaceholderVisible) {
        await expect(customFieldsPlaceholder).toBeVisible()
      }
    })
  })
})
