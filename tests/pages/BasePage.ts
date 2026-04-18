import { expect } from '@playwright/test'
import { waitForPageStability } from '../helpers/test-config'
import type { Page } from '@playwright/test'

const COOKIE_CONSENT_SCRIPT = () => {
  const PREFIX = '@StagingEmuReady_'
  localStorage.setItem(`${PREFIX}cookie_consent`, 'true')
  localStorage.setItem(
    `${PREFIX}cookie_preferences`,
    JSON.stringify({
      necessary: true,
      analytics: false,
      performance: false,
    }),
  )
  localStorage.setItem(`${PREFIX}cookie_consent_date`, new Date().toISOString())
  localStorage.setItem(`${PREFIX}analytics_enabled`, 'false')
  localStorage.setItem(`${PREFIX}performance_enabled`, 'false')
}

export abstract class BasePage {
  readonly page: Page

  protected constructor(page: Page) {
    this.page = page
    page.context().addInitScript(COOKIE_CONSENT_SCRIPT)
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

  get signInButton() {
    return this.page.getByRole('button', { name: /sign in/i }).first()
  }

  get signUpButton() {
    return this.page.getByRole('button', { name: /sign up/i }).first()
  }

  get mobileMenuButton() {
    return this.page.getByRole('button', { name: /open main menu/i })
  }

  get mobileMenu() {
    return this.page
      .locator('.md\\:hidden')
      .filter({ has: this.page.locator('a[href="/"]') })
      .last()
  }

  async navigateToHome() {
    await this.page.goto('/')
    await expect(this.page).toHaveURL('/')
  }

  async navigateToHandheld() {
    await this.page.goto('/listings')
    await expect(this.page).toHaveURL('/listings')
  }

  async navigateToPC() {
    await this.page.goto('/pc-listings')
    await expect(this.page).toHaveURL('/pc-listings')
  }

  async navigateToGames() {
    await this.page.goto('/games')
    await expect(this.page).toHaveURL(/\/games/)
  }

  async clickLogo() {
    await this.logo.click()
    await expect(this.page).toHaveURL('/')
  }

  async openMobileMenu() {
    await this.mobileMenuButton.click()
    await expect(this.mobileMenu).toBeVisible()
  }

  async waitForPageLoad() {
    await waitForPageStability(this.page)
  }

  async waitForOverlaysToDisappear() {
    const clerkModal = this.page.locator('.cl-modal, .cl-modalContent')
    const count = await clerkModal.count()
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(clerkModal.nth(i)).toBeHidden()
      }
    }
  }
}
