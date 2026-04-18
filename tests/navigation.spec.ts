import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Navigation Tests', () => {
  test('should navigate between main pages', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.verifyHeroSectionVisible()
    await homePage.verifyNavigationVisible()
    await homePage.verifyAuthButtonsVisible()

    await homePage.waitForOverlaysToDisappear()
    await homePage.navigateToGames()

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()

    await gamesPage.waitForOverlaysToDisappear()
    await gamesPage.navigateToHandheld()

    const listingsPage = new ListingsPage(page)
    await listingsPage.verifyPageLoaded()

    await listingsPage.waitForOverlaysToDisappear()
    await listingsPage.navigateToHome()

    await homePage.verifyHeroSectionVisible()
  })

  test('should display correct page headings', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()
    await expect(homePage.heroHeading).toBeVisible()
    await expect(homePage.latestReportsSection).toBeVisible()

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await expect(gamesPage.pageHeading).toBeVisible()

    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await expect(listingsPage.pageHeading).toBeVisible()
  })

  test('should navigate home via logo click', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.navigateToGames()
    await expect(page).toHaveURL('/games')

    const gamesPage = new GamesPage(page)
    await gamesPage.waitForOverlaysToDisappear()
    await gamesPage.clickLogo()
    await expect(page).toHaveURL('/')

    await homePage.verifyHeroSectionVisible()
  })

  test('should show sign-in and sign-up buttons when not logged in', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.signInButton).toBeVisible()
    await expect(homePage.signUpButton).toBeVisible()
  })

  test('should handle browser back and forward navigation', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()
    await homePage.navigateToGames()
    await homePage.navigateToHandheld()

    await expect(page).toHaveURL('/listings')

    await page.goBack()
    await expect(page).toHaveURL('/games')

    await page.goBack()
    await expect(page).toHaveURL('/')

    await page.goForward()
    await expect(page).toHaveURL('/games')

    await page.goForward()
    await expect(page).toHaveURL('/listings')
  })
})

test.describe('Page Content Tests', () => {
  test('should display games page with heading and game items', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.verifyPageLoaded()
    await expect(gamesPage.gameItems.first()).toBeVisible()
  })

  test('should display listings page with heading and listing items', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.filtersHeading).toBeVisible()
    await expect(listingsPage.listingItems.first()).toBeVisible()
  })

  test('should search games from the games page', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.searchGames('mario')

    await expect(page).toHaveURL(/[?&]search=/)
  })

  test('should support keyboard tab navigation through main menu', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await page.keyboard.press('Tab')

    const navigationLinks = ['Home', 'Handheld', 'PC', 'Games', 'Emulators']
    const focusedTexts: string[] = []

    for (let i = 0; i < navigationLinks.length; i++) {
      const focusedElement = page.locator(':focus')
      const text = await focusedElement.textContent()
      if (text) {
        focusedTexts.push(text.trim().toLowerCase())
      }
      await page.keyboard.press('Tab')
    }

    const matchedLinks = navigationLinks.filter((link) =>
      focusedTexts.some((text) => text.includes(link.toLowerCase())),
    )
    expect(matchedLinks.length).toBeGreaterThan(0)
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show mobile menu button', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.mobileMenuButton).toBeVisible()
  })

  test('should open mobile menu and show navigation links', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.mobileMenuButton).toBeVisible()
    await homePage.openMobileMenu()
    await expect(homePage.mobileMenu).toBeVisible()
  })

  test('should toggle mobile menu open and closed', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.mobileMenuButton).toBeVisible()

    await homePage.mobileMenuButton.click()

    const mobileMenuDiv = page.locator('.md\\:hidden').filter({ hasText: 'Handheld' }).last()
    await expect(mobileMenuDiv).toHaveClass(/opacity-100/)

    await homePage.mobileMenuButton.click()
    await expect(mobileMenuDiv).toHaveClass(/opacity-0/)
  })

  test('should show Home, Handheld, and PC links in mobile menu', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.openMobileMenu()

    await expect(homePage.mobileMenu.getByRole('link', { name: /^home$/i })).toBeVisible()
    await expect(homePage.mobileMenu.getByRole('link', { name: /handheld/i })).toBeVisible()
    await expect(homePage.mobileMenu.getByRole('link', { name: /^pc$/i })).toBeVisible()
  })
})
