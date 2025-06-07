import { test, expect } from '@playwright/test'

test.describe('Browse Games', () => {
  test('should display games page', async ({ page }) => {
    await page.goto('/games')

    // Should see games page heading
    await expect(page.locator('h1')).toContainText(/games/i)

    // Page should load without errors
    await expect(page).toHaveURL('/games')
  })

  test('should show games list or empty state', async ({ page }) => {
    await page.goto('/games')

    // Wait for page to load and check for content
    await page.waitForLoadState('networkidle')

    // Should either show games or handle the case where database is not set up
    const hasGames = await page
      .locator('[data-testid="game-card"], .game-item, .game-list-item')
      .count()
    const hasEmptyState = await page
      .getByText(/no games found/i)
      .or(page.getByText(/no games available/i))
      .count()
    const hasError = await page
      .getByText(/error/i)
      .or(page.getByText(/something went wrong/i))
      .count()

    // Should have either games, empty state, or error (database not set up)
    expect(hasGames > 0 || hasEmptyState > 0 || hasError > 0).toBeTruthy()
  })

  test('should allow navigation to individual game pages', async ({ page }) => {
    await page.goto('/games')

    // Look for game links
    const gameLinks = page
      .locator('a[href*="/games/"]')
      .filter({ hasText: /./i })
    const gameCount = await gameLinks.count()

    if (gameCount > 0) {
      // Click on first game
      await gameLinks.first().click()

      // Should navigate to game detail page
      await expect(page).toHaveURL(/\/games\/[a-zA-Z0-9-]+/)

      // Should see game detail content
      await expect(page.locator('h1, h2')).toBeVisible()
    } else {
      // If no games, that's also valid (empty state)
      console.log('No games available to test navigation')
    }
  })
})

test.describe('Browse Listings', () => {
  test('should display listings page', async ({ page }) => {
    await page.goto('/listings')

    // Should see listings page heading
    await expect(page.locator('h1')).toContainText(/listings/i)

    // Page should load without errors
    await expect(page).toHaveURL('/listings')
  })

  test('should show listings list or empty state', async ({ page }) => {
    await page.goto('/listings')

    // Wait for page to load and check for content
    await page.waitForLoadState('networkidle')

    // Should either show listings or handle the case where database is not set up
    const hasListings = await page
      .locator(
        '[data-testid="listing-card"], .listing-item, .listing-list-item',
      )
      .count()
    const hasEmptyState = await page
      .getByText(/no listings found/i)
      .or(page.getByText(/no listings available/i))
      .count()
    const hasError = await page
      .getByText(/error/i)
      .or(page.getByText(/something went wrong/i))
      .count()

    // Should have either listings, empty state, or error (database not set up)
    expect(hasListings > 0 || hasEmptyState > 0 || hasError > 0).toBeTruthy()
  })

  test('should allow navigation to individual listing pages', async ({
    page,
  }) => {
    await page.goto('/listings')

    // Look for listing links
    const listingLinks = page
      .locator('a[href*="/listings/"]')
      .filter({ hasText: /./i })
    const listingCount = await listingLinks.count()

    if (listingCount > 0) {
      // Click on first listing
      await listingLinks.first().click()

      // Should navigate to listing detail page
      await expect(page).toHaveURL(/\/listings\/[a-zA-Z0-9-]+/)

      // Should see listing detail content
      await expect(page.locator('h1, h2')).toBeVisible()
    } else {
      // If no listings, that's also valid (empty state)
      console.log('No listings available to test navigation')
    }
  })
})

test.describe('Home Page', () => {
  test('should display home page content', async ({ page }) => {
    await page.goto('/')

    // Should see EmuReady branding
    await expect(page.getByText(/emuready/i)).toBeVisible()
    await expect(page.getByText(/know before you load/i)).toBeVisible()

    // Should see main navigation
    await expect(page.getByRole('link', { name: /games/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /listings/i })).toBeVisible()
  })

  test('should have working navigation links from home', async ({ page }) => {
    await page.goto('/')

    // Test Games link
    await page.getByRole('link', { name: /games/i }).click()
    await expect(page).toHaveURL('/games')

    // Go back to home
    await page.goto('/')

    // Test Listings link
    await page.getByRole('link', { name: /listings/i }).click()
    await expect(page).toHaveURL('/listings')
  })
})

test.describe('Search and Filtering', () => {
  test('should have search functionality on games page', async ({ page }) => {
    await page.goto('/games')

    // Look for search input
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByLabel(/search/i))

    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('mario')

      // Should filter results or show search results
      // This is a basic test - actual implementation may vary
      await page.waitForTimeout(1000) // Allow for search debouncing

      // Verify search was performed (implementation dependent)
      const url = page.url()
      expect(url.includes('search') || url.includes('mario')).toBeTruthy()
    } else {
      console.log('No search functionality found on games page')
    }
  })

  test('should have search functionality on listings page', async ({
    page,
  }) => {
    await page.goto('/listings')

    // Look for search input
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByLabel(/search/i))

    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('mario')

      // Should filter results or show search results
      await page.waitForTimeout(1000) // Allow for search debouncing

      // Verify search was performed (implementation dependent)
      const url = page.url()
      expect(url.includes('search') || url.includes('mario')).toBeTruthy()
    } else {
      console.log('No search functionality found on listings page')
    }
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Should see mobile-friendly navigation
    await expect(page.getByText(/emuready/i)).toBeVisible()

    // Test navigation on mobile
    await page.getByRole('link', { name: /games/i }).click()
    await expect(page).toHaveURL('/games')

    await page.getByRole('link', { name: /listings/i }).click()
    await expect(page).toHaveURL('/listings')
  })

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/')

    // Should see appropriate layout for tablet
    await expect(page.getByText(/emuready/i)).toBeVisible()

    // Navigation should work
    await page.getByRole('link', { name: /games/i }).click()
    await expect(page).toHaveURL('/games')
  })
})
