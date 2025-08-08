import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class ListingFormPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Form elements
  get pageHeading() {
    return this.page.getByRole('heading', {
      name: /create listing|add listing|new listing/i,
    })
  }

  get gameSelect() {
    return this.page.getByLabel(/game/i).first()
  }

  get deviceSelect() {
    return this.page.getByLabel(/device/i).first()
  }

  get emulatorSelect() {
    return this.page.getByLabel(/emulator/i).first()
  }

  get performanceSelect() {
    return this.page.getByLabel(/performance/i)
  }

  get performanceRating() {
    return this.page.locator('[data-testid="performance-rating"], .performance-rating')
  }

  get notesTextarea() {
    return this.page.getByLabel(/notes|comments|description/i)
  }

  get settingsTextarea() {
    return this.page.getByLabel(/settings|configuration/i)
  }

  get submitButton() {
    return this.page.getByRole('button', {
      name: /submit|create listing|add listing|save/i,
    })
  }

  get cancelButton() {
    return this.page.getByRole('button', { name: /cancel/i })
  }

  get errorMessages() {
    return this.page.locator('.error, [role="alert"], .text-red-500')
  }

  get successMessage() {
    return this.page.getByText(/successfully|created|added/i)
  }

  get form() {
    return this.page.locator('form')
  }

  // Custom fields section
  get customFieldsSection() {
    return this.page.locator('[data-testid="custom-fields"], .custom-fields, fieldset')
  }

  get customFieldInputs() {
    return this.customFieldsSection.locator('input, textarea, select')
  }

  // Actions
  async goto() {
    await this.page.goto('/listings/new')
    await this.waitForPageLoad()
  }

  async selectGame(gameName: string) {
    await this.gameSelect.click()
    await this.page.getByRole('option', { name: gameName }).click()
  }

  async selectGameByIndex(index: number) {
    await this.gameSelect.selectOption({ index })
  }

  async selectDevice(deviceName: string) {
    await this.deviceSelect.click()
    await this.page.getByRole('option', { name: deviceName }).click()
  }

  async selectDeviceByIndex(index: number) {
    await this.deviceSelect.selectOption({ index })
  }

  async selectEmulator(emulatorName: string) {
    await this.emulatorSelect.click()
    await this.page.getByRole('option', { name: emulatorName }).click()
  }

  async selectEmulatorByIndex(index: number) {
    await this.emulatorSelect.selectOption({ index })
  }

  async selectPerformance(performance: string) {
    await this.performanceSelect.click()
    await this.page.getByRole('option', { name: performance }).click()
  }

  async selectPerformanceByIndex(index: number) {
    await this.performanceSelect.selectOption({ index })
  }

  async fillNotes(notes: string) {
    await this.notesTextarea.fill(notes)
  }

  async fillSettings(settings: string) {
    await this.settingsTextarea.fill(settings)
  }

  async submitForm() {
    await this.submitButton.click()
  }

  async cancelForm() {
    await this.cancelButton.click()
  }

  async fillRequiredFields(gameIndex: number = 1, deviceIndex: number = 1) {
    await this.selectGameByIndex(gameIndex)
    await this.selectDeviceByIndex(deviceIndex)
  }

  async fillCompleteForm(listingData: {
    game?: string
    device?: string
    emulator?: string
    performance?: string
    notes?: string
    settings?: string
  }) {
    if (listingData.game) {
      await this.selectGame(listingData.game)
    } else {
      await this.selectGameByIndex(1)
    }

    if (listingData.device) {
      await this.selectDevice(listingData.device)
    } else {
      await this.selectDeviceByIndex(1)
    }

    if (listingData.emulator) {
      await this.selectEmulator(listingData.emulator)
    }

    if (listingData.performance) {
      await this.selectPerformance(listingData.performance)
    }

    if (listingData.notes) {
      await this.fillNotes(listingData.notes)
    }

    if (listingData.settings) {
      await this.fillSettings(listingData.settings)
    }
  }

  async fillCustomField(fieldName: string, value: string) {
    const field = this.customFieldsSection.getByLabel(fieldName)
    await field.fill(value)
  }

  async selectCustomFieldOption(fieldName: string, optionName: string) {
    const field = this.customFieldsSection.getByLabel(fieldName)
    await field.click()
    await this.page.getByRole('option', { name: optionName }).click()
  }

  async toggleCustomFieldCheckbox(fieldName: string) {
    const checkbox = this.customFieldsSection.getByLabel(fieldName)
    await checkbox.check()
  }

  // Verification methods
  async verifyFormVisible() {
    await this.form.waitFor({ state: 'visible' })
    await this.gameSelect.waitFor({ state: 'visible' })
    await this.deviceSelect.waitFor({ state: 'visible' })
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
    // Should redirect to listing detail page or listings list
    await this.page.waitForURL(/\/listings\/((?!new).)*/, { timeout: 10000 })
  }

  async hasValidationErrors(): Promise<boolean> {
    try {
      await this.errorMessages.first().waitFor({ state: 'visible', timeout: 2000 })
      return true
    } catch {
      return false
    }
  }

  async verifyCustomFieldsVisible() {
    await this.customFieldsSection.waitFor({ state: 'visible' })
    const fieldCount = await this.customFieldInputs.count()
    if (fieldCount === 0) {
      throw new Error('No custom fields found')
    }
  }

  async getCustomFieldCount(): Promise<number> {
    try {
      await this.customFieldsSection.waitFor({
        state: 'visible',
        timeout: 2000,
      })
      return await this.customFieldInputs.count()
    } catch {
      return 0
    }
  }

  async isFormVisible(): Promise<boolean> {
    try {
      return await this.form.isVisible({ timeout: 2000 })
    } catch {
      return false
    }
  }
}
