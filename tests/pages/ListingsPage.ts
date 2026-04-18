import { expect } from '@playwright/test'
import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class ListingsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  get pageHeading() {
    return this.page.getByRole('heading', { name: /handheld reports/i }).first()
  }

  get filtersHeading() {
    return this.page.locator('h2').filter({ hasText: /filters/i })
  }

  get searchInput() {
    return this.page.getByRole('textbox', { name: /search/i })
  }

  get addReportButton() {
    return this.page.getByRole('link', { name: /add.*(?:report|listing)/i })
  }

  get listingItems() {
    return this.page.locator('table tbody tr')
  }

  get noListingsMessage() {
    return this.page.getByText(/no listings found|no results|empty|nothing found/i)
  }

  // Filters are MultiSelect components rendered as buttons with aria-label
  // like "Devices multi-select", "Emulators multi-select", etc.
  get deviceFilter() {
    return this.page.getByRole('button', { name: /devices multi-select/i })
  }

  get emulatorFilter() {
    return this.page.getByRole('button', { name: /emulators multi-select/i })
  }

  get performanceFilter() {
    return this.page.getByRole('button', { name: /performance multi-select/i })
  }

  get systemFilter() {
    return this.page.getByRole('button', { name: /systems multi-select/i })
  }

  get clearFiltersButton() {
    // The Active Filters section renders a "Clear All" button when filters
    // are applied (scoped to avoid "Clear all selections" per-field buttons).
    return this.page.getByRole('button', { name: /^clear all$/i })
  }

  async goto() {
    await this.page.goto('/listings')
    await this.waitForPageLoad()
  }

  async searchListings(query: string) {
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
    await expect(this.page).toHaveURL(/[?&]search=/)
  }

  async clickFirstListing() {
    const firstRow = this.listingItems.first()
    await expect(firstRow).toBeVisible()
    const link = firstRow.locator('a[href*="/listings/"]').first()
    await link.click()
    await expect(this.page).toHaveURL(/\/listings\/[^/]+/)
  }

  async verifyPageLoaded() {
    await expect(this.pageHeading).toBeVisible()
  }
}
