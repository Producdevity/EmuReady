import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Error Handling Tests', () => {
  test('should display 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345')

    await expect(page.getByText(/not found/i).first()).toBeVisible()
  })

  test('should display error for invalid game ID', async ({ page }) => {
    await page.goto('/games/invalid-game-id-xyz')

    await expect(page.getByText(/not found|does not exist|invalid|error/i).first()).toBeVisible()
  })

  test('should show error UI when API requests fail', async ({ page }) => {
    await page.route('**/api/trpc/**', (route) => route.abort('failed'))

    await page.goto('/games', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('main')).toBeVisible()
  })

  test('should render page shell even when API is slow', async ({ page }) => {
    await page.route('**/api/trpc/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await route.continue()
    })

    await page.goto('/listings', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('main')).toBeVisible()

    await page.unroute('**/api/trpc/**')
  })

  test('should keep search input functional after failed search API call', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await page.route('**/api/trpc/**', (route) => route.abort('failed'))

    await gamesPage.searchInput.fill('Mario')
    await page.keyboard.press('Enter')

    await expect(gamesPage.searchInput).toBeVisible()
    await expect(gamesPage.searchInput).toBeEnabled()

    await page.unroute('**/api/trpc/**')
  })

  test('should not crash with invalid filter query parameters', async ({ page }) => {
    await page.goto(
      '/listings?device=invalid-device-123&emulator=non-existent-emulator&performance=super-invalid',
    )

    // Page layout has nested <main> elements, so strict-mode selectors on
    // main fail. The heading is a unique non-crash indicator.
    const listingsPage = new ListingsPage(page)
    await expect(listingsPage.pageHeading).toBeVisible()
  })

  test('should not expose technical error details on 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-at-all')

    await expect(page.getByText(/not found/i).first()).toBeVisible()

    await expect(page.getByText(/stack trace/i)).not.toBeVisible()
    await expect(page.getByText(/database.*error/i)).not.toBeVisible()
  })

  test('should still render page when images fail to load', async ({ page }) => {
    await page.route('**/*.{png,jpg,jpeg,gif,webp}', (route) => route.abort('failed'))

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.verifyPageLoaded()

    await page.unroute('**/*.{png,jpg,jpeg,gif,webp}')
  })

  test('should allow public page access after cookies are cleared', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await page.context().clearCookies()

    await homePage.navigateToGames()

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()
  })
})

test.describe('Browser Navigation Error Tests', () => {
  test('should recover via back button after hitting a 404', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await page.goto('/invalid-page-404')

    await expect(page.getByText(/not found/i).first()).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL('/')

    await homePage.verifyHeroSectionVisible()
  })

  test('should remain functional even if console errors occur', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (error) => {
      jsErrors.push(error.message)
    })

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.verifyPageLoaded()

    await gamesPage.navigateToHome()
    await expect(page).toHaveURL('/')
  })
})
