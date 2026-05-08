import { test, expect } from './fixtures'
import { ListingsPage } from './pages/ListingsPage'
import type { Locator } from './fixtures'

async function selectFirstFilterOption(filterButton: Locator) {
  await expect(filterButton).toHaveAttribute('aria-expanded', 'false')
  await filterButton.click()
  await expect(filterButton).toHaveAttribute('aria-expanded', 'true')

  const dropdown = filterButton.locator('xpath=ancestor::*[@data-testid="multi-select-root"][1]')
  const firstOption = dropdown.locator('label:has(input[type="checkbox"])').first()
  await expect(firstOption).toBeVisible()
  await firstOption.click()

  await filterButton.click()
  await expect(filterButton).toHaveAttribute('aria-expanded', 'false')
}

test.describe('Filtering Tests', () => {
  test('should display filter controls on the listings page', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    await expect(listingsPage.deviceFilter).toBeVisible()
    await expect(listingsPage.emulatorFilter).toBeVisible()
    await expect(listingsPage.performanceFilter).toBeVisible()
    await expect(listingsPage.systemFilter).toBeVisible()
  })

  test('should show listings table with seed data', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    await expect(listingsPage.listingItems.first()).toBeVisible()
  })

  test('should filter listings by device', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(listingsPage.deviceFilter)

    await expect(page).toHaveURL(/[?&]deviceIds=/)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should filter listings by emulator', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(listingsPage.emulatorFilter)

    await expect(page).toHaveURL(/[?&]emulatorIds=/)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should filter listings by performance rating', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(listingsPage.performanceFilter)

    await expect(page).toHaveURL(/[?&]performanceIds=/)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should apply multiple filters and clear them', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(listingsPage.deviceFilter)
    await expect(page).toHaveURL(/[?&]deviceIds=/)

    await selectFirstFilterOption(listingsPage.emulatorFilter)
    await expect(page).toHaveURL(/[?&]emulatorIds=/)

    await expect(listingsPage.clearFiltersButton).toBeVisible()
    await listingsPage.clearFiltersButton.click()

    await expect(page).not.toHaveURL(/[?&]deviceIds=/)
    await expect(page).not.toHaveURL(/[?&]emulatorIds=/)
    await expect(listingsPage.listingItems.first()).toBeVisible()
  })

  test('should update URL with filter parameters when a filter is applied', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(listingsPage.deviceFilter)

    await expect(page).toHaveURL(/[?&]deviceIds=/)
  })

  test('should persist filters after navigating back from a listing detail', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(listingsPage.deviceFilter)
    await expect(page).toHaveURL(/[?&]deviceIds=/)

    await listingsPage.clickFirstListing()
    await page.goBack()
    await listingsPage.verifyPageLoaded()

    await expect(page).toHaveURL(/[?&]deviceIds=/)
  })
})
