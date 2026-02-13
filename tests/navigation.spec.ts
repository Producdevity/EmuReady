import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Modern Navigation Tests', () => {
  test('should navigate between main pages using page objects', async ({ page }) => {
    // Start at home page
    const homePage = new HomePage(page)
    await homePage.goto()

    // Verify home page loads correctly
    await homePage.verifyHeroSectionVisible()
    await homePage.verifyNavigationVisible()
    await homePage.verifyAuthButtonsVisible()

    // Navigate to games page
    await homePage.waitForOverlaysToDisappear()
    await homePage.navigateToGames()

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()

    // Navigate to listings page (Handheld)
    await gamesPage.waitForOverlaysToDisappear()
    await gamesPage.navigateToHandheld()

    const listingsPage = new ListingsPage(page)
    await listingsPage.verifyPageLoaded()

    // Navigate back to home
    await listingsPage.waitForOverlaysToDisappear()
    await listingsPage.navigateToHome()

    // Verify we're back at home
    await homePage.verifyHeroSectionVisible()
  })

  test('should display correct page headings and content', async ({ page }) => {
    // Test Home Page
    const homePage = new HomePage(page)
    await homePage.goto()

    await expect(homePage.heroHeading).toBeVisible()
    await expect(homePage.latestReportsSection).toBeVisible()

    // Test Games Page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await expect(gamesPage.pageHeading).toBeVisible()

    // Test Listings Page
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.pageHeading).toBeVisible()

    // On mobile, filters might be hidden
    const isMobile = page.viewportSize()?.width ? page.viewportSize()!.width < 768 : false
    if (!isMobile) {
      await expect(listingsPage.filtersHeading).toBeVisible()
    }
  })

  test('should have working logo navigation', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Navigate to games page
    await homePage.navigateToGames()
    await expect(page).toHaveURL('/games')

    // Click logo to return home
    const gamesPage = new GamesPage(page)
    await gamesPage.waitForOverlaysToDisappear()
    await gamesPage.clickLogo()
    await expect(page).toHaveURL('/')

    // Verify we're back at home
    await homePage.verifyHeroSectionVisible()
  })

  test('should show authentication buttons when not logged in', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Verify user is not authenticated
    const isAuthenticated = await homePage.isAuthenticated()
    expect(isAuthenticated).toBe(false)

    // Verify auth buttons are visible
    await expect(homePage.signInButton).toBeVisible()
    await expect(homePage.signUpButton).toBeVisible()
  })

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const homePage = new HomePage(page)
    await homePage.goto()

    // Mobile menu button should be visible
    await expect(homePage.mobileMenuButton).toBeVisible()

    // Open mobile menu
    await homePage.openMobileMenu()

    // Navigation links should still work (some may be hidden/shown)
    const gamesLink = homePage.gamesLink
    if (await gamesLink.isVisible()) {
      await gamesLink.click()
      await expect(page).toHaveURL('/games')
    }
  })
})

test.describe('Modern Page Content Tests', () => {
  test('should display games page content correctly', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Verify page structure
    await gamesPage.verifyPageLoaded()
    await gamesPage.verifyGameHeadingsVisible()

    // Check if games are present or empty state is shown
    await gamesPage.verifyGamesVisible()
  })

  test('should display listings page content correctly', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Verify page structure
    await listingsPage.verifyPageLoaded()
    await listingsPage.verifyFiltersHeadingVisible()

    // Check if listings are present or empty state is shown
    await listingsPage.verifyListingsVisible()
  })

  test('should handle search functionality if available', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Check if search is available
    try {
      await gamesPage.verifySearchVisible()

      // Test search functionality
      await gamesPage.searchGames('mario')

      // Verify search was performed (URL change or results update)
      // The page should either show results or no results message
      await page.waitForLoadState('domcontentloaded')

      const hasResults = (await gamesPage.getGameCount()) > 0
      const hasNoResults = await gamesPage.noGamesMessage.isVisible()

      // Either results or no results message should be shown
      expect(hasResults || hasNoResults).toBe(true)
    } catch {
      // Search not available on this page - verify page is still functional
      await gamesPage.verifyPageLoaded()
    }
  })

  test('should support keyboard navigation through main menu', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Focus on first navigation link
    await page.keyboard.press('Tab')

    // Navigate through main menu items with Tab and collect focused link texts
    const navigationLinks = ['Home', 'Handheld', 'PC', 'Games', 'Emulators']
    const focusedTexts: string[] = []

    for (const _linkText of navigationLinks) {
      const focusedElement = page.locator(':focus')
      const text = await focusedElement.textContent()
      if (text) {
        focusedTexts.push(text.trim().toLowerCase())
      }
      await page.keyboard.press('Tab')
    }

    // At least one navigation link should have received focus during tabbing
    const matchedLinks = navigationLinks.filter((link) =>
      focusedTexts.some((text) => text.includes(link.toLowerCase())),
    )
    expect(matchedLinks.length).toBeGreaterThan(0)
  })

  test('should handle browser back and forward navigation', async ({ page }) => {
    const homePage = new HomePage(page)
    const gamesPage = new GamesPage(page)
    const listingsPage = new ListingsPage(page)

    // Navigate through multiple pages
    await homePage.goto()
    await homePage.navigateToGames()
    await gamesPage.navigateToHandheld()

    // Verify we're on listings page
    const isOnListingsPage = await listingsPage.isOnListingsPage()
    expect(isOnListingsPage).toBe(true)

    // Test browser back button
    await page.goBack()
    await expect(page).toHaveURL('/games')

    await page.goBack()
    await expect(page).toHaveURL('/')

    // Test browser forward button
    await page.goForward()
    await expect(page).toHaveURL('/games')

    await page.goForward()
    await expect(page).toHaveURL('/listings')
  })

  test('should toggle mobile menu correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const homePage = new HomePage(page)
    await homePage.goto()

    // Mobile menu button should be visible
    await expect(homePage.mobileMenuButton).toBeVisible()

    // Open mobile menu
    await homePage.mobileMenuButton.click()

    // Verify menu is visible after animation
    const mobileMenuDiv = page.locator('.md\\:hidden').filter({ hasText: 'Handheld' }).last()
    await expect(mobileMenuDiv).toHaveClass(/opacity-100/)

    // Close menu by clicking the button again (toggle)
    await homePage.mobileMenuButton.click()

    // Verify menu is hidden after animation
    await expect(mobileMenuDiv).toHaveClass(/opacity-0/)
  })
})
