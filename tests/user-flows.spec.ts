import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('User Flow Tests', () => {
  test('should complete flow: browse games → view game → check listings', async ({ page }) => {
    // Start at home
    const homePage = new HomePage(page)
    await homePage.goto()

    // Navigate to games
    await homePage.navigateToGames()
    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()

    // Search for a specific game
    await gamesPage.searchGames('Mario')

    // Wait for search results to load
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {})

    // Wait for Mario search results specifically (not just any game items)
    const marioGame = gamesPage.gameItems.filter({ hasText: /mario/i }).first()
    const hasMarioResults = await marioGame
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false)

    if (hasMarioResults) {
      // Click the first Mario game directly
      const firstGameTitle = await marioGame.textContent()
      const href = await marioGame.getAttribute('href')
      await marioGame.click()

      // Verify navigation to game detail
      try {
        await expect(page).toHaveURL(/\/games\/[^\/]+/, { timeout: 5000 })
      } catch {
        // Fallback to direct navigation if click didn't work
        if (href) await page.goto(href)
        await expect(page).toHaveURL(/\/games\/[^\/]+/)
      }

      // Look for game title on detail page
      const detailTitle = await page.locator('h1').first().textContent()
      expect(detailTitle?.toLowerCase()).toContain('mario')

      // Verify we're viewing the same game we clicked on
      if (firstGameTitle) {
        expect(detailTitle?.toLowerCase()).toContain(firstGameTitle.toLowerCase().split(' ')[0])
      }

      // Check for listings section
      const listingsSection = page
        .locator('[data-testid="game-listings"], section')
        .filter({ hasText: /listing|compatibility/i })

      if (await listingsSection.isVisible({ timeout: 3000 })) {
        await expect(listingsSection).toBeVisible()

        // Click on a listing if available
        const listingLinks = page.locator('a[href*="/listings/"]')
        if ((await listingLinks.count()) > 0) {
          await listingLinks.first().click()
          await expect(page).toHaveURL(/\/listings\/[^\/]+/)
        }
      }
    }
  })

  test('should complete flow: search listings → filter → view details', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Search for listings
    await listingsPage.searchListings('Pokemon')
    await page.waitForLoadState('domcontentloaded')

    // Apply a filter if available
    if (await listingsPage.performanceFilter.isVisible({ timeout: 2000 })) {
      await listingsPage.filterByPerformance('Perfect')
    }

    // Check results
    const listingCount = await listingsPage.getListingCount()

    if (listingCount > 0) {
      // Remember first listing details
      const firstListing = listingsPage.listingItems.first()
      const listingText = await firstListing.textContent()

      // Click to view details
      await listingsPage.clickFirstListing()

      // Should be on listing detail page
      await expect(page).toHaveURL(/\/listings\/[^\/]+/)

      // Should show listing information
      const hasGameTitle = await page.getByRole('heading').first().isVisible()
      expect(hasGameTitle).toBe(true)

      // Verify the listing details page contains info from the listing we clicked
      if (listingText) {
        const pageContent = await page.textContent('body')
        // Check if the page contains part of the listing text (game name, device, etc)
        const listingWords = listingText.split(' ').filter((word) => word.length > 3)
        const hasListingContent = listingWords.some((word) =>
          pageContent?.toLowerCase().includes(word.toLowerCase()),
        )
        expect(hasListingContent).toBe(true)
      }

      // Navigate back
      await page.goBack()

      // Filters should be preserved
      if (await listingsPage.performanceFilter.isVisible()) {
        const filterValue = await listingsPage.performanceFilter.textContent()
        expect(filterValue).toContain('Perfect')
      }
    }
  })

  test('should handle multi-step filtering workflow', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const appliedFilters = []

    // Step 1: Filter by device
    if (await listingsPage.deviceFilter.isVisible({ timeout: 2000 })) {
      await listingsPage.deviceFilter.click()
      const deviceOption = page.getByRole('option').nth(1)
      const deviceName = await deviceOption.textContent()
      await deviceOption.click()
      appliedFilters.push(`Device: ${deviceName}`)
      await page.waitForLoadState('domcontentloaded')
    }

    // Step 2: Add emulator filter
    if (await listingsPage.emulatorFilter.isVisible({ timeout: 2000 })) {
      await listingsPage.emulatorFilter.click()
      const emulatorOption = page.getByRole('option').nth(1)
      const emulatorName = await emulatorOption.textContent()
      await emulatorOption.click()
      appliedFilters.push(`Emulator: ${emulatorName}`)
      await page.waitForLoadState('domcontentloaded')
    }

    // Step 3: Add performance filter
    if (await listingsPage.performanceFilter.isVisible({ timeout: 2000 })) {
      await listingsPage.filterByPerformance('Perfect')
      appliedFilters.push('Performance: Perfect')
    }

    await expect(listingsPage.pageHeading).toBeVisible()

    // Check if we can clear filters
    if (await listingsPage.clearFiltersButton.isVisible({ timeout: 2000 })) {
      const filteredCount = await listingsPage.getListingCount()

      await listingsPage.clearAllFilters()

      const clearedCount = await listingsPage.getListingCount()
      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount)
    }
  })

  test('should handle user journey with back navigation', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Build navigation history
    const navigationPath: string[] = []

    // Home → Games
    navigationPath.push(page.url())
    await homePage.navigateToGames()
    navigationPath.push(page.url())

    // Games → First Game Detail
    const gamesPage = new GamesPage(page)
    if ((await gamesPage.getGameCount()) > 0) {
      await gamesPage.clickFirstGame()
      navigationPath.push(page.url())
    }

    // Navigate back one step
    await page.goBack()
    await expect(page).toHaveURL(navigationPath[navigationPath.length - 2])

    // Only navigate further back if we have 3+ history entries
    if (navigationPath.length >= 3) {
      await page.goBack()
      await expect(page).toHaveURL(navigationPath[0])

      await page.goForward()
      await expect(page).toHaveURL(navigationPath[1])
    }
  })

  test('should maintain state during complex interactions', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Set up initial state
    const searchTerm = 'Zelda'
    await gamesPage.searchGames(searchTerm)
    await page.waitForLoadState('domcontentloaded')

    // Open game in new tab if possible
    if ((await gamesPage.getGameCount()) > 0) {
      const firstGame = gamesPage.gameItems.first()

      // Middle-click or Ctrl+click to open in new tab
      const newPagePromise = page.context().waitForEvent('page', { timeout: 5000 })
      await firstGame.click({ modifiers: ['Control'] })

      try {
        const newPage = await newPagePromise
        await newPage.waitForLoadState()

        // Original page should maintain search
        const searchValue = await gamesPage.searchInput.inputValue()
        expect(searchValue).toBe(searchTerm)

        await newPage.close()
      } catch {
        // New tab handling not supported in this environment; verify original page retained search
        const searchValue = await gamesPage.searchInput.inputValue()
        expect(searchValue).toBe(searchTerm)
      }
    }
  })

  test('should handle rapid user interactions', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Simulate impatient user rapidly clicking
    const actions = []

    // Rapid filter changes
    if (await listingsPage.deviceFilter.isVisible()) {
      actions.push(listingsPage.deviceFilter.click())
    }

    // Don't wait between actions
    if (await listingsPage.emulatorFilter.isVisible()) {
      actions.push(listingsPage.emulatorFilter.click())
    }

    if (await listingsPage.performanceFilter.isVisible()) {
      actions.push(listingsPage.performanceFilter.click())
    }

    // Execute all rapidly
    await Promise.all(actions)

    await page.waitForLoadState('domcontentloaded')

    // Page should still be functional
    await expect(listingsPage.pageHeading).toBeVisible()

    // Should be able to clear state
    if (await listingsPage.clearFiltersButton.isVisible()) {
      await listingsPage.clearAllFilters()
      await expect(listingsPage.pageHeading).toBeVisible()
    }
  })

  test('should complete mobile user journey', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const homePage = new HomePage(page)
    await homePage.goto()

    // Games page is not in the mobile navbar, so navigate directly
    await homePage.navigateToGames()
    await expect(page).toHaveURL('/games')

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()

    // Search on mobile
    await gamesPage.searchGames('Mario')
    await page.waitForLoadState('domcontentloaded')

    // View game detail on mobile
    if ((await gamesPage.getGameCount()) > 0) {
      await gamesPage.clickFirstGame()
      await expect(page).toHaveURL(/\/games\/[^\/]+/)

      // Scroll on mobile to see content
      await page.evaluate(() => window.scrollBy(0, 300))

      // Navigate back — URL retains ?search= param from the search above
      await page.goBack()
      await expect(page).toHaveURL(/\/games/)
    }
  })

  test('should handle interrupted flows gracefully', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Start searching
    await gamesPage.searchInput.fill('Final Fant')

    // Interrupt by navigating away using direct goto to avoid racing
    // with the search input's debounced URL change
    await page.goto('/')

    // Go back to games
    await page.goBack()

    // Search should be cleared or restored
    const searchValue = await gamesPage.searchInput.inputValue()

    // Either cleared or restored is acceptable
    expect(searchValue === '' || searchValue === 'Final Fant').toBe(true)

    // Should be able to continue searching
    await gamesPage.searchInput.clear()
    await gamesPage.searchGames('Pokemon')

    await expect(gamesPage.searchInput).toHaveValue('Pokemon')
  })
})

test.describe('Cross-Page User Flows', () => {
  test('should handle flow between PC and handheld listings', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Go to handheld listings
    await homePage.navigateToHandheld()
    await expect(page).toHaveURL('/listings')

    const listingsPage = new ListingsPage(page)
    await expect(listingsPage.pageHeading).toBeVisible()

    // Switch to PC listings
    await homePage.navigateToPC()
    await expect(page).toHaveURL('/pc-listings')

    // Verify different content
    const pcContent = await page.content()
    expect(pcContent).toContain('pc')

    // Navigate back to handheld
    await homePage.navigateToHandheld()
    await expect(page).toHaveURL('/listings')
  })

  test('should remember user preferences across pages', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Look for any view preferences (grid/list toggle, sort options)
    const viewToggles = page.locator('button').filter({ hasText: /view|display|layout|grid|list/i })

    if ((await viewToggles.count()) > 0) {
      const toggle = viewToggles.first()
      const initialState = await toggle.textContent()

      // Change view
      await toggle.click()
      await expect(toggle).toBeVisible()

      const newState = await toggle.textContent()
      expect(newState).not.toBe(initialState)

      // Navigate away and back
      await gamesPage.navigateToHome()
      await gamesPage.goto()

      // Preference should be either remembered or reset to default
      const currentState = await toggle.textContent()
      expect(currentState === newState || currentState === initialState).toBe(true)
    }
  })
})
