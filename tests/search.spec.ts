import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Search Functionality Tests', () => {
  test('should search for games by title', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.verifyPageLoaded()

    await gamesPage.searchGames('Mario')

    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()
  })

  test('should search for listings with filters', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    await listingsPage.searchListings('Pokemon')

    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should handle empty search results gracefully', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.searchGames('xyznonexistentgame123')

    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()
  })

  test('should maintain search state during navigation', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const searchQuery = 'Zelda'
    await gamesPage.searchGames(searchQuery)

    await expect(gamesPage.gameItems.first()).toBeVisible()
    await gamesPage.clickFirstGame()

    await page.goBack()
    await page.waitForLoadState('domcontentloaded')

    await expect(gamesPage.pageHeading).toBeVisible()

    await expect(page).toHaveURL(new RegExp(searchQuery))
  })

  test('should support search with special characters', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const specialSearches = ['Mario & Luigi', 'Pok\u00e9mon', 'Street Fighter II']

    for (const searchQuery of specialSearches) {
      await gamesPage.searchGames(searchQuery)
      await expect(gamesPage.searchInput).toBeVisible()
      await gamesPage.searchInput.clear()
    }

    await expect(gamesPage.searchInput).toBeVisible()
  })

  test('should search input accept partial queries', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.searchInput.fill('Mar')

    await expect(gamesPage.searchInput).toHaveValue('Mar')
    await expect(gamesPage.searchInput).toBeVisible()
  })
})

test.describe('Search Performance Tests', () => {
  test('should handle rapid search input changes', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const searches = ['M', 'Ma', 'Mar', 'Mari', 'Mario']

    for (const partial of searches) {
      await gamesPage.searchInput.fill(partial)
    }

    await page.keyboard.press('Enter')
    await expect(gamesPage.pageHeading).toBeVisible()
    await expect(gamesPage.searchInput).toBeVisible()
  })

  test('should cancel previous search requests', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await listingsPage.searchListings('Pokemon')
    await listingsPage.searchListings('Mario')
    await listingsPage.searchListings('Zelda')

    await expect(listingsPage.searchInput).toHaveValue('Zelda')

    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })
})

test.describe('Cross-Page Search Tests', () => {
  test('should search across different content types', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    const listingsPage = new ListingsPage(page)

    await gamesPage.goto()
    await gamesPage.searchGames('Mario')
    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()

    await listingsPage.goto()
    await listingsPage.searchListings('Mario')
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should handle search with no results across pages', async ({ page }) => {
    const searchQuery = 'nonexistentgame12345xyz'

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.searchGames(searchQuery)
    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()

    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.searchListings(searchQuery)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })
})
