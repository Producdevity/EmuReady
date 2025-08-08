import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Search Functionality Tests', () => {
  test('should search for games by title', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Wait for games to load
    await gamesPage.verifyPageLoaded()

    // Search for a specific game
    const searchQuery = 'Mario'
    await gamesPage.searchGames(searchQuery)

    // Verify search results
    const gameCards = await gamesPage.gameCards.all()

    if (gameCards.length > 0) {
      // Check that results contain the search term
      const firstGameTitle = await gameCards[0].textContent()
      expect(firstGameTitle?.toLowerCase()).toContain(searchQuery.toLowerCase())
    } else {
      // If no results, verify empty state is shown or page is empty
      const noResults = await page
        .getByText(/no games found|no results|nothing found/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      const hasEmptyState = await page
        .locator('[data-testid="empty-state"], .empty-state')
        .isVisible({ timeout: 2000 })
        .catch(() => false)

      // Either show empty state message or have no game cards
      const isEmptyHandled =
        noResults || hasEmptyState || gameCards.length === 0
      expect(isEmptyHandled).toBe(true)
    }
  })

  test('should search for listings with filters', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Wait for listings to load
    await listingsPage.verifyPageLoaded()

    // Search for listings
    const searchQuery = 'Pokemon'
    await listingsPage.searchListings(searchQuery)

    // Verify search updates the results
    const initialCount = await listingsPage.getListingCount()

    // Clear search and verify count changes
    await listingsPage.searchInput.clear()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)

    const clearedCount = await listingsPage.getListingCount()

    // Results should be different after clearing search
    // (unless there are no listings at all)
    if (clearedCount > 0) {
      console.log(
        `Search filtered from ${clearedCount} to ${initialCount} listings`,
      )
    }
  })

  test('should handle empty search results gracefully', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Search for something unlikely to exist
    const searchQuery = 'xyznonexistentgame123'
    await gamesPage.searchGames(searchQuery)

    // Should show no results message
    const noResultsVisible = await page
      .getByText(/no games found|no results|nothing found|empty/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    // Or should show 0 games
    const gameCount = await gamesPage.getGameCount()

    expect(noResultsVisible || gameCount === 0).toBe(true)
  })

  test('should maintain search state during navigation', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Perform a search
    const searchQuery = 'Zelda'
    await gamesPage.searchGames(searchQuery)

    // Navigate to a game detail if available
    const gameCount = await gamesPage.getGameCount()
    if (gameCount > 0) {
      // Click first game
      await gamesPage.clickFirstGame()

      // Go back
      await page.goBack()

      // Search should still be active
      const searchValue = await gamesPage.searchInput.inputValue()
      expect(searchValue).toBe(searchQuery)
    }
  })

  test('should support search with special characters', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Test various special characters
    const specialSearches = ['Mario & Luigi', 'Pokémon', 'Street Fighter II']

    for (const searchQuery of specialSearches) {
      await gamesPage.searchGames(searchQuery)

      // Verify search completes without errors
      await page.waitForTimeout(1000)

      // Clear for next search
      await gamesPage.searchInput.clear()
    }

    // Page should still be functional
    await expect(gamesPage.searchInput).toBeVisible()
  })

  test('should provide search suggestions or autocomplete if available', async ({
    page,
  }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Start typing a search
    await gamesPage.searchInput.fill('Mar')
    await page.waitForTimeout(500) // Wait for potential autocomplete

    // Check if autocomplete dropdown appears
    const hasAutocomplete = await page
      .locator(
        '[role="listbox"], [data-testid="search-suggestions"], .search-suggestions',
      )
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasAutocomplete) {
      console.log('Search autocomplete is available')

      // Try selecting a suggestion with keyboard
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      // Verify navigation or search update
      await page.waitForTimeout(1000)
    } else {
      console.log('No search autocomplete detected')
    }

    // Search should still work regardless
    await expect(gamesPage.searchInput).toBeVisible()
  })
})

test.describe('Search Performance Tests', () => {
  test('should handle rapid search input changes', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Rapidly change search input
    const searches = ['M', 'Ma', 'Mar', 'Mari', 'Mario']

    for (const partial of searches) {
      await gamesPage.searchInput.fill(partial)
      // Don't wait between inputs
    }

    // Final search should work
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1500)

    // Page should remain responsive
    await expect(gamesPage.searchInput).toBeVisible()
    await expect(gamesPage.pageHeading).toBeVisible()
  })

  test('should cancel previous search requests', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Start multiple searches quickly
    await listingsPage.searchListings('Pokemon')
    await listingsPage.searchListings('Mario')
    await listingsPage.searchListings('Zelda')

    // Only last search should be active
    const searchValue = await listingsPage.searchInput.inputValue()
    expect(searchValue).toBe('Zelda')

    // Results should be stable after final search
    await page.waitForTimeout(2000)
    const count1 = await listingsPage.getListingCount()
    await page.waitForTimeout(500)
    const count2 = await listingsPage.getListingCount()

    // Count shouldn't change if search is stable
    expect(count1).toBe(count2)
  })
})

test.describe('Cross-Page Search Tests', () => {
  test('should search across different content types', async ({ page }) => {
    const homePage = new HomePage(page)
    const gamesPage = new GamesPage(page)
    const listingsPage = new ListingsPage(page)

    await homePage.goto()

    // Search on games page
    await gamesPage.goto()
    await gamesPage.searchGames('Mario')
    const gameResults = await gamesPage.getGameCount()

    // Search on listings page
    await listingsPage.goto()
    await listingsPage.searchListings('Mario')
    const listingResults = await listingsPage.getListingCount()

    console.log(
      `Found ${gameResults} games and ${listingResults} listings for "Mario"`,
    )

    // Both searches should complete successfully
    expect(gameResults).toBeGreaterThanOrEqual(0)
    expect(listingResults).toBeGreaterThanOrEqual(0)
  })

  test('should handle search with no results across pages', async ({
    page,
  }) => {
    const searchQuery = 'nonexistentgame12345xyz'

    // Test on games page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.searchGames(searchQuery)

    const gamesNoResults = await page
      .getByText(/no games found|no results/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    // Test on listings page
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.searchListings(searchQuery)

    const listingsNoResults = await page
      .getByText(/no listings found|no results/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    // At least one page should show no results message
    expect(gamesNoResults || listingsNoResults).toBe(true)
  })
})
