import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  get heroHeading() {
    return this.page.getByRole('heading', { name: /know before you load/i })
  }

  get latestReportsSection() {
    return this.page.getByRole('heading', { name: /latest compatibility reports/i })
  }

  async goto() {
    await this.page.goto('/')
    await this.waitForPageLoad()
  }

  async verifyHeroSectionVisible() {
    await this.heroHeading.waitFor({ state: 'visible' })
  }

  async verifyLatestListingsVisible() {
    await this.latestReportsSection.waitFor({ state: 'visible' })
  }

  async verifyNavigationVisible() {
    await this.homeLink.waitFor({ state: 'visible' })
    await this.handheldLink.waitFor({ state: 'visible' })
    await this.pcLink.waitFor({ state: 'visible' })
  }

  async verifyAuthButtonsVisible() {
    await this.signInButton.waitFor({ state: 'visible' })
    await this.signUpButton.waitFor({ state: 'visible' })
  }
}
