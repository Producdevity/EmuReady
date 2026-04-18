import { expect } from '@playwright/test'
import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class GamesPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  get pageHeading() {
    return this.page.getByRole('heading', { name: /games library/i })
  }

  get searchInput() {
    return this.page.getByRole('textbox', { name: /search/i })
  }

  get addGameButton() {
    // On the /games library page, "Add Game" is an anchor link to /games/new.
    return this.page.getByRole('link', { name: /add game/i })
  }

  get gameItems() {
    return this.page
      .locator('main a[href*="/games/"]')
      .filter({ hasNotText: /games library|add game/i })
  }

  get noGamesMessage() {
    return this.page.getByText(/no games found/i)
  }

  async goto() {
    await this.page.goto('/games')
    await this.waitForPageLoad()
  }

  async searchGames(query: string) {
    await this.searchInput.fill(query)
    await expect(this.page).toHaveURL(/[?&]search=/)
  }

  async clickAddGame() {
    await this.addGameButton.click()
    await expect(this.page).toHaveURL('/games/new')
  }

  async clickFirstGame() {
    const firstGame = this.gameItems.first()
    await expect(firstGame).toBeVisible()
    await firstGame.click()
    await expect(this.page).toHaveURL(/\/games\/[^/]+/)
  }

  async verifyPageLoaded() {
    await expect(this.pageHeading).toBeVisible()
  }
}
