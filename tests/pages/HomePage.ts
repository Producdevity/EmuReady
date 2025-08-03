import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Page-specific elements
  get heroHeading() {
    return this.page.getByRole('heading', { name: /know before you load/i })
  }

  get trustedReportsSection() {
    return this.page.getByRole('heading', { name: /trusted reports/i })
  }

  get performanceMetricsSection() {
    return this.page.getByRole('heading', { name: /performance metrics/i })
  }

  get communityDrivenSection() {
    return this.page.getByRole('heading', { name: /community driven/i })
  }

  get latestListingsSection() {
    return this.page.getByRole('heading', {
      name: /latest compatibility listings/i,
    })
  }

  get joinCommunityButton() {
    return this.page.getByRole('button', { name: /join the community/i })
  }

  get createAccountButton() {
    return this.page.getByRole('button', { name: /create an account/i })
  }

  get browseReportsLink() {
    return this.page.getByRole('link', {
      name: /browse compatibility reports/i,
    })
  }

  // Actions specific to home page
  async goto() {
    await this.page.goto('/')
    await this.waitForPageLoad()
    // Extra check for cookie banner on home page
    await this.cookieBanner.dismissIfPresent()
  }

  async clickJoinCommunity() {
    await this.joinCommunityButton.click()
  }

  async clickCreateAccount() {
    await this.createAccountButton.click()
  }

  async clickBrowseReports() {
    await this.browseReportsLink.click()
    await this.page.waitForURL('/listings')
  }

  // Verification methods
  async verifyHeroSectionVisible() {
    await this.heroHeading.waitFor({ state: 'visible' })
    await this.trustedReportsSection.waitFor({ state: 'visible' })
    await this.performanceMetricsSection.waitFor({ state: 'visible' })
    await this.communityDrivenSection.waitFor({ state: 'visible' })
  }

  async verifyLatestListingsVisible() {
    await this.latestListingsSection.waitFor({ state: 'visible' })
  }

  async verifyNavigationVisible() {
    await this.homeLink.waitFor({ state: 'visible' })
    await this.handheldLink.waitFor({ state: 'visible' })
    await this.pcLink.waitFor({ state: 'visible' })
    await this.gamesLink.waitFor({ state: 'visible' })
  }

  async verifyAuthButtonsVisible() {
    await this.signInButton.waitFor({ state: 'visible' })
    await this.signUpButton.waitFor({ state: 'visible' })
  }
}
