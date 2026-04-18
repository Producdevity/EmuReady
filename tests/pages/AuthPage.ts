import { expect } from '@playwright/test'
import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  get userButton() {
    // Clerk's UserButton renders with aria-label "Open user menu"
    return this.page.getByRole('button', { name: /open user menu/i })
  }

  async verifyUserNotAuthenticated() {
    await expect(this.signInButton.or(this.page.getByText(/sign in/i).first())).toBeVisible()
  }

  async verifyAuthRequired() {
    // The app may either show an auth required message or redirect to a
    // non-protected page. Both are valid signs of auth enforcement.
    // Asserting the sign in button is visible means the user is not logged in.
    await expect(this.signInButton).toBeVisible()
  }
}
