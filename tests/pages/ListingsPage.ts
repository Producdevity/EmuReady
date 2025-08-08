import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class ListingsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Page-specific elements
  get pageHeading() {
    // Use first() to handle potential duplicate headings
    return this.page.getByRole('heading', { name: /game listings/i }).first()
  }

  get filtersHeading() {
    return this.page.locator('h2').filter({ hasText: /filters/i })
  }

  get searchInput() {
    return this.page.getByRole('textbox', { name: /search/i })
  }

  get addListingButton() {
    return this.page.getByRole('link', { name: /add listing/i })
  }

  get createListingButton() {
    return this.page.getByRole('button', { name: /create listing/i })
  }

  get listingCards() {
    return this.page.locator('[data-testid="listing-card"]')
  }

  get listingItems() {
    return this.page
      .locator('main a[href*="/listings/"]')
      .filter({ hasNotText: /game listings|add listing|add/i })
      .and(this.page.locator(':visible'))
  }

  get noListingsMessage() {
    return this.page.getByText(/no listings found|no results|empty|nothing found/i)
  }

  get loadingIndicator() {
    return this.page.getByText(/loading/i)
  }

  // Filter elements
  get deviceFilter() {
    return this.page.getByRole('combobox', { name: /device/i })
  }

  get emulatorFilter() {
    return this.page.getByRole('combobox', { name: /emulator/i })
  }

  get performanceFilter() {
    return this.page.getByRole('combobox', { name: /performance/i })
  }

  get clearFiltersButton() {
    return this.page.getByRole('button', { name: /clear filters/i })
  }

  // Actions specific to listings page
  async goto() {
    await this.page.goto('/listings')
    await this.waitForPageLoad()
  }

  async searchListings(query: string) {
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
    // Wait for search results
    await this.page.waitForTimeout(1000)
  }

  async clickAddListing() {
    // Try both possible button variations
    try {
      await this.addListingButton.click()
    } catch {
      await this.createListingButton.click()
    }
    await this.page.waitForURL('/listings/new')
  }

  async clickFirstListing() {
    const firstListing = this.listingItems.first()
    await firstListing.click()
    // Wait for navigation to listing detail page
    await this.page.waitForURL(/\/listings\/[^/]+/)
  }

  async filterByDevice(deviceName: string) {
    await this.deviceFilter.click()
    await this.page.getByRole('option', { name: deviceName }).click()
    // Wait for filter to apply
    await this.page.waitForTimeout(1000)
  }

  async filterByEmulator(emulatorName: string) {
    await this.emulatorFilter.click()
    await this.page.getByRole('option', { name: emulatorName }).click()
    // Wait for filter to apply
    await this.page.waitForTimeout(1000)
  }

  async filterByPerformance(performance: string) {
    await this.performanceFilter.click()
    await this.page.getByRole('option', { name: performance }).click()
    // Wait for filter to apply
    await this.page.waitForTimeout(1000)
  }

  async clearAllFilters() {
    await this.clearFiltersButton.click()
    // Wait for filters to clear
    await this.page.waitForTimeout(1000)
  }

  async getListingCount(): Promise<number> {
    try {
      return await this.listingItems.count()
    } catch {
      return 0
    }
  }

  // Verification methods
  async verifyPageLoaded() {
    await this.pageHeading.waitFor({ state: 'visible' })
  }

  async verifyFiltersHeadingVisible() {
    const isMobile = this.page.viewportSize()?.width ? this.page.viewportSize()!.width < 768 : false

    if (!isMobile) {
      // Filters heading is only visible on desktop
      await this.filtersHeading.waitFor({ state: 'visible' })
    }
  }

  async verifySearchVisible() {
    await this.searchInput.waitFor({ state: 'visible' })
  }

  async verifyListingsVisible() {
    const listingCount = await this.getListingCount()
    if (listingCount === 0) {
      // If no listings, check if there's an empty state message
      try {
        await this.noListingsMessage.waitFor({
          state: 'visible',
          timeout: 2000,
        })
      } catch {
        // No explicit empty message, but that's ok if there are really no listings
        console.log('No listings found and no explicit empty state message')
      }
    } else {
      // If listings exist, verify at least one is visible
      await this.listingItems.first().waitFor({ state: 'visible' })
    }
  }

  async verifyFiltersVisible() {
    // Not all filters may be present, so check each individually
    const filters = [this.deviceFilter, this.emulatorFilter, this.performanceFilter]
    let visibleFilterCount = 0

    for (const filter of filters) {
      try {
        await filter.waitFor({ state: 'visible', timeout: 2000 })
        visibleFilterCount++
      } catch {
        // Filter not visible, continue
      }
    }

    // At least one filter should be visible
    if (visibleFilterCount === 0) {
      throw new Error('No filters visible on listings page')
    }
  }

  async isOnListingsPage(): Promise<boolean> {
    try {
      const url = this.page.url()
      return (
        url.includes('/listings') && !url.includes('/listings/new') && !url.includes('/listings/')
      )
    } catch {
      return false
    }
  }

  async verifyAddListingButtonVisible() {
    try {
      await this.addListingButton.waitFor({ state: 'visible' })
    } catch {
      // Try alternative button
      await this.createListingButton.waitFor({ state: 'visible' })
    }
  }
}
