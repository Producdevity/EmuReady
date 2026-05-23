import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class GameFormPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  get pageHeading() {
    return this.page.getByRole('heading', { name: /add new game/i })
  }

  get titleInput() {
    return this.page.getByPlaceholder(/enter game title/i).first()
  }

  get systemSelect() {
    return this.page.getByRole('combobox', { name: /system/i }).first()
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /add game to database/i })
  }

  get errorMessages() {
    return this.page.locator('.error, [role="alert"], .text-red-500')
  }

  get form() {
    return this.page.locator('form')
  }

  async goto() {
    await this.page.goto('/games/new')
    await this.waitForPageLoad()
  }

  async submitForm() {
    await this.submitButton.click()
  }
}
