import { expect } from '@playwright/test'
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

  // Navbar search button (expands into search input, submits to /games?search=)
  get searchButton() {
    return this.page.getByRole('button', { name: /search games/i }).first()
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
    const isMobile = this.page.viewportSize()?.width ? this.page.viewportSize()!.width < 768 : false

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

        try {
          await this.homeLink.click({ timeout: 5000 })
        } catch {
          console.log('Regular click failed, using force click')
          await this.homeLink.click({ force: true })
        }
      }
    }

    // Use expect().toHaveURL which auto-retries without needing a 'load' event —
    // waitForURL hangs on client-side navigation (pushState) since no load fires
    await expect(this.page).toHaveURL('/', { timeout: 15000 })
  }

  async navigateToHandheld() {
    const isMobile = this.page.viewportSize()?.width ? this.page.viewportSize()!.width < 768 : false

    if (isMobile) {
      // On mobile, use mobile menu or direct navigation
      const mobileMenuVisible = await this.mobileMenuButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      if (mobileMenuVisible) {
        await this.mobileMenuButton.click()
        await this.mobileMenu.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
        const mobileHandheldLink = this.page.getByRole('link', { name: /handheld/i }).last()
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

        try {
          await this.handheldLink.click({ timeout: 5000 })
        } catch {
          console.log('Regular click failed, using force click')
          await this.handheldLink.click({ force: true })
        }
      }
    }

    await expect(this.page).toHaveURL('/listings', { timeout: 15000 })
  }

  async navigateToPC() {
    const isMobile = this.page.viewportSize()?.width ? this.page.viewportSize()!.width < 768 : false

    if (isMobile) {
      // On mobile, use mobile menu or direct navigation
      const mobileMenuVisible = await this.mobileMenuButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      if (mobileMenuVisible) {
        await this.mobileMenuButton.click()
        await this.mobileMenu.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
        const mobilePCLink = this.page.getByRole('link', { name: /^pc$/i }).last()
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

        try {
          await this.pcLink.click({ timeout: 5000 })
        } catch {
          console.log('Regular click failed, using force click')
          await this.pcLink.click({ force: true })
        }
      }
    }

    await expect(this.page).toHaveURL('/pc-listings', { timeout: 15000 })
  }

  async navigateToGames() {
    // No direct "Games" link in the navbar; the navbar has a search button
    // that navigates to /games?search=<query>. For clean navigation without
    // a search query, use direct goto.
    await this.page.goto('/games')

    await expect(this.page).toHaveURL(/\/games/, { timeout: 15000 })
  }

  async searchViaNavbar(query: string) {
    const isMobile = this.page.viewportSize()?.width ? this.page.viewportSize()!.width < 768 : false

    if (isMobile) {
      // Mobile uses a search icon that opens a full-screen overlay
      await this.searchButton.click()

      const searchInput = this.page.getByPlaceholder(/search games/i).last()
      await searchInput.waitFor({ state: 'visible', timeout: 3000 })
      await searchInput.fill(query)
      await searchInput.press('Enter')
    } else {
      // Desktop: click search button to expand, then type and submit
      await this.searchButton.click()

      const searchInput = this.page.getByPlaceholder(/search games/i).first()
      await searchInput.waitFor({ state: 'visible', timeout: 3000 })
      await searchInput.fill(query)
      await searchInput.press('Enter')
    }

    await expect(this.page).toHaveURL(/\/games\?search=/, { timeout: 15000 })
  }

  async clickLogo() {
    const isMobile = this.page.viewportSize()?.width ? this.page.viewportSize()!.width < 768 : false

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

    await expect(this.page).toHaveURL('/', { timeout: 10000 })
  }

  async openMobileMenu() {
    // Check if menu is already open
    const menuClass = (await this.mobileMenuButton.locator('..').getAttribute('class')) || ''
    const isOpen = menuClass.includes('opacity-100') || menuClass.includes('max-h-screen')

    if (!isOpen) {
      await this.mobileMenuButton.click()
      await this.mobileMenu.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
    }
  }

  async waitForPageLoad() {
    await waitForPageStability(this.page, TEST_CONFIG.timeouts.pageLoad)
    await this.cookieBanner.dismissIfPresent()
  }

  async waitForOverlaysToDisappear() {
    // Dismiss Clerk authentication modals if present
    const clerkModal = this.page.locator('.cl-modal, .cl-modalContent')
    const count = await clerkModal.count().catch(() => 0)

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await clerkModal
          .nth(i)
          .waitFor({ state: 'hidden', timeout: 3000 })
          .catch(() => {})
      }
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
      const mainSignIn = this.page.locator('main').getByRole('button', { name: /sign in/i })
      return await mainSignIn.isVisible({ timeout: 1000 })
    } catch {
      return false
    }
  }
}
