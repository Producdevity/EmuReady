import type { Page } from '@playwright/test'

export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for Clerk to initialize and authentication buttons to be available
   */
  async waitForAuthComponents(timeout = 8000) {
    try {
      // Check if page is still available (prevents Webkit crashes)
      await this.page
        .evaluate(() => document.readyState)
        .catch(() => {
          throw new Error('Page unavailable - browser may have crashed')
        })

      // Wait for either sign-in buttons or user button to appear
      await this.page.waitForFunction(
        () => {
          // Look for buttons containing "Sign In" or "Sign Up" text
          const buttons = Array.from(document.querySelectorAll('button'))
          const signInButtons = buttons.filter((btn) =>
            btn.textContent?.toLowerCase().includes('sign in'),
          )
          const signUpButtons = buttons.filter((btn) =>
            btn.textContent?.toLowerCase().includes('sign up'),
          )
          const userButton = document.querySelector(
            '[data-testid="user-button"]',
          )

          return (
            signInButtons.length > 0 || signUpButtons.length > 0 || userButton
          )
        },
        { timeout },
      )
    } catch (error: unknown) {
      // Check if it's a browser crash
      if (
        error instanceof Error &&
        error.message.includes(
          'Target page, context or browser has been closed',
        )
      ) {
        throw new Error('Browser crashed during auth component wait')
      }

      // If Clerk components don't load, check if basic auth elements are available
      try {
        const hasBasicAuth =
          (await this.page
            .locator('button')
            .filter({ hasText: /sign in|sign up/i })
            .count()) > 0
        if (!hasBasicAuth) {
          throw new Error(
            `Authentication components not found within ${timeout}ms. Clerk may not be properly initialized.`,
          )
        }
      } catch (basicError: unknown) {
        if (
          basicError instanceof Error &&
          basicError.message.includes(
            'Target page, context or browser has been closed',
          )
        ) {
          throw new Error('Browser crashed during basic auth check')
        }
        throw basicError
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Look for user button which indicates authentication
      const userButton = this.page.locator('[data-testid="user-button"]')
      return await userButton.isVisible({ timeout: 2000 })
    } catch {
      return false
    }
  }

  /**
   * Get sign in button with better error handling
   */
  async getSignInButton(mobile = false) {
    try {
      await this.waitForAuthComponents()
    } catch {
      // Continue without strict auth component wait
    }

    // Try multiple approaches to find the sign-in button
    const selectors = [
      'button:has-text("Sign In")',
      'button[data-testid="sign-in"]',
      '[data-clerk-element="signInButton"]',
      'a:has-text("Sign In")',
    ]

    for (const selector of selectors) {
      const button = this.page.locator(selector).first()
      if (
        (await button.count()) > 0 &&
        (await button.isVisible({ timeout: 1000 }).catch(() => false))
      ) {
        return button
      }
    }

    // Fallback: use role-based selector
    const button = this.page.getByRole('button', { name: /sign in/i }).first()
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      return button
    }

    throw new Error(
      `Sign In button not found (mobile: ${mobile}). Available buttons: ${await this.getAvailableButtons()}`,
    )
  }

  /**
   * Get sign up button with better error handling
   */
  async getSignUpButton(mobile = false) {
    try {
      await this.waitForAuthComponents()
    } catch {
      // Continue without strict auth component wait
    }

    // Try multiple approaches to find the sign up button
    const selectors = [
      'button:has-text("Sign Up")',
      'button[data-testid="sign-up"]',
      '[data-clerk-element="signUpButton"]',
      'a:has-text("Sign Up")',
    ]

    for (const selector of selectors) {
      const button = this.page.locator(selector).first()
      if (
        (await button.count()) > 0 &&
        (await button.isVisible({ timeout: 1000 }).catch(() => false))
      ) {
        return button
      }
    }

    // Fallback: use role-based selector
    const button = this.page.getByRole('button', { name: /sign up/i }).first()
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      return button
    }

    throw new Error(
      `Sign Up button not found (mobile: ${mobile}). Available buttons: ${await this.getAvailableButtons()}`,
    )
  }

  /**
   * Click sign in button with better error handling for mobile menu interference
   */
  async clickSignInButton(mobile = false) {
    const button = await this.getSignInButton(mobile)

    try {
      // Try normal click first
      await button.click({ timeout: 5000 })
    } catch (error) {
      console.log('Normal click failed, trying force click:', error)
      try {
        // Force click if normal click fails (handles overlapping elements)
        await button.click({ force: true, timeout: 3000 })
      } catch (forceError) {
        console.log('Force click failed, trying JavaScript click:', forceError)
        // Last resort: JavaScript click
        await button.evaluate((el) => (el as HTMLElement).click())
      }
    }
  }

  /**
   * Helper to debug available buttons
   */
  private async getAvailableButtons(): Promise<string> {
    const buttons = await this.page.locator('button').all()
    const buttonTexts = await Promise.all(
      buttons.map(async (button) => {
        try {
          const text = await button.textContent()
          const visible = await button.isVisible()
          return `"${text}" (visible: ${visible})`
        } catch {
          return 'error reading button'
        }
      }),
    )
    return buttonTexts.join(', ')
  }

  /**
   * Wait for Clerk modal to appear
   */
  async waitForClerkModal(
    type: 'sign-in' | 'sign-up' = 'sign-in',
    timeout = 10000,
  ) {
    const modalSelectors = [
      '.cl-modal',
      '.cl-modalContent',
      `[data-testid="${type}-modal"]`,
      '.cl-component',
      '.cl-signIn-root',
      '.cl-signUp-root',
    ]

    try {
      await this.page.waitForSelector(modalSelectors.join(', '), {
        timeout,
        state: 'visible',
      })
    } catch {
      throw new Error(
        `Clerk ${type} modal not found within ${timeout}ms. Modal selectors tried: ${modalSelectors.join(', ')}`,
      )
    }
  }

  /**
   * Check for authentication requirement messages
   */
  async hasAuthRequirement(): Promise<boolean> {
    const authMessages = [
      'please sign in to view your profile',
      'you need to be logged in to access this page',
      'you need to be logged in to add games',
      'you need to be logged in to create listings',
      'you need to be logged in',
      'please sign in',
      'sign in required',
      'authentication required',
    ]

    // First check for explicit authentication messages
    for (const message of authMessages) {
      try {
        const hasMessage = await this.page
          .getByText(message, { exact: false })
          .isVisible({ timeout: 2000 })
        if (hasMessage) return true
      } catch {
        // Continue checking other messages
      }
    }

    // Check for Clerk SignInButton components
    const clerkSignInButtons = [
      'button[data-clerk-element="signInButton"]',
      '.cl-signInButton',
      '[data-testid="sign-in-button"]',
    ]

    for (const selector of clerkSignInButtons) {
      try {
        const isVisible = await this.page
          .locator(selector)
          .isVisible({ timeout: 1000 })
        if (isVisible) return true
      } catch {
        // Continue to next selector
      }
    }

    // Check for main content area sign in button (indicates auth requirement)
    try {
      const mainSignInButton = this.page
        .locator('main')
        .getByRole('button', { name: /sign in/i })
      const isVisible = await mainSignInButton.isVisible({ timeout: 2000 })
      if (isVisible) return true
    } catch {
      // Continue to final check
    }

    // Check if the page shows a form (which indicates the page is accessible without auth)
    // If there's a form on the page, it means no authentication is required
    try {
      const hasForm = await this.page
        .locator('form')
        .isVisible({ timeout: 1000 })
      if (hasForm) {
        // Page has a form, so it's accessible without auth
        return false
      }
    } catch {
      // Continue to final check
    }

    // Check if main element is empty (which might indicate authentication issues)
    try {
      const mainElement = this.page.locator('main')
      const mainText = await mainElement.textContent({ timeout: 1000 })
      if (!mainText || mainText.trim().length === 0) {
        // Empty main suggests authentication protection that isn't displaying properly
        return false
      }
    } catch {
      // Continue to final check
    }

    // Final check for any sign-in button on the page
    try {
      return await this.page
        .getByRole('button', { name: /sign in/i })
        .isVisible({ timeout: 1000 })
    } catch {
      return false
    }
  }
}
