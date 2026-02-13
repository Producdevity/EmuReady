import type { Page } from '@playwright/test'

export class CookieBanner {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get cookieBanner() {
    return this.page.getByTestId('cookie-consent')
  }

  get acceptButton() {
    return this.page.getByRole('button', { name: /accept all/i })
  }

  get necessaryOnlyButton() {
    return this.page.getByRole('button', { name: /necessary only/i })
  }

  get customizeButton() {
    return this.page.getByRole('button', { name: /customize/i })
  }

  get closeButton() {
    return this.page.getByRole('button', { name: /close cookie banner/i })
  }

  get backdrop() {
    return this.cookieBanner.locator('.bg-black\\/30')
  }

  async isVisible(): Promise<boolean> {
    try {
      return await this.cookieBanner.isVisible({ timeout: 2000 })
    } catch {
      return false
    }
  }

  async acceptCookies() {
    if (await this.isVisible()) {
      await this.acceptButton.click()
      await this.cookieBanner.waitFor({ state: 'hidden', timeout: 5000 })
    }
  }

  async dismissIfPresent() {
    try {
      const bannerVisible = await this.cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)
      if (!bannerVisible) {
        return
      }

      // Click "Accept All" to dismiss
      const acceptAllVisible = await this.acceptButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)
      if (acceptAllVisible) {
        await this.acceptButton.click()
        await this.cookieBanner.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
        return
      }

      // Fall back to the close button (X icon)
      const closeButtonVisible = await this.closeButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)
      if (closeButtonVisible) {
        await this.closeButton.click()
        await this.cookieBanner.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
        return
      }

      // Fall back to clicking the backdrop overlay
      const backdropVisible = await this.backdrop.isVisible({ timeout: 1000 }).catch(() => false)
      if (backdropVisible) {
        await this.backdrop.click({ force: true })
        await this.cookieBanner.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
        return
      }
    } catch (error) {
      console.log('Error dismissing cookie banner:', error)
    }
  }
}
