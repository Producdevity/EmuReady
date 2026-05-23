import { expect, type Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  get userButton() {
    return this.page.getByRole('button', { name: /open user menu/i })
  }

  async verifyUserNotAuthenticated() {
    await expect(this.signInButton.or(this.page.getByText(/sign in/i).first())).toBeVisible()
  }

  async verifyAuthRequired() {
    await expect(this.signInButton).toBeVisible()
  }
}
