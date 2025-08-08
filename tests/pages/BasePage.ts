import { CookieBanner } from './CookieBanner'
import { TEST_CONFIG, waitForPageStability } from '../helpers/test-config'
import type { Page } from '@playwright/test'

export abstract class BasePage {
  readonly page: Page
  readonly cookieBanner: CookieBanner

  constructor(page: Page) {
    this.page = page
    this.cookieBanner = new CookieBanner(page)
  }

  // Navigation elements that appear on all pages
  get navigation() {
    return this.page.locator('nav').first()
  }

  get logo() {
    return this.page.getByRole('link', { name: /emuready/i }).first()
  }

  get homeLink() {
    return this.page.getByRole('link', { name: /^home$/i }).first()
  }

  get handheldLink() {
    return this.page.getByRole('link', { name: /handheld/i }).first()
  }

  get pcLink() {
    return this.page.getByRole('link', { name: /^pc$/i }).first()
  }

  get gamesLink() {
    return this.page.getByRole('link', { name: /^games$/i }).first()
  }

  // Authentication elements
  get signInButton() {
    return this.page.getByRole('button', { name: /sign in/i }).first()
  }

  get signUpButton() {
    return this.page.getByRole('button', { name: /sign up/i }).first()
  }

  // Mobile navigation
  get mobileMenuButton() {
    return this.page.getByRole('button', { name: /open main menu/i })
  }

  get mobileMenu() {
    // Mobile menu is the div that appears below navbar with transition classes
    return this.page
      .locator('.md\\:hidden')
      .filter({ has: this.page.locator('a[href="/"]') })
      .last()
  }

  // Common actions
  async navigateToHome() {
    const isMobile = this.page.viewportSize()?.width
      ? this.page.viewportSize()!.width < 768
      : false

    if (isMobile) {
      // On mobile, use direct navigation to avoid overlay issues
      await this.page.goto('/')
    } else {
      await this.waitForOverlaysToDisappear()

      try {
        await this.homeLink.click({ timeout: 5000 })
      } catch (error) {
        console.log(
          'First click failed, trying alternative approach:',
          error instanceof Error ? error.message : String(error),
        )

        await this.homeLink.scrollIntoViewIfNeeded()
        await this.page.waitForTimeout(500)

        try {
          await this.homeLink.click({ timeout: 5000 })
        } catch {
          console.log('Regular click failed, using force click')
          await this.homeLink.click({ force: true })
        }
      }
    }

    await this.page.waitForURL('/', {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    })
  }

  async navigateToHandheld() {
    const isMobile = this.page.viewportSize()?.width
      ? this.page.viewportSize()!.width < 768
      : false

    if (isMobile) {
      // On mobile, use mobile menu or direct navigation
      const mobileMenuVisible = await this.mobileMenuButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      if (mobileMenuVisible) {
        await this.mobileMenuButton.click()
        await this.page.waitForTimeout(600)
        const mobileHandheldLink = this.page
          .getByRole('link', { name: /handheld/i })
          .last()
        await mobileHandheldLink.click()
      } else {
        await this.page.goto('/listings')
      }
    } else {
      await this.waitForOverlaysToDisappear()

      try {
        await this.handheldLink.click({ timeout: 5000 })
      } catch (error) {
        console.log(
          'First click failed, trying alternative approach:',
          error instanceof Error ? error.message : String(error),
        )

        await this.handheldLink.scrollIntoViewIfNeeded()
        await this.page.waitForTimeout(500)

        try {
          await this.handheldLink.click({ timeout: 5000 })
        } catch {
          console.log('Regular click failed, using force click')
          await this.handheldLink.click({ force: true })
        }
      }
    }

    await this.page.waitForURL('/listings', { timeout: 15000 })
  }

  async navigateToPC() {
    const isMobile = this.page.viewportSize()?.width
      ? this.page.viewportSize()!.width < 768
      : false

    if (isMobile) {
      // On mobile, use mobile menu or direct navigation
      const mobileMenuVisible = await this.mobileMenuButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      if (mobileMenuVisible) {
        await this.mobileMenuButton.click()
        await this.page.waitForTimeout(600)
        const mobilePCLink = this.page
          .getByRole('link', { name: /^pc$/i })
          .last()
        await mobilePCLink.click()
      } else {
        await this.page.goto('/pc-listings')
      }
    } else {
      await this.waitForOverlaysToDisappear()

      try {
        await this.pcLink.click({ timeout: 5000 })
      } catch (error) {
        console.log(
          'First click failed, trying alternative approach:',
          error instanceof Error ? error.message : String(error),
        )

        await this.pcLink.scrollIntoViewIfNeeded()
        await this.page.waitForTimeout(500)

        try {
          await this.pcLink.click({ timeout: 5000 })
        } catch {
          console.log('Regular click failed, using force click')
          await this.pcLink.click({ force: true })
        }
      }
    }

    await this.page.waitForURL('/pc-listings', { timeout: 15000 })
  }

  async navigateToGames() {
    const isMobile = this.page.viewportSize()?.width
      ? this.page.viewportSize()!.width < 768
      : false

    if (isMobile) {
      // On mobile, we need to open the mobile menu first
      const mobileMenuVisible = await this.mobileMenuButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      if (mobileMenuVisible) {
        // Open mobile menu
        await this.mobileMenuButton.click()
        await this.page.waitForTimeout(600) // Wait for menu animation

        // Find games link in mobile menu
        const mobileGamesLink = this.page
          .getByRole('link', { name: /^games$/i })
          .last()
        await mobileGamesLink.click()
      } else {
        // Fallback to direct navigation if menu not available
        await this.page.goto('/games')
      }
    } else {
      // Desktop navigation
      await this.waitForOverlaysToDisappear()

      try {
        await this.gamesLink.click({ timeout: 5000 })
      } catch (error) {
        console.log(
          'First click failed, trying alternative approach:',
          error instanceof Error ? error.message : String(error),
        )

        // Try scrolling into view and clicking
        await this.gamesLink.scrollIntoViewIfNeeded()
        await this.page.waitForTimeout(500)

        try {
          await this.gamesLink.click({ timeout: 5000 })
        } catch {
          // Last resort: force click
          console.log('Regular click failed, using force click')
          await this.gamesLink.click({ force: true })
        }
      }
    }

    await this.page.waitForURL('/games', {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    })
  }

  async clickLogo() {
    const isMobile = this.page.viewportSize()?.width
      ? this.page.viewportSize()!.width < 768
      : false

    if (isMobile) {
      // On mobile, use direct navigation for reliability
      await this.page.goto('/')
    } else {
      // Check for and dismiss any overlay before clicking
      await this.cookieBanner.dismissIfPresent()

      try {
        await this.logo.click()
      } catch (error) {
        console.log(
          'First click failed, trying force click:',
          error instanceof Error ? error.message : String(error),
        )
        // If normal click fails due to overlay, force click
        await this.logo.click({ force: true })
      }
    }

    await this.page.waitForURL('/', { timeout: 10000 })
  }

  async openMobileMenu() {
    // Check if menu is already open
    const menuClass =
      (await this.mobileMenuButton.locator('..').getAttribute('class')) || ''
    const isOpen =
      menuClass.includes('opacity-100') || menuClass.includes('max-h-screen')

    if (!isOpen) {
      await this.mobileMenuButton.click()
      // Wait for menu animation
      await this.page.waitForTimeout(600)
    }
  }

  async waitForPageLoad() {
    const browserName = this.page.context().browser()?.browserType().name()

    // Use optimized wait strategy for production builds
    try {
      if (browserName === 'webkit') {
        // Webkit needs more aggressive waiting
        await this.page.waitForLoadState('networkidle', {
          timeout: TEST_CONFIG.timeouts.pageLoad,
        })
        await this.page.waitForTimeout(1000)
      } else {
        // For other browsers, use stability helper
        await waitForPageStability(this.page, TEST_CONFIG.timeouts.pageLoad)
      }
    } catch {
      console.log('Page load timeout, continuing with DOM ready state')
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
    }

    // Dismiss cookie banner if present
    await this.cookieBanner.dismissIfPresent()

    // Short wait to ensure banner is fully dismissed
    await this.page.waitForTimeout(300)
  }

  async waitForOverlaysToDisappear() {
    const browserName = this.page.context().browser()?.browserType().name()
    const isMobile = this.page.viewportSize()?.width
      ? this.page.viewportSize()!.width < 768
      : false

    // Mobile needs extra time for animations
    if (isMobile) {
      await this.page.waitForTimeout(1000)
    }

    // Different browsers may handle animations differently
    if (browserName === 'webkit') {
      // Safari/WebKit needs extra time for some animations
      await this.page.waitForTimeout(500)
    }

    // Wait for any overlays or modals to disappear
    const overlaySelectors = [
      '.fixed.inset-0.z-[70]', // Cookie banner overlay
      '[class*="backdrop"][class*="pointer-events-auto"]',
      '.absolute.inset-0.bg-black/30.backdrop-blur-[2px].pointer-events-auto',
      '.cl-modal', // Clerk modals
      '.cl-modalContent',
    ]

    // First, wait a bit for any animations to start
    await this.page.waitForTimeout(300)

    for (const selector of overlaySelectors) {
      try {
        const overlays = this.page.locator(selector)
        const count = await overlays.count()

        if (count > 0) {
          // Wait for all matching overlays to be hidden
          for (let i = 0; i < count; i++) {
            await overlays
              .nth(i)
              .waitFor({ state: 'hidden', timeout: 5000 })
              .catch(() => {})
          }
        }
      } catch {
        // Overlay not present, continue
      }
    }

    // For mobile, dismiss any sticky elements that might interfere
    if (isMobile) {
      // Try to scroll page to clear any sticky headers
      await this.page.evaluate(() => window.scrollTo(0, 100))
      await this.page.waitForTimeout(300)
      await this.page.evaluate(() => window.scrollTo(0, 0))
      await this.page.waitForTimeout(300)
    }

    // Also ensure navigation is not being intercepted
    const nav = this.page.locator('nav').first()
    try {
      // Wait for navigation to be stable
      await nav.waitFor({ state: 'visible', timeout: 2000 })
      await this.page.waitForTimeout(300)
    } catch {
      // Navigation might not be visible on some pages
    }
  }

  // Check if user is authenticated (looks for user button or auth state)
  async isAuthenticated(): Promise<boolean> {
    try {
      // Look for user button or any indicator that user is logged in
      const userButton = this.page.locator('[data-testid="user-button"]')
      return await userButton.isVisible({ timeout: 1000 })
    } catch {
      return false
    }
  }

  // Check if authentication is required (looks for sign in buttons in main content)
  async requiresAuthentication(): Promise<boolean> {
    try {
      const authMessages = [
        'you need to be logged in',
        'please sign in',
        'sign in required',
        'authentication required',
      ]

      for (const message of authMessages) {
        const hasMessage = await this.page
          .getByText(message, { exact: false })
          .isVisible({ timeout: 1000 })
        if (hasMessage) return true
      }

      // Check for sign in button in main content (not navigation)
      const mainSignIn = this.page
        .locator('main')
        .getByRole('button', { name: /sign in/i })
      return await mainSignIn.isVisible({ timeout: 1000 })
    } catch {
      return false
    }
  }
}
