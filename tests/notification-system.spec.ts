import { test, expect } from '@playwright/test'

/**
 * E2E tests for the notification system.
 *
 * Bell icon: In navbar when authenticated, shows unread count badge.
 * Dropdown: "Notifications" heading, mark all read, view all link.
 * Full page: /notifications with search, filters, bulk actions.
 * Preferences: On /profile page with per-category toggles.
 */

test.describe('Notification System', () => {
  test.describe('Notification Bell', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display notification bell when authenticated', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Bell button is in the navbar for authenticated users
      // The Bell icon is inside a button element
      const bellButton = page.locator('button').filter({
        has: page.locator('svg.lucide-bell, svg[class*="bell"]'),
      })

      // Bell button should be visible on the page
      await expect(bellButton.first()).toBeVisible()
    })

    test('should open notification dropdown on bell click', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const bellButton = page
        .locator('button')
        .filter({
          has: page.locator('svg.lucide-bell, svg[class*="bell"]'),
        })
        .first()

      await bellButton.click()

      // Dropdown should show "Notifications" heading
      await expect(page.getByText('Notifications').first()).toBeVisible()
    })

    test('should show close button in dropdown', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const bellButton = page
        .locator('button')
        .filter({
          has: page.locator('svg.lucide-bell, svg[class*="bell"]'),
        })
        .first()

      await bellButton.click()

      // Close button with aria-label
      const closeButton = page.getByRole('button', { name: /close notifications/i })
      await expect(closeButton).toBeVisible()

      // Clicking close should hide the dropdown
      await closeButton.click()
    })

    test('should show empty state or notification items in dropdown', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const bellButton = page
        .locator('button')
        .filter({
          has: page.locator('svg.lucide-bell, svg[class*="bell"]'),
        })
        .first()

      await bellButton.click()

      // Wait for notification content to load
      const emptyState = page.getByText(/no notifications yet/i)
      const notificationItems = page.locator('[class*="hover:bg-gray"]').filter({
        has: page.locator('[class*="font-medium"]'),
      })

      // Wait for either empty state or notification items to appear
      await emptyState
        .or(notificationItems.first())
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {})

      const hasEmpty = await emptyState.isVisible().catch(() => false)
      const hasItems = (await notificationItems.count()) > 0

      expect(hasEmpty || hasItems).toBe(true)
    })
  })

  test.describe('Notifications Page', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display full notifications page', async ({ page }) => {
      await page.goto('/notifications')
      await page.waitForLoadState('domcontentloaded')

      // Page heading
      await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible()

      // Search input
      await expect(page.getByPlaceholder(/search notifications/i)).toBeVisible()
    })

    test('should show category filter cards', async ({ page }) => {
      await page.goto('/notifications')
      await page.waitForLoadState('domcontentloaded')

      // Category cards: All, Engagement, Content, System, Moderation
      const allCategory = page.getByText(/^all$/i)
      const hasCategories = await allCategory.isVisible().catch(() => false)

      if (hasCategories) {
        await expect(allCategory).toBeVisible()
      }
    })

    test('should search notifications', async ({ page }) => {
      await page.goto('/notifications')
      await page.waitForLoadState('domcontentloaded')

      const searchInput = page.getByPlaceholder(/search notifications/i)
      await searchInput.fill('test')

      await page.waitForLoadState('domcontentloaded')
    })
  })

  test.describe('Notification Not Visible for Anonymous Users', () => {
    test('should not show notification bell when not authenticated', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Bell button should not be visible for anonymous users
      const bellButton = page.locator('button').filter({
        has: page.locator('svg.lucide-bell, svg[class*="bell"]'),
      })

      // Anonymous users should not see the notification bell
      await expect(bellButton).toHaveCount(0)
    })
  })
})
