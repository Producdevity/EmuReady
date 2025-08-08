import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class GameFormPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Form elements
  get pageHeading() {
    return this.page.getByRole('heading', { name: /add new game/i })
  }

  get titleInput() {
    return this.page.getByLabel(/game title|title/i)
  }

  get systemSelect() {
    return this.page.getByLabel(/system/i).first()
  }

  get descriptionTextarea() {
    return this.page.getByLabel(/description/i)
  }

  get yearInput() {
    return this.page.getByLabel(/year|release year/i)
  }

  get developerInput() {
    return this.page.getByLabel(/developer/i)
  }

  get publisherInput() {
    return this.page.getByLabel(/publisher/i)
  }

  get genreInput() {
    return this.page.getByLabel(/genre/i)
  }

  get submitButton() {
    return this.page.getByRole('button', {
      name: /submit|add game|create|save/i,
    })
  }

  get cancelButton() {
    return this.page.getByRole('button', { name: /cancel/i })
  }

  get errorMessages() {
    return this.page.locator('.error, [role="alert"], .text-red-500')
  }

  get successMessage() {
    return this.page.getByText(/successfully|added|created/i)
  }

  get form() {
    return this.page.locator('form')
  }

  // Image selection elements
  get imageSelectionArea() {
    return this.page.locator('input[type="file"], [data-testid="image-selector"]')
  }

  get selectedImage() {
    return this.page.locator('img[alt*="cover"], img[alt*="game"], .selected-image')
  }

  // Actions
  async goto() {
    await this.page.goto('/games/new')
    await this.waitForPageLoad()
  }

  async fillGameTitle(title: string) {
    await this.titleInput.fill(title)
  }

  async selectSystem(systemName: string) {
    await this.systemSelect.click()
    await this.page.getByRole('option', { name: systemName }).click()
  }

  async selectSystemByIndex(index: number) {
    await this.systemSelect.selectOption({ index })
  }

  async fillDescription(description: string) {
    await this.descriptionTextarea.fill(description)
  }

  async fillYear(year: string) {
    await this.yearInput.fill(year)
  }

  async fillDeveloper(developer: string) {
    await this.developerInput.fill(developer)
  }

  async fillPublisher(publisher: string) {
    await this.publisherInput.fill(publisher)
  }

  async fillGenre(genre: string) {
    await this.genreInput.fill(genre)
  }

  async submitForm() {
    await this.submitButton.click()
  }

  async cancelForm() {
    await this.cancelButton.click()
  }

  async fillRequiredFields(title: string, systemIndex: number = 1) {
    await this.fillGameTitle(title)
    await this.selectSystemByIndex(systemIndex)
  }

  async fillCompleteForm(gameData: {
    title: string
    system?: string
    description?: string
    year?: string
    developer?: string
    publisher?: string
    genre?: string
  }) {
    await this.fillGameTitle(gameData.title)

    if (gameData.system) {
      await this.selectSystem(gameData.system)
    } else {
      await this.selectSystemByIndex(1)
    }

    if (gameData.description) {
      await this.fillDescription(gameData.description)
    }

    if (gameData.year) {
      await this.fillYear(gameData.year)
    }

    if (gameData.developer) {
      await this.fillDeveloper(gameData.developer)
    }

    if (gameData.publisher) {
      await this.fillPublisher(gameData.publisher)
    }

    if (gameData.genre) {
      await this.fillGenre(gameData.genre)
    }
  }

  async isFormVisible(): Promise<boolean> {
    try {
      return await this.form.isVisible({ timeout: 2000 })
    } catch {
      return false
    }
  }

  // Verification methods
  async verifyFormVisible() {
    await this.form.waitFor({ state: 'visible' })
    await this.titleInput.waitFor({ state: 'visible' })
    await this.systemSelect.waitFor({ state: 'visible' })
  }

  async verifyValidationError(expectedError?: string) {
    await this.errorMessages.first().waitFor({ state: 'visible' })

    if (expectedError) {
      const errorText = await this.errorMessages.first().textContent()
      if (!errorText?.toLowerCase().includes(expectedError.toLowerCase())) {
        throw new Error(`Expected error containing "${expectedError}" but got "${errorText}"`)
      }
    }
  }

  async verifySuccessMessage() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 10000 })
  }

  async verifyRedirectAfterSuccess() {
    // Should redirect to game detail page or games list
    await this.page.waitForURL(/\/games\/((?!new).)*/, { timeout: 10000 })
  }

  async hasValidationErrors(): Promise<boolean> {
    try {
      await this.errorMessages.first().waitFor({ state: 'visible', timeout: 2000 })
      return true
    } catch {
      return false
    }
  }
}
