import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Browsing Tests', () => {
  test('should display home page with hero and latest reports', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.verifyHeroSectionVisible()
    await homePage.verifyLatestListingsVisible()
  })

  test('should display games library with game items', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.verifyPageLoaded()

    await expect(gamesPage.gameItems.first()).toBeVisible()
  })

  test('should display compatibility listings with content', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.filtersHeading).toBeVisible()

    await expect(listingsPage.listingItems.first()).toBeVisible()
  })

  test('should navigate between home, games, and listings', async ({ page }) => {
    const homePage = new HomePage(page)
    const gamesPage = new GamesPage(page)
    const listingsPage = new ListingsPage(page)

    await homePage.goto()
    await homePage.verifyHeroSectionVisible()

    await homePage.waitForOverlaysToDisappear()
    await homePage.navigateToGames()
    await gamesPage.verifyPageLoaded()

    await gamesPage.waitForOverlaysToDisappear()
    await gamesPage.navigateToHandheld()
    await listingsPage.verifyPageLoaded()

    await listingsPage.waitForOverlaysToDisappear()
    await listingsPage.clickLogo()
    await homePage.verifyHeroSectionVisible()
  })

  test('should load PC listings page', async ({ page }) => {
    await page.goto('/pc-listings')
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveURL('/pc-listings')
    await expect(page.getByRole('heading', { name: /pc/i }).first()).toBeVisible()
  })

  test('should navigate to a game detail page', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.verifyPageLoaded()

    await expect(gamesPage.gameItems.first()).toBeVisible()

    await gamesPage.clickFirstGame()

    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('should navigate to a listing detail page', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await listingsPage.verifyPageLoaded()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()

    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('Content Display Tests', () => {
  test('should display EmuReady branding on home page', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.logo).toBeVisible()
  })

  test('should display EmuReady branding on games page', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('domcontentloaded')

    const homePage = new HomePage(page)
    await expect(homePage.logo).toBeVisible()
  })

  test('should display EmuReady branding on listings page', async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('domcontentloaded')

    const homePage = new HomePage(page)
    await expect(homePage.logo).toBeVisible()
  })

  test('should display footer on home page', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer').first()
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/emuready/i).first()).toBeVisible()
  })

  test('should display footer on games page', async ({ page }) => {
    await page.goto('/games')

    const footer = page.locator('footer').first()
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/emuready/i).first()).toBeVisible()
  })

  test('should display footer on listings page', async ({ page }) => {
    await page.goto('/listings')

    const footer = page.locator('footer').first()
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/emuready/i).first()).toBeVisible()
  })

  test('should show empty state when search returns no games', async ({ page }) => {
    // A no-match search term exercises the same empty-state branch as a
    // truly empty database, without needing to mock the tRPC query.
    await page.goto('/games?search=zzqqxxnotarealgame42')

    await expect(page.getByText(/no games found matching your criteria/i)).toBeVisible()
  })

  test('should display correct page titles', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/home/i)

    await page.goto('/games')
    await expect(page).toHaveTitle(/games.*emuready/i)

    await page.goto('/listings')
    await expect(page).toHaveTitle(/compatibility.*reports.*emuready/i)
  })
})

test.describe('Responsive Design - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('should load and navigate on tablet viewport', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.verifyHeroSectionVisible()
    await homePage.verifyNavigationVisible()

    await homePage.navigateToGames()
    await expect(page).toHaveURL('/games')

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()
  })
})

test.describe('Responsive Design - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should load home page on mobile viewport', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(page).toHaveURL('/')
    await expect(homePage.mobileMenuButton).toBeVisible()
  })

  test('should open mobile menu on mobile viewport', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.mobileMenuButton).toBeVisible()
    await homePage.openMobileMenu()
    await expect(homePage.mobileMenu).toBeVisible()
  })

  test('should display desktop nav after resizing from mobile to desktop', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.mobileMenuButton).toBeVisible()

    await page.setViewportSize({ width: 1200, height: 800 })
    await homePage.verifyNavigationVisible()

    await expect(page.getByText(/emuready/i).first()).toBeVisible()
  })
})
