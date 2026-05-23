import { randomUUID } from 'node:crypto'
import { test, expect } from './fixtures'
import { resetUserBanActionTarget } from './helpers/user-ban-fixtures'
import { USER_BAN_ACTION_TARGET, USER_BAN_TABLE_FIXTURE } from '../prisma/seed-data/userModeration'
import type { Page } from '@playwright/test'

async function gotoUserBans(page: Page) {
  await page.goto('/admin/user-bans')
  await page.waitForLoadState('domcontentloaded')
}

function banRow(page: Page, text: string) {
  return page.locator('tbody tr', { hasText: text }).first()
}

test.describe('User Ban & Moderation System', () => {
  test.describe('Admin Ban Management Page', () => {
    test.use({ storageState: 'tests/.auth/super_admin.json' })

    test('should access user ban management page', async ({ page }) => {
      await gotoUserBans(page)

      await expect(page.getByRole('heading', { name: /user ban management/i })).toBeVisible()

      const statsText = page.locator('text=/total bans|active|expired|permanent/i')
      await expect(statsText.first()).toBeVisible()
    })

    test('should display ban statistics', async ({ page }) => {
      await gotoUserBans(page)

      await expect(page.getByText(/total bans/i)).toBeVisible()
      await expect(page.getByText(/active/i).first()).toBeVisible()
    })

    test('should display bans table with correct columns', async ({ page }) => {
      await gotoUserBans(page)

      const table = page.locator('table')
      await expect(table).toBeVisible()

      const headerText = await page.locator('thead').textContent()
      expect(headerText?.toLowerCase()).toMatch(/user/)
      expect(headerText?.toLowerCase()).toMatch(/reason/)
      expect(headerText?.toLowerCase()).toMatch(/status/)
    })

    test('should search bans by user name', async ({ page }) => {
      await gotoUserBans(page)

      const searchInput = page.getByPlaceholder(/search bans/i)
      await expect(searchInput).toBeVisible()

      await searchInput.fill(USER_BAN_TABLE_FIXTURE.name)

      await expect(banRow(page, USER_BAN_TABLE_FIXTURE.reason)).toBeVisible()
    })

    test('should filter by status', async ({ page }) => {
      await gotoUserBans(page)

      const statusFilter = page
        .locator('select')
        .filter({ hasText: /all statuses|active|inactive/i })
      await expect(statusFilter).toBeVisible()

      await statusFilter.selectOption('false')

      await expect(banRow(page, USER_BAN_TABLE_FIXTURE.reason)).toBeVisible()
    })

    test('should open create ban modal', async ({ page }) => {
      await gotoUserBans(page)

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
      await gotoUserBans(page)

      const row = banRow(page, USER_BAN_TABLE_FIXTURE.reason)
      await expect(row).toBeVisible()

      const viewButton = row.getByRole('button', { name: /view/i })
      await expect(viewButton).toBeVisible()

      await viewButton.click()
      await expect(page.getByText(/ban details/i).first()).toBeVisible()
    })

    test('should create and lift a ban', async ({ page }) => {
      const banReason = `E2E user ban create and lift flow ${randomUUID()}`

      await resetUserBanActionTarget()
      await gotoUserBans(page)

      await page.getByRole('button', { name: /new ban/i }).click()

      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      await dialog.getByPlaceholder(/search users/i).fill(USER_BAN_ACTION_TARGET.email)
      await dialog
        .getByRole('button', { name: new RegExp(USER_BAN_ACTION_TARGET.email, 'i') })
        .click()
      await dialog.getByPlaceholder(/provide a clear reason/i).fill(banReason)
      await dialog.getByRole('button', { name: /ban user permanently/i }).click()

      await expect(dialog).toBeHidden()

      await page.getByPlaceholder(/search bans/i).fill(banReason)

      const row = banRow(page, banReason)
      await expect(row).toBeVisible()
      await expect(row).toContainText(/permanent/i)

      await row.getByRole('button', { name: /lift ban/i }).click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /confirm/i })
        .click()

      await expect(row).toContainText(/lifted/i)
    })
  })
})
