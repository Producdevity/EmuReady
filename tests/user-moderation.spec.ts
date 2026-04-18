import { test, expect } from '@playwright/test'

test.describe('User Ban & Moderation System', () => {
  test.describe('Admin Ban Management Page', () => {
    test.use({ storageState: 'tests/.auth/super_admin.json' })

    test('should access user ban management page', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByRole('heading', { name: /user ban management/i })).toBeVisible()

      const statsText = page.locator('text=/total bans|active|expired|permanent/i')
      await expect(statsText.first()).toBeVisible()
    })

    test('should display ban statistics', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByText(/total bans/i)).toBeVisible()
      await expect(page.getByText(/active/i).first()).toBeVisible()
    })

    test('should display bans table with correct columns', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const table = page.locator('table')
      await expect(table).toBeVisible()

      const headerText = await page.locator('thead').textContent()
      expect(headerText?.toLowerCase()).toMatch(/user/)
      expect(headerText?.toLowerCase()).toMatch(/reason/)
      expect(headerText?.toLowerCase()).toMatch(/status/)
    })

    test('should search bans by user name', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const searchInput = page.getByPlaceholder(/search bans/i)
      await expect(searchInput).toBeVisible()

      await searchInput.fill('test')
      await expect(page.locator('table')).toBeVisible()
    })

    test('should filter by status', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const statusFilter = page
        .locator('select')
        .filter({ hasText: /all statuses|active|inactive/i })
      await expect(statusFilter).toBeVisible()

      await statusFilter.selectOption('true')
      await expect(page.locator('table')).toBeVisible()
    })

    test('should open create ban modal', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const newBanButton = page.getByRole('button', { name: /new ban/i })
      await expect(newBanButton).toBeVisible()

      await newBanButton.click()

      await expect(page.getByText(/create user ban/i)).toBeVisible()
      await expect(page.getByPlaceholder(/search users/i)).toBeVisible()
      await expect(page.getByPlaceholder(/provide a clear reason/i)).toBeVisible()
      await expect(page.getByText(/permanent ban/i)).toBeVisible()
      await expect(page.getByText(/temporary ban/i)).toBeVisible()
    })

    test('should view ban details', async ({ page }) => {
      await page.goto('/admin/user-bans')
      await page.waitForLoadState('domcontentloaded')

      const rows = page.locator('tbody tr')
      await expect(rows.first()).toBeVisible()

      const viewButton = rows.first().getByRole('button', { name: /view/i })
      await expect(viewButton).toBeVisible()

      await viewButton.click()
      await expect(page.getByText(/ban details/i).first()).toBeVisible()
    })
  })
})
