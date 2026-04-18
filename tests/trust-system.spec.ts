import { test, expect } from '@playwright/test'

test.describe('Trust System', () => {
  test.describe('Trust Score Display', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display trust level on user profile', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' })

      const trustLabel = page.getByText(/trust level/i)
      await expect(trustLabel).toBeVisible()
    })

    test('should display trust info in profile stats', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' })

      await expect(page.getByText(/trust level/i)).toBeVisible()
      await expect(page.getByText(/newcomer/i)).toBeVisible()
    })
  })

  test.describe('Admin Trust Logs', () => {
    test.use({ storageState: 'tests/.auth/super_admin.json' })

    test('should access trust system logs page', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: /trust system logs/i })).toBeVisible()
      await expect(page.getByPlaceholder(/search users/i)).toBeVisible()
    })

    test('should display trust logs table', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      const table = page.locator('table')
      await expect(table).toBeVisible()

      const headerText = await page.locator('thead').textContent()
      expect(headerText?.toLowerCase()).toMatch(/user/)
      expect(headerText?.toLowerCase()).toMatch(/action/)
    })

    test('should show search and filter controls', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      const searchInput = page.locator('input[type="text"]').first()
      await expect(searchInput).toBeVisible()

      const actionFilter = page.locator('select').first()
      await expect(actionFilter).toBeVisible()
    })

    test('should show Run Monthly Bonus button', async ({ page }) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })

      const monthlyBonusButton = page.getByRole('button', { name: /run monthly bonus/i })
      await expect(monthlyBonusButton).toBeVisible()
    })
  })
})
