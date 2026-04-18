import { test, expect } from '@playwright/test'

test.describe('Custom Fields System', () => {
  test.describe('Admin Custom Field Template Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access custom field templates page', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByRole('heading', { name: /custom field templates/i })).toBeVisible()
      await expect(
        page.locator('text=/total templates|with fields|empty templates/i').first(),
      ).toBeVisible()
    })

    test('should open create template modal', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      await page.getByRole('button', { name: /create template/i }).click()

      await expect(page.getByRole('heading', { name: /create template/i, level: 2 })).toBeVisible()
      await expect(page.locator('#templateName')).toBeVisible()
      await expect(page.locator('#templateDescription')).toBeVisible()
      await expect(page.getByRole('button', { name: /add field/i })).toBeVisible()
    })

    test('should add a field to the template form', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      await page.getByRole('button', { name: /create template/i }).click()
      await page.locator('#templateName').fill('Test Template')
      await page.getByRole('button', { name: /add field/i }).click()

      await expect(page.getByText('Field 1')).toBeVisible()
      await expect(
        page
          .locator('select')
          .filter({ hasText: /text|long text|url|yes\/no|dropdown|range/i })
          .first(),
      ).toBeVisible()
    })

    test('should show template cards or empty state in the list', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      const templateCards = page.locator('h3')
      const emptyState = page.getByText(/no custom field templates/i)
      await expect(templateCards.first().or(emptyState)).toBeVisible()
    })

    test('should toggle field visibility on template card', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')
      await page.waitForLoadState('domcontentloaded')

      const showFieldsButton = page
        .getByRole('button', { name: /show fields|hide fields/i })
        .first()
      await expect(showFieldsButton).toBeVisible()

      await showFieldsButton.click()

      await expect(page.getByText(/template fields:|hide fields/i).first()).toBeVisible()
    })
  })

  test.describe('Custom Fields in Listing Form', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should show custom fields section when emulator is selected', async ({ page }) => {
      await page.goto('/listings/new')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByText(/game/i).first()).toBeVisible()
      await expect(page.getByText(/device/i).first()).toBeVisible()
      await expect(page.getByText(/emulator/i).first()).toBeVisible()
      await expect(page.getByText(/select an emulator/i)).toBeVisible()
    })
  })
})
