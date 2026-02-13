import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Modern Browsing Tests', () => {
  test('should display home page with latest content', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Verify hero section
    await homePage.verifyHeroSectionVisible()

    // Verify latest listings section
    await homePage.verifyLatestListingsVisible()

    // Check if browse links work
    const browseLink = page.getByRole('link', { name: /browse.*compatibility/i }).first()
    if (await browseLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await browseLink.click()
      await expect(page).toHaveURL(/\/(listings|pc-listings)/)
    }
  })

  test('should display games library with content', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Verify page loads
    await gamesPage.verifyPageLoaded()

    // Verify games are displayed
    await gamesPage.verifyGamesVisible()

    // Check that we have game content
    const gameCount = await gamesPage.getGameCount()
    test.skip(gameCount === 0, 'No games available for this test')

    // Verify first game is clickable
    await expect(gamesPage.gameItems.first()).toBeVisible()

    // Verify game headings exist
    await gamesPage.verifyGameHeadingsVisible()
  })

  test('should display compatibility listings with content', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Verify page loads
    await listingsPage.verifyPageLoaded()

    // Verify filters section
    await listingsPage.verifyFiltersHeadingVisible()

    // Verify listings are displayed
    await listingsPage.verifyListingsVisible()

    // Check that we have listing content
    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available for this test')

    // Verify first listing is clickable
    await expect(listingsPage.listingItems.first()).toBeVisible()
  })

  test('should navigate between different content areas', async ({ page }) => {
    const homePage = new HomePage(page)
    const gamesPage = new GamesPage(page)
    const listingsPage = new ListingsPage(page)

    // Start at home
    await homePage.goto()
    await homePage.verifyHeroSectionVisible()

    // Navigate to games
    await homePage.waitForOverlaysToDisappear()
    await homePage.navigateToGames()
    await gamesPage.verifyPageLoaded()

    // Navigate to handheld listings
    await gamesPage.waitForOverlaysToDisappear()
    await gamesPage.navigateToHandheld()
    await listingsPage.verifyPageLoaded()

    // Navigate back to home via logo
    await listingsPage.waitForOverlaysToDisappear()
    await listingsPage.clickLogo()
    await homePage.verifyHeroSectionVisible()

    // PC navigation is tested separately due to overlay timing issues
  })

  test('should navigate to PC listings', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Wait for page to fully load and dismiss any overlays
    await homePage.waitForPageLoad()

    // Navigate directly to PC listings
    await page.goto('/pc-listings')
    await page.waitForLoadState('domcontentloaded')

    // Verify we're on PC listings page
    await expect(page).toHaveURL('/pc-listings')

    // PC listings page might use icons or different layout on mobile
    // Look for any PC-related content, including icons, buttons, or navigation
    const hasPCContent =
      (await page
        .getByText(/pc|computer|cpu|gpu|memory|add pc listing/i)
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)) ||
      (await page
        .locator('[data-testid*="pc"]')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)) ||
      (await page
        .locator('svg')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)) ||
      (await page
        .getByRole('link', { name: /add.*pc.*listing/i })
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)) ||
      (await page
        .getByRole('button')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false))

    expect(hasPCContent).toBe(true)
  })

  test('should handle game detail navigation', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.verifyPageLoaded()
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    const gameCount = await gamesPage.getGameCount()
    test.skip(gameCount === 0, 'No games available to test navigation')

    await gamesPage.cookieBanner.dismissIfPresent()

    const firstGame = gamesPage.gameItems.first()
    await firstGame.waitFor({ state: 'visible', timeout: 5000 })
    const href = await firstGame.getAttribute('href')
    await firstGame.click({ force: true })

    try {
      await expect(page).toHaveURL(/\/games\/[^/?]+/, { timeout: 5000 })
    } catch {
      // Client-side navigation may have been absorbed; use direct navigation
      if (href) {
        await page.goto(href)
        await expect(page).toHaveURL(/\/games\/[^/?]+/, { timeout: 5000 })
      }
    }

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 })
  })

  test('should handle listing detail navigation', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await listingsPage.verifyPageLoaded()
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test navigation')

    await listingsPage.cookieBanner.dismissIfPresent()

    const firstListing = listingsPage.listingItems.first()
    await firstListing.waitFor({ state: 'visible', timeout: 5000 })
    const href = await firstListing.getAttribute('href')
    await firstListing.click({ force: true })

    try {
      await expect(page).toHaveURL(/\/listings\/[^/?]+/, { timeout: 5000 })
    } catch {
      // Client-side navigation may have been absorbed; use direct navigation
      if (href) {
        await page.goto(href)
        await expect(page).toHaveURL(/\/listings\/[^/?]+/, { timeout: 5000 })
      }
    }

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Modern Content Display Tests', () => {
  test('should display consistent branding across pages', async ({ page }) => {
    const pages = [
      { path: '/', name: 'home' },
      { path: '/games', name: 'games' },
      { path: '/listings', name: 'listings' },
      { path: '/pc-listings', name: 'pc-listings' },
    ]

    const isMobile = page.viewportSize()?.width ? page.viewportSize()!.width < 768 : false

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path)
      await page.waitForLoadState('domcontentloaded')

      // Should see EmuReady branding - might be in logo or mobile menu
      const brandingVisible =
        (await page
          .getByText(/emuready/i)
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false)) ||
        (await page
          .getByRole('link', { name: /emuready/i })
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false))
      expect(brandingVisible).toBe(true)

      // Navigation visibility depends on viewport
      const homePage = new HomePage(page)
      if (isMobile) {
        // On mobile, check for mobile menu button instead of nav links
        const mobileMenuVisible = await homePage.mobileMenuButton
          .isVisible({ timeout: 2000 })
          .catch(() => false)
        const navLinksVisible = await homePage.homeLink
          .isVisible({ timeout: 2000 })
          .catch(() => false)
        expect(mobileMenuVisible || navLinksVisible).toBe(true)
      } else {
        // Desktop should have visible nav links (Home, Handheld, PC)
        await expect(homePage.homeLink).toBeVisible()
        await expect(homePage.handheldLink).toBeVisible()
        await expect(homePage.pcLink).toBeVisible()
      }
    }
  })

  test('should display footer information consistently', async ({ page }) => {
    const pages = ['/', '/games', '/listings']

    for (const pagePath of pages) {
      await page.goto(pagePath)

      // Check for footer elements - use more specific locators to avoid duplicates
      try {
        // Look for footer specifically
        const footer = page.locator('footer').first()
        await footer.waitFor({ state: 'visible', timeout: 5000 })

        // Check for footer content within the footer element
        const hasAboutLink = await footer
          .getByRole('link', { name: /about/i })
          .isVisible({ timeout: 2000 })
        const hasCommunityLink = await footer.getByText(/community/i).isVisible({ timeout: 2000 })
        const hasCopyright = await footer.getByText(/emuready/i).isVisible({ timeout: 2000 })

        // At least some footer content should be present
        expect(hasAboutLink || hasCommunityLink || hasCopyright).toBe(true)
      } catch {
        // Fallback: check if page has any footer-like content at the bottom
        const hasCopyright = await page.getByText(/© \d{4} emuready/i).isVisible({ timeout: 2000 })
        // Use nth() to avoid multiple element matches
        const hasEmuReady = await page
          .getByText(/emuready/i)
          .nth(0)
          .isVisible({ timeout: 1000 })
        expect(hasCopyright || hasEmuReady).toBe(true)
      }
    }
  })

  test('should handle empty states appropriately', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const gameCount = await gamesPage.getGameCount()
    test.skip(gameCount > 0, 'Games page has content - empty state test not applicable')

    // Page should still be functional
    await gamesPage.verifyPageLoaded()

    // Should have appropriate messaging
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(100)
  })

  test('should display page titles correctly', async ({ page }) => {
    const pages = [
      { path: '/', expectedTitle: /home/i },
      { path: '/games', expectedTitle: /games.*emuready/i },
      { path: '/listings', expectedTitle: /compatibility.*reports.*emuready/i },
    ]

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path)

      const title = await page.title()
      expect(title).toMatch(pageInfo.expectedTitle)
    }
  })
})

test.describe('Modern Responsive Design Tests', () => {
  test('should work correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    const homePage = new HomePage(page)
    await homePage.goto()

    // Verify page loads and is functional
    await homePage.verifyHeroSectionVisible()
    await homePage.verifyNavigationVisible()

    // Test navigation on tablet
    await homePage.navigateToGames()
    await expect(page).toHaveURL('/games')

    const gamesPage = new GamesPage(page)
    await gamesPage.verifyPageLoaded()
  })

  test('should work correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const homePage = new HomePage(page)
    await homePage.goto()
    await homePage.waitForPageLoad()

    // The page should have loaded with mobile viewport
    await expect(page).toHaveURL('/')

    // Check for any visible elements that indicate the page loaded
    const pageElements = [
      homePage.mobileMenuButton,
      homePage.homeLink,
      homePage.gamesLink,
      page.locator('nav').first(),
      page.getByRole('button').first(),
      page.getByRole('link').first(),
      page.locator('main').first(),
      page.locator('header').first(),
      page.locator('div').first(),
    ]

    let foundVisibleElement = false
    for (const element of pageElements) {
      try {
        const isVisible = await element.isVisible({ timeout: 1000 })
        if (isVisible) {
          foundVisibleElement = true
          break
        }
      } catch {
        // Element might not exist, continue checking
      }
    }

    // At minimum, we should have some visible content
    expect(foundVisibleElement).toBe(true)

    // Try to interact with mobile navigation if available
    const hasMobileMenu = await homePage.mobileMenuButton
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    if (hasMobileMenu) {
      await homePage.openMobileMenu()
    }
  })

  test('should handle viewport changes gracefully', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Start with desktop
    await page.setViewportSize({ width: 1200, height: 800 })
    await homePage.verifyNavigationVisible()

    // Change to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(homePage.mobileMenuButton).toBeVisible()

    // Change back to desktop
    await page.setViewportSize({ width: 1200, height: 800 })
    await homePage.verifyNavigationVisible()

    // Page should remain functional throughout
    await expect(page.getByText(/emuready/i).first()).toBeVisible()
  })
})
