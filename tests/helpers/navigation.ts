import type { Page } from '@playwright/test'

export class NavigationHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a page with better error handling
   */
  async navigateTo(
    path: string,
    options: { timeout?: number; waitForLoad?: boolean } = {},
  ) {
    const { timeout = 10000, waitForLoad = true } = options

    try {
      if (waitForLoad) {
        await this.page.goto(path, { waitUntil: 'load', timeout })
      } else {
        await this.page.goto(path, { timeout })
      }
    } catch (error) {
      throw new Error(`Failed to navigate to ${path}: ${error}`)
    }
  }

  /**
   * Click navigation link with better error handling
   */
  async clickNavLink(
    linkText: string,
    options: { mobile?: boolean; timeout?: number } = {},
  ) {
    const { mobile = false, timeout = 10000 } = options

    // Wait for navigation to be ready
    await this.page.waitForLoadState('domcontentloaded')

    try {
      const linkSelector = mobile
        ? `a:has-text("${linkText}"):nth-of-type(2)` // Mobile menu version
        : `a:has-text("${linkText}"):nth-of-type(1)` // Desktop version

      const link = this.page.locator(linkSelector)

      if (!(await link.isVisible({ timeout: 5000 }))) {
        throw new Error(
          `Navigation link "${linkText}" not found (mobile: ${mobile}). Available links: ${await this.getAvailableLinks()}`,
        )
      }

      await link.click({ timeout })
    } catch (error) {
      throw new Error(`Failed to click navigation link "${linkText}": ${error}`)
    }
  }

  /**
   * Wait for URL to change with better error handling
   */
  async waitForURLChange(
    expectedPath: string,
    options: { timeout?: number; exact?: boolean } = {},
  ) {
    const { timeout = 10000, exact = true } = options

    try {
      if (exact) {
        await this.page.waitForURL(expectedPath, { timeout })
      } else {
        await this.page.waitForURL(new RegExp(expectedPath), { timeout })
      }
    } catch {
      const currentURL = this.page.url()
      throw new Error(
        `URL did not change to "${expectedPath}" within ${timeout}ms. Current URL: ${currentURL}`,
      )
    }
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu() {
    const menuButton = this.page.getByRole('button', { name: /menu/i })

    if (!(await menuButton.isVisible({ timeout: 5000 }))) {
      throw new Error('Mobile menu button not found')
    }

    await menuButton.click()

    // Wait for menu to open
    await this.page.waitForTimeout(500)
  }

  /**
   * Close mobile menu by clicking outside
   */
  async closeMobileMenu() {
    try {
      // Try multiple approaches to close the mobile menu

      // Approach 1: Try clicking the hamburger menu button again to toggle it closed
      const menuButton = this.page.getByRole('button', { name: /menu/i })
      if ((await menuButton.count()) > 0) {
        const isExpanded = await menuButton.getAttribute('aria-expanded')
        if (isExpanded === 'true') {
          await menuButton.click()
          await this.page.waitForTimeout(500)
          return
        }
      }

      // Approach 2: Try pressing Escape key
      await this.page.keyboard.press('Escape')
      await this.page.waitForTimeout(300)

      // Approach 3: Try clicking on overlay/backdrop
      const overlaySelectors = [
        '.menu-overlay',
        '.mobile-overlay',
        '.backdrop',
        '[data-overlay]',
      ]
      for (const selector of overlaySelectors) {
        const overlay = this.page.locator(selector)
        if (
          (await overlay.count()) > 0 &&
          (await overlay.first().isVisible({ timeout: 300 }))
        ) {
          await overlay.first().click()
          await this.page.waitForTimeout(300)
          return
        }
      }

      // Approach 4: Try clicking outside the navigation area (on body)
      await this.page
        .locator('body')
        .click({ position: { x: 50, y: 200 }, force: true })
      await this.page.waitForTimeout(300)
    } catch (error) {
      console.log('Error closing mobile menu:', error)
      // Fallback: wait and hope menu closes automatically
      await this.page.waitForTimeout(1000)
    }
  }

  /**
   * Check if mobile menu is open
   */
  async isMobileMenuOpen(): Promise<boolean> {
    try {
      // Wait for potential animations to complete
      await this.page.waitForTimeout(300)

      // Try multiple approaches to detect if mobile menu is open

      // Approach 1: Check hamburger button state first (most reliable)
      const menuButton = this.page.getByRole('button', { name: /menu/i })
      if ((await menuButton.count()) > 0) {
        const menuAria = (await menuButton.getAttribute('aria-expanded')) ?? ''
        if (menuAria === 'true') {
          console.log('Mobile menu detected: aria-expanded=true')
          return true
        }

        const menuClasses = (await menuButton.getAttribute('class')) ?? ''
        if (
          menuClasses.includes('active') ||
          menuClasses.includes('open') ||
          menuClasses.includes('expanded')
        ) {
          console.log('Mobile menu detected: button has active class')
          return true
        }
      }

      // Approach 2: Look for multiple instances of navigation links (mobile + desktop)
      try {
        const navigationLinks = await this.page
          .locator('a[href="/"], a[href="/games"], a[href="/listings"]')
          .all()
        const visibleCount = await Promise.all(
          navigationLinks.map((link) =>
            link.isVisible({ timeout: 500 }).catch(() => false),
          ),
        ).then((results) => results.filter(Boolean).length)

        if (visibleCount > 3) {
          // More than one set of navigation visible
          console.log('Mobile menu detected: multiple navigation sets visible')
          return true
        }
      } catch {
        // Continue to next check
      }

      // Approach 3: Look for mobile-specific navigation elements
      const mobileNavSelectors = [
        'nav[data-mobile="true"]',
        '[data-testid*="mobile"]',
        '.mobile-menu',
        '.mobile-nav',
        '.mobile-navigation',
        'nav.md\\:hidden',
      ]

      for (const selector of mobileNavSelectors) {
        try {
          const element = this.page.locator(selector)
          const count = await element.count()
          if (count > 0) {
            const isVisible = await element.first().isVisible({ timeout: 500 })
            if (isVisible) {
              console.log(`Mobile menu detected: ${selector} is visible`)
              return true
            }
          }
        } catch {
          // Continue to next selector
        }
      }

      // Approach 4: Check for body/html classes that indicate menu state
      try {
        const bodyClasses =
          (await this.page.locator('body').getAttribute('class')) ?? ''
        const htmlClasses =
          (await this.page.locator('html').getAttribute('class')) ?? ''

        const openIndicators = [
          'menu-open',
          'mobile-menu-open',
          'nav-open',
          'navigation-open',
        ]
        for (const indicator of openIndicators) {
          if (
            bodyClasses.includes(indicator) ||
            htmlClasses.includes(indicator)
          ) {
            console.log(`Mobile menu detected: ${indicator} class found`)
            return true
          }
        }
      } catch {
        // Continue to next check
      }

      // Approach 5: Check for overlay/backdrop elements
      const overlaySelectors = [
        '.menu-overlay',
        '.mobile-overlay',
        '.backdrop',
        '[data-overlay]',
      ]

      for (const selector of overlaySelectors) {
        try {
          const overlay = this.page.locator(selector)
          if ((await overlay.count()) > 0) {
            const isVisible = await overlay.first().isVisible({ timeout: 500 })
            if (isVisible) {
              console.log(
                `Mobile menu detected: ${selector} overlay is visible`,
              )
              return true
            }
          }
        } catch {
          // Continue to next selector
        }
      }

      // Approach 6: Look for mobile-only visible navigation items
      try {
        // Check if there are navigation items that are normally hidden but now visible
        const hiddenNavItems = this.page
          .locator('nav a, nav button')
          .filter({ hasText: /home|games|listings|profile/i })
        const itemCount = await hiddenNavItems.count()

        if (itemCount > 4) {
          // More nav items than usual (indicates mobile menu open)
          console.log('Mobile menu detected: extra navigation items visible')
          return true
        }
      } catch {
        // Continue
      }

      // Approach 7: Check for specific Tailwind mobile classes
      try {
        const mobileVisibleElements = this.page.locator(
          '.block.md\\:hidden, .flex.md\\:hidden',
        )
        const elementCount = await mobileVisibleElements.count()

        if (elementCount > 0) {
          for (let i = 0; i < Math.min(elementCount, 3); i++) {
            const element = mobileVisibleElements.nth(i)
            const isVisible = await element
              .isVisible({ timeout: 300 })
              .catch(() => false)
            if (isVisible) {
              // Check if this element contains navigation
              const hasNavigation =
                (await element.locator('a[href], button').count()) > 0
              if (hasNavigation) {
                console.log(
                  'Mobile menu detected: mobile-visible navigation found',
                )
                return true
              }
            }
          }
        }
      } catch {
        // Final approach failed
      }

      console.log('Mobile menu state: CLOSED (no open indicators found)')
      return false
    } catch (error) {
      console.log('Error checking mobile menu state:', error)
      return false
    }
  }

  /**
   * Helper to debug available links
   */
  private async getAvailableLinks(): Promise<string> {
    const links = await this.page.locator('a').all()
    const linkTexts = await Promise.all(
      links.map(async (link) => {
        try {
          const text = await link.textContent()
          const href = await link.getAttribute('href')
          const visible = await link.isVisible()
          return `"${text}" (href: ${href}, visible: ${visible})`
        } catch {
          return 'error reading link'
        }
      }),
    )
    return linkTexts.join(', ')
  }

  /**
   * Navigate using Next.js Link component
   */
  async navigateWithLink(
    linkText: string,
    expectedPath: string,
    options: { mobile?: boolean } = {},
  ) {
    await this.clickNavLink(linkText, options)
    await this.waitForURLChange(expectedPath)
  }

  /**
   * Set viewport size for responsive testing
   */
  async setViewport(size: 'mobile' | 'tablet' | 'desktop') {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1200, height: 800 },
    }

    await this.page.setViewportSize(viewports[size])
  }
}
