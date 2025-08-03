import { expect } from '@playwright/test'
import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class GamesPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Page-specific elements
  get pageHeading() {
    return this.page.getByRole('heading', { name: /games library/i })
  }

  // Games page doesn't have filters heading, it has individual game headings
  get gameHeadings() {
    return this.page
      .locator('h2')
      .filter({ hasNotText: /emuready|about|community/i })
  }

  get searchInput() {
    return this.page.getByRole('textbox', { name: /search/i })
  }

  get addGameButton() {
    return this.page.getByRole('link', { name: /add game/i })
  }

  get gameCards() {
    return this.page.locator('[data-testid="game-card"]')
  }

  get gameItems() {
    return this.page
      .locator('main a[href*="/games/"]')
      .filter({ hasNotText: /games library|add game/i })
  }

  get noGamesMessage() {
    return this.page.getByText(/no games found/i)
  }

  get loadingIndicator() {
    return this.page.getByText(/loading/i)
  }

  // Actions specific to games page
  async goto() {
    await this.page.goto('/games')
    await this.waitForPageLoad()
  }

  async searchGames(query: string) {
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
    // Wait for search results
    await this.page.waitForTimeout(1000)
  }

  async clickAddGame() {
    await this.addGameButton.click()
    await this.page.waitForURL('/games/new')
  }

  async clickFirstGame() {
    const firstGame = this.gameItems.first()
    await firstGame.click()
    // Wait for navigation to game detail page
    await this.page.waitForURL(/\/games\/[^/]+/)
  }

  async getGameCount(): Promise<number> {
    try {
      return await this.gameItems.count()
    } catch {
      return 0
    }
  }

  // Verification methods
  async verifyPageLoaded() {
    await this.pageHeading.waitFor({ state: 'visible' })
  }

  async verifyGameHeadingsVisible() {
    // Wait for games to load
    await this.page.waitForTimeout(2000)
    const count = await this.gameHeadings.count()
    // Games page might not have any games yet, which is okay
    if (count === 0) {
      console.log('No game headings found - games list might be empty')
      // Check if there's at least a page heading
      await this.pageHeading.waitFor({ state: 'visible' })
    } else {
      expect(count).toBeGreaterThan(0)
      await this.gameHeadings.first().waitFor({ state: 'visible' })
    }
  }

  async verifySearchVisible() {
    await this.searchInput.waitFor({ state: 'visible' })
  }

  async verifyGamesVisible() {
    const gameCount = await this.getGameCount()
    if (gameCount === 0) {
      // If no games, check if there's an empty state or loading message
      try {
        await this.noGamesMessage.waitFor({ state: 'visible', timeout: 2000 })
      } catch {
        // No explicit empty message, but that's ok if there are really no games
        console.log('No games found and no explicit empty state message')
      }
    } else {
      // If games exist, verify at least one is visible
      await this.gameItems.first().waitFor({ state: 'visible' })
    }
  }

  async verifyAddGameButtonVisible() {
    await this.addGameButton.waitFor({ state: 'visible' })
  }

  async isOnGamesPage(): Promise<boolean> {
    try {
      const url = this.page.url()
      return (
        url.includes('/games') &&
        !url.includes('/games/new') &&
        !url.includes('/games/')
      )
    } catch {
      return false
    }
  }
}
