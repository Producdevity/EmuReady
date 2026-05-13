import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'

function bellButton(page: Page) {
  return page.getByRole('button', { name: /open notifications/i })
}

function notificationDropdown(page: Page) {
  return page.getByRole('region', { name: /^Notifications$/i })
}

test.describe('Notification System', () => {
  test.describe('Notification Bell', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display notification bell when authenticated', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      await expect(bellButton(page)).toBeVisible()
    })

    test('should open notification dropdown on bell click', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      await bellButton(page).click()

      await expect(notificationDropdown(page)).toBeVisible()
    })

    test('should show close button in dropdown', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      await bellButton(page).click()

      const closeButton = notificationDropdown(page).getByRole('button', {
        name: /close notifications/i,
      })
      await expect(closeButton).toBeVisible()
      await closeButton.click()
    })

    test('should show empty state or notification items in dropdown', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      await bellButton(page).click()

      const dropdown = notificationDropdown(page)
      const emptyState = dropdown.getByTestId('notification-empty-state')
      const notificationItems = dropdown.getByTestId('notification-item')

      await expect(emptyState.or(notificationItems.first())).toBeVisible()
    })
  })

  test.describe('Notifications Page', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display full notifications page', async ({ page }) => {
      await page.goto('/notifications')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible()
      await expect(page.getByPlaceholder(/search notifications/i)).toBeVisible()
    })

    test('should show category filter cards', async ({ page }) => {
      await page.goto('/notifications')
      await page.waitForLoadState('domcontentloaded')

      const allCategoryFilter = page.getByText(/^all$/i).first()

      await expect(allCategoryFilter).toBeVisible()
      await expect(page.getByText(/engagement/i).first()).toBeVisible()
      await expect(page.getByText(/moderation/i).first()).toBeVisible()
    })

    test('should search notifications', async ({ page }) => {
      await page.goto('/notifications')
      await page.waitForLoadState('domcontentloaded')

      await page.getByPlaceholder(/search notifications/i).fill('test')
      await page.waitForLoadState('domcontentloaded')
    })
  })

  test.describe('Notification Not Visible for Anonymous Users', () => {
    test('should not show notification bell when not authenticated', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      await expect(bellButton(page)).toHaveCount(0)
    })
  })
})
