import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin/)
    await page.locator('[data-testid="admin-nav"]').waitFor({ state: 'visible', timeout: 15000 })
  })

  test('should display admin navigation with required menu items', async ({ page }) => {
    const adminNav = page.locator('[data-testid="admin-nav"]')
    await expect(adminNav).toBeVisible()

    for (const item of ['Games', 'Systems', 'Devices', 'Emulators']) {
      const menuLink = adminNav
        .locator('a')
        .filter({ hasText: new RegExp(item, 'i') })
        .first()
      await expect(menuLink).toBeVisible()
    }
  })

  test('should display dashboard statistics', async ({ page }) => {
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()

    const statValues = mainContent.locator('text=/\\d+/')
    await expect(statValues.first()).toBeVisible()

    const statCount = await statValues.count()
    expect(statCount).toBeGreaterThan(0)
  })

  test('should show time range filter buttons', async ({ page }) => {
    const timeRangeButtons = page.locator('button').filter({ hasText: /24h|48h|7d/i })
    await expect(timeRangeButtons.first()).toBeVisible()

    for (const range of ['24h', '48h', '7d']) {
      const rangeButton = page
        .locator('button')
        .filter({ hasText: new RegExp(range, 'i') })
        .first()
      await expect(rangeButton).toBeVisible()
    }
  })

  test('should switch time ranges on activity cards', async ({ page }) => {
    const timeRangeButtons = page.locator('button').filter({ hasText: /24h|48h|7d/i })
    await expect(timeRangeButtons.first()).toBeVisible()

    for (const range of ['24h', '48h', '7d']) {
      const rangeButton = page
        .locator('button')
        .filter({ hasText: new RegExp(range, 'i') })
        .first()
      await rangeButton.click()
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('main').first()).toBeVisible()
    }
  })

  test('should have functional quick action nav links', async ({ page }) => {
    const quickNav = page.locator('[data-testid="admin-nav"]')
    await expect(quickNav).toBeVisible()

    const navLinks = quickNav.locator('a')
    const linkCount = await navLinks.count()
    expect(linkCount).toBeGreaterThanOrEqual(2)
  })

  test('should navigate to games admin page via nav link', async ({ page }) => {
    const quickNav = page.locator('[data-testid="admin-nav"]')
    const gamesLink = quickNav.locator('a').filter({ hasText: /games/i }).first()
    await expect(gamesLink).toBeVisible()

    await gamesLink.click()
    await expect(page).toHaveURL(/\/admin\/games/)
  })

  test('should display responsive layout at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const quickNav = page.locator('[data-testid="admin-nav"]')
    await expect(quickNav).toBeVisible()
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('should show user menu button', async ({ page }) => {
    const userMenuButton = page.getByRole('button', { name: /open user menu/i })
    await expect(userMenuButton).toBeVisible()
  })
})

test.describe('Admin Dashboard Data Visualizations', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin/)
    await page.locator('[data-testid="admin-nav"]').waitFor({ state: 'visible', timeout: 15000 })
  })

  test('should display numeric data on dashboard', async ({ page }) => {
    const numbers = page.locator('text=/\\d+/')
    await expect(numbers.first()).toBeVisible()

    const count = await numbers.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have a refresh button on activity cards', async ({ page }) => {
    const refreshButton = page.locator('button[aria-label="Refresh"]').first()
    await expect(refreshButton).toBeVisible()

    await refreshButton.click()
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('main').first()).toBeVisible()
  })
})
