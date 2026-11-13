import { test, expect } from './fixtures'

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
    const mainContent = page.getByRole('main').last()
    await expect(mainContent).toBeVisible()

    await expect(mainContent.getByRole('heading', { name: 'Platform Stats' })).toBeVisible()
    for (const label of ['New Users:', 'Handheld Reports:', 'PC Reports:']) {
      const statRow = mainContent.getByText(label, { exact: true }).locator('..')
      await expect(statRow.getByText(/^\d+$/)).toBeVisible()
    }
  })

  test('should show time range filter buttons', async ({ page }) => {
    const timeRangeButtons = page.getByRole('button', { name: /^(24h|48h|7d)$/ })
    await expect(timeRangeButtons.first()).toBeVisible()

    for (const range of ['24h', '48h', '7d']) {
      const rangeButton = page.getByRole('button', { name: range, exact: true }).first()
      await expect(rangeButton).toBeVisible()
    }
  })

  test('should switch time ranges on activity cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Users', exact: true })).toBeVisible()

    for (const range of ['48h', '7d']) {
      const rangeButton = page.getByRole('button', { name: range, exact: true }).first()
      const dashboardResponse = page.waitForResponse(
        (response) => response.url().includes('activity.dashboard') && response.status() === 200,
      )
      await rangeButton.click()
      await dashboardResponse
      await expect(page.getByRole('button', { name: 'Refresh', exact: true }).first()).toBeEnabled()
      await expect(page.getByRole('main').last()).toBeVisible()
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
    await expect(page.getByRole('main').last()).toBeVisible()
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
    const refreshButton = page.getByRole('button', { name: 'Refresh', exact: true }).first()
    await expect(refreshButton).toBeVisible()

    const dashboardResponse = page.waitForResponse(
      (response) => response.url().includes('activity.dashboard') && response.status() === 200,
    )
    await refreshButton.click()
    await dashboardResponse
    await expect(refreshButton).toBeEnabled()
  })
})
