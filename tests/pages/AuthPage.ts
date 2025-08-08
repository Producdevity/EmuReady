import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Clerk authentication elements
  get clerkSignInModal() {
    return this.page.locator('.cl-modal, .cl-modalContent, .cl-component, .cl-signIn-root')
  }

  get clerkSignUpModal() {
    return this.page.locator('.cl-modal, .cl-modalContent, .cl-component, .cl-signUp-root')
  }

  get emailInput() {
    return this.page.getByLabel(/email/i).or(this.page.getByPlaceholder(/email/i))
  }

  get passwordInput() {
    return this.page.getByLabel(/password/i).or(this.page.getByPlaceholder(/password/i))
  }

  get continueButton() {
    return this.page.getByRole('button', { name: /continue/i })
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /sign in|sign up|submit/i })
  }

  get userButton() {
    return this.page.locator('[data-testid="user-button"]')
  }

  get userMenu() {
    return this.page.locator('[data-testid="user-menu"], .cl-userButtonPopover')
  }

  get signOutButton() {
    return this.page.getByRole('button', { name: /sign out/i })
  }

  // Protected route elements
  get authRequiredMessage() {
    return this.page.getByText(/you need to be logged in|please sign in|sign in required/i)
  }

  get protectedContent() {
    return this.page.locator('main').getByRole('button', { name: /sign in/i })
  }

  // Actions
  async openSignInModal() {
    await this.signInButton.click()
    await this.waitForSignInModal()
  }

  async openSignUpModal() {
    await this.signUpButton.click()
    await this.waitForSignUpModal()
  }

  async waitForSignInModal() {
    await this.clerkSignInModal.waitFor({ state: 'visible', timeout: 10000 })
  }

  async waitForSignUpModal() {
    await this.clerkSignUpModal.waitFor({ state: 'visible', timeout: 10000 })
  }

  async fillSignInForm(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submitSignIn() {
    await this.submitButton.click()
  }

  async signIn(email: string, password: string) {
    await this.openSignInModal()
    await this.fillSignInForm(email, password)
    await this.submitSignIn()
    // Wait for authentication to complete
    await this.page.waitForTimeout(2000)
  }

  async openUserMenu() {
    await this.userButton.click()
    await this.userMenu.waitFor({ state: 'visible', timeout: 5000 })
  }

  async signOut() {
    await this.openUserMenu()
    await this.signOutButton.click()
    // Wait for sign out to complete
    await this.page.waitForTimeout(2000)
  }

  // Verification methods
  async verifySignInModalVisible() {
    await this.clerkSignInModal.waitFor({ state: 'visible' })
    await this.emailInput.waitFor({ state: 'visible' })
  }

  async verifySignUpModalVisible() {
    await this.clerkSignUpModal.waitFor({ state: 'visible' })
    await this.emailInput.waitFor({ state: 'visible' })
  }

  async verifyUserAuthenticated() {
    await this.userButton.waitFor({ state: 'visible' })
    // Auth buttons should not be visible when authenticated
    await this.signInButton.waitFor({ state: 'hidden' })
    await this.signUpButton.waitFor({ state: 'hidden' })
  }

  async verifyUserNotAuthenticated() {
    // Wait for page to stabilize first
    await this.page.waitForLoadState('networkidle', { timeout: 10000 })

    // Try multiple selectors for sign in button
    const signInVisible = await this.signInButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (!signInVisible) {
      // Try alternative selectors for webkit
      const altSignIn = this.page.getByText(/sign in/i).first()
      const altVisible = await altSignIn.isVisible({ timeout: 2000 }).catch(() => false)

      if (!altVisible) {
        throw new Error('Sign in button not found with any selector')
      }
    }

    await this.signUpButton.waitFor({ state: 'visible', timeout: 5000 })

    // User button should not be visible when not authenticated
    const userButtonVisible = await this.userButton.isVisible({ timeout: 1000 })
    if (userButtonVisible) {
      throw new Error('User button is visible when user should not be authenticated')
    }
  }

  async verifyAuthRequired() {
    try {
      await this.authRequiredMessage.waitFor({
        state: 'visible',
        timeout: 3000,
      })
    } catch {
      try {
        // Check for sign in button in main content
        await this.protectedContent.waitFor({ state: 'visible', timeout: 3000 })
      } catch {
        // Check if we got redirected
        const currentUrl = this.page.url()
        if (!currentUrl.includes('/games/new') && !currentUrl.includes('/listings/new')) {
          console.log('Page redirected - likely requires authentication')
          return
        }
        throw new Error('No authentication requirement indicators found')
      }
    }
  }

  async hasAuthRequirement(): Promise<boolean> {
    try {
      // Check if auth required message is visible
      const hasAuthMessage = await this.authRequiredMessage.isVisible({
        timeout: 2000,
      })
      if (hasAuthMessage) return true

      // Check if sign in button is in main content (not navigation)
      const hasProtectedContent = await this.protectedContent.isVisible({
        timeout: 2000,
      })
      if (hasProtectedContent) return true

      // Check if page shows authentication related content
      const pageText = await this.page.textContent('body')
      const authKeywords = ['sign in', 'log in', 'authentication required', 'please sign in']
      return authKeywords.some((keyword) => pageText?.toLowerCase().includes(keyword))
    } catch {
      return false
    }
  }

  async verifyCanAccessProtectedContent() {
    // Should not see auth required messages
    const hasAuthMessage = await this.authRequiredMessage.isVisible({
      timeout: 2000,
    })
    if (hasAuthMessage) {
      throw new Error('Authentication required message visible when user should be authenticated')
    }
  }
}
