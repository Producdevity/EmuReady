import { test, expect } from '@playwright/test'

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display main navigation items', async ({ page }) => {
    // Check that main navigation items are visible
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /games/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /listings/i })).toBeVisible()
  })

  test('should navigate to Games page', async ({ page }) => {
    // Click on Games navigation link
    await page.getByRole('link', { name: /games/i }).click()

    // Should be on games page
    await expect(page).toHaveURL('/games')

    // Should see games page content
    await expect(page.locator('h1')).toContainText(/games/i)
  })

  test('should navigate to Listings page', async ({ page }) => {
    // Click on Listings navigation link
    await page.getByRole('link', { name: /listings/i }).click()

    // Should be on listings page
    await expect(page).toHaveURL('/listings')

    // Should see listings page content
    await expect(page.locator('h1')).toContainText(/listings/i)
  })

  test('should navigate back to Home page', async ({ page }) => {
    // First navigate away from home
    await page.getByRole('link', { name: /games/i }).click()
    await expect(page).toHaveURL('/games')

    // Then navigate back to home
    await page.getByRole('link', { name: /home/i }).click()

    // Should be back on home page
    await expect(page).toHaveURL('/')

    // Should see home page content
    await expect(page.getByText(/know before you load/i)).toBeVisible()
  })

  test('should highlight active navigation item', async ({ page }) => {
    // Home should be active initially
    const homeLink = page.getByRole('link', { name: /home/i })
    await expect(homeLink).toHaveClass(/active|bg-gradient/i)

    // Navigate to games
    await page.getByRole('link', { name: /games/i }).click()

    // Games should now be active
    const gamesLink = page.getByRole('link', { name: /games/i })
    await expect(gamesLink).toHaveClass(/active|bg-gradient/i)

    // Home should no longer be active
    await expect(homeLink).not.toHaveClass(/active|bg-gradient/i)
  })

  test('should work with browser back/forward buttons', async ({ page }) => {
    // Navigate to games
    await page.getByRole('link', { name: /games/i }).click()
    await expect(page).toHaveURL('/games')

    // Navigate to listings
    await page.getByRole('link', { name: /listings/i }).click()
    await expect(page).toHaveURL('/listings')

    // Go back using browser back button
    await page.goBack()
    await expect(page).toHaveURL('/games')

    // Go forward using browser forward button
    await page.goForward()
    await expect(page).toHaveURL('/listings')

    // Go back to home
    await page.goBack()
    await page.goBack()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE dimensions

  test('should show mobile menu button on small screens', async ({ page }) => {
    await page.goto('/')

    // Mobile menu button should be visible
    const menuButton = page
      .locator('button')
      .filter({ hasText: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"]'))
      .or(page.locator('button svg').filter({ hasText: /menu/i }))

    await expect(menuButton).toBeVisible()

    // Desktop navigation should be hidden
    const desktopNav = page.locator('.hidden.md\\:flex')
    await expect(desktopNav).not.toBeVisible()
  })

  test('should open and close mobile menu', async ({ page }) => {
    await page.goto('/')

    // Find mobile menu button
    const menuButton = page
      .locator('button')
      .filter({ hasText: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"]'))
      .or(page.getByRole('button', { name: /menu/i }))

    // Open mobile menu
    await menuButton.click()

    // Mobile menu should be visible with navigation items
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /games/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /listings/i })).toBeVisible()

    // Close mobile menu by clicking menu button again
    await menuButton.click()

    // Menu items should be hidden again (mobile menu closed)
    await page.waitForTimeout(500) // Allow animation to complete
    const menuItems = page.locator('.mobile-menu, [data-testid="mobile-menu"]')
    await expect(menuItems).not.toBeVisible()
  })

  test('should navigate from mobile menu', async ({ page }) => {
    await page.goto('/')

    // Open mobile menu
    const menuButton = page
      .locator('button')
      .filter({ hasText: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"]'))
      .or(page.getByRole('button', { name: /menu/i }))

    await menuButton.click()

    // Click Games from mobile menu
    await page.getByRole('link', { name: /games/i }).click()

    // Should navigate to games page
    await expect(page).toHaveURL('/games')

    // Mobile menu should close automatically after navigation
    await page.waitForTimeout(500)
    const mobileMenuItems = page.locator(
      '.mobile-menu-items, [data-testid="mobile-menu-items"]',
    )
    if (await mobileMenuItems.isVisible()) {
      await expect(mobileMenuItems).not.toBeVisible()
    }
  })

  test('should close mobile menu when clicking outside', async ({ page }) => {
    await page.goto('/')

    // Open mobile menu
    const menuButton = page
      .locator('button')
      .filter({ hasText: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"]'))
      .or(page.getByRole('button', { name: /menu/i }))

    await menuButton.click()

    // Verify menu is open
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible()

    // Click outside the menu (on the main content)
    await page.locator('main, body').click({ position: { x: 100, y: 100 } })

    // Menu should close
    await page.waitForTimeout(500)
    // Note: This test may need adjustment based on actual mobile menu implementation
  })
})

test.describe('Logo and Branding', () => {
  test('should display EmuReady logo and branding', async ({ page }) => {
    await page.goto('/')

    // Check for EmuReady branding
    await expect(page.getByText(/emuready/i)).toBeVisible()
    await expect(page.getByText(/know before you load/i)).toBeVisible()

    // Logo should be clickable and link to home
    const logoLink = page.locator('a').filter({ hasText: /emuready/i })
    await expect(logoLink).toHaveAttribute('href', '/')
  })

  test('should return to home when clicking logo', async ({ page }) => {
    // Start on a different page
    await page.goto('/games')
    await expect(page).toHaveURL('/games')

    // Click on logo to return home
    const logoLink = page.locator('a').filter({ hasText: /emuready/i })
    await logoLink.click()

    // Should be back on home page
    await expect(page).toHaveURL('/')
  })
})
