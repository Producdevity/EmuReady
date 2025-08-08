import type { Page } from '@playwright/test'

export class CookieBanner {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get cookieBanner() {
    // Look for the specific cookie banner structure from CookieConsent.tsx
    return this.page
      .locator('.fixed.inset-0.z-\\[70\\]')
      .filter({ hasText: /Cookie Preferences/i })
      .first()
  }

  get acceptButton() {
    // More specific selector for "Accept All" button
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

  get declineButton() {
    return this.page.getByRole('button', { name: /decline|reject/i })
  }

  get overlay() {
    // More specific selector to avoid matching navigation and other fixed elements
    return this.page
      .locator('.fixed.inset-0')
      .filter({
        has: this.page.locator(
          '[class*="cookie"], [class*="consent"], [class*="gdpr"]',
        ),
      })
      .or(
        this.page.locator(
          '[class*="overlay"][class*="cookie"], [class*="backdrop"][class*="cookie"]',
        ),
      )
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
      // Wait for banner to disappear
      await this.cookieBanner.waitFor({ state: 'hidden', timeout: 5000 })
    }
  }

  async declineCookies() {
    if (await this.isVisible()) {
      await this.declineButton.click()
      // Wait for banner to disappear
      await this.cookieBanner.waitFor({ state: 'hidden', timeout: 5000 })
    }
  }

  async dismissIfPresent() {
    try {
      // Check if cookie banner is visible
      const bannerVisible = await this.cookieBanner
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (!bannerVisible) {
        return
      }

      console.log('Cookie banner detected, attempting to dismiss...')

      // Try clicking Accept All first
      const acceptAllVisible = await this.acceptButton
        .isVisible({ timeout: 1000 })
        .catch(() => false)
      if (acceptAllVisible) {
        await this.acceptButton.click()
        await this.page.waitForTimeout(500)
        return
      }

      // Try clicking the close button
      const closeButtonVisible = await this.page
        .getByLabel('Close cookie banner')
        .isVisible({ timeout: 1000 })
        .catch(() => false)
      if (closeButtonVisible) {
        await this.page.getByLabel('Close cookie banner').click()
        await this.page.waitForTimeout(500)
        return
      }

      // Try clicking the backdrop to dismiss
      const backdrop = this.page.locator(
        '.absolute.inset-0.bg-black\\/30.backdrop-blur-\\[2px\\]',
      )
      const backdropVisible = await backdrop
        .isVisible({ timeout: 1000 })
        .catch(() => false)
      if (backdropVisible) {
        await backdrop.click({ force: true })
        await this.page.waitForTimeout(500)
        return
      }

      console.log('Unable to dismiss cookie banner through normal methods')
    } catch (error) {
      console.log('Error dismissing cookie banner:', error)
    }
  }
}
