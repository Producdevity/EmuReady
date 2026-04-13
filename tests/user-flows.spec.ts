import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('User Flow Tests', () => {
  test('should complete flow: browse games → search → view game detail', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.navigateToGames()
    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()

    await gamesPage.searchGames('Mario')

    const marioGame = gamesPage.gameItems.filter({ hasText: /mario/i }).first()
    await expect(marioGame).toBeVisible()

    await marioGame.click()
    await expect(page).toHaveURL(/\/games\/[^/]+/)

    const detailHeading = page.locator('h1').first()
    await expect(detailHeading).toContainText(/mario/i)
  })

  test('should complete flow: browse listings → view listing detail', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await expect(page).toHaveURL(/\/listings\/[^/]+/)

    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('should navigate back through browser history correctly', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()
    const homeUrl = page.url()

    await homePage.navigateToGames()
    const gamesUrl = page.url()

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()
    await gamesPage.clickFirstGame()
    await expect(page).toHaveURL(/\/games\/[^/]+/)

    await page.goBack()
    await expect(page).toHaveURL(gamesUrl)

    await page.goBack()
    await expect(page).toHaveURL(homeUrl)

    await page.goForward()
    await expect(page).toHaveURL(gamesUrl)
  })

  test('should complete mobile user journey: home → games → search → detail', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.navigateToGames()
    await expect(page).toHaveURL(/\/games/)

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()

    await gamesPage.searchGames('Mario')

    const marioGame = gamesPage.gameItems.filter({ hasText: /mario/i }).first()
    await expect(marioGame).toBeVisible()

    await gamesPage.clickFirstGame()
    await expect(page).toHaveURL(/\/games\/[^/]+/)

    await page.goBack()
    await expect(page).toHaveURL(/\/games/)
  })

  test('should recover from interrupted search by starting a new one', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.searchInput.fill('Final Fant')

    await page.goto('/')
    await page.goBack()

    await gamesPage.searchInput.clear()
    await gamesPage.searchGames('Pokemon')

    await expect(gamesPage.searchInput).toHaveValue('Pokemon')
    await expect(page).toHaveURL(/[?&]search=Pokemon/)
  })
})

test.describe('Cross-Page User Flows', () => {
  test('should navigate between handheld and PC listings', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.navigateToHandheld()
    await expect(page).toHaveURL('/listings')

    const listingsPage = new ListingsPage(page)
    await expect(listingsPage.pageHeading).toBeVisible()

    await homePage.navigateToPC()
    await expect(page).toHaveURL('/pc-listings')

    await homePage.navigateToHandheld()
    await expect(page).toHaveURL('/listings')
    await expect(listingsPage.pageHeading).toBeVisible()
  })
})
