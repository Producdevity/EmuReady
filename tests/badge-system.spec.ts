import { test, expect } from '@playwright/test'

test.describe('Badge System', () => {
  test.describe('Admin Badge Management', () => {
    test.use({ storageState: 'tests/.auth/super_admin.json' })

    test('should display page heading', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: /badge management/i })).toBeVisible()
    })

    test('should display badge statistics', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      await expect(page.getByText(/total badges/i)).toBeVisible()
    })

    test('should show search input', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      await expect(page.getByPlaceholder(/search badges/i)).toBeVisible()
    })

    test('should show badge table or empty state', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      await expect(page.locator('table').or(page.getByText(/no badges/i))).toBeVisible()
    })

    test('should display badge table with expected columns', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      const table = page.locator('table')
      await expect(table).toBeVisible()

      const headerText = await page.locator('thead').textContent()
      expect(headerText?.toLowerCase()).toMatch(/badge/)
      expect(headerText?.toLowerCase()).toMatch(/status/)
    })

    test('should open create badge modal', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      const createButton = page.getByRole('button', { name: /create badge/i })
      await expect(createButton).toBeVisible()
      await createButton.click()

      await expect(page.getByText(/create new badge/i)).toBeVisible()
      await expect(page.getByPlaceholder(/enter badge name/i)).toBeVisible()
      await expect(page.getByPlaceholder(/enter badge description/i)).toBeVisible()
      await expect(page.locator('input[type="color"]')).toBeVisible()
    })

    test('should search badges by name', async ({ page }) => {
      await page.goto('/admin/badges', { waitUntil: 'domcontentloaded' })

      await expect(page.locator('table').or(page.getByText(/no badges/i))).toBeVisible()

      const searchInput = page.getByPlaceholder(/search badges/i)
      await searchInput.fill('test')

      await expect(page.locator('table').or(page.getByText(/no badges/i))).toBeVisible()
    })
  })
})
