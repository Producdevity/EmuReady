import { test, expect } from './fixtures'
import { ListingsPage } from './pages/ListingsPage'
import type { Locator, Page } from '@playwright/test'

async function waitForListingsTableIdle(page: Page) {
  const tableBody = page.locator('table tbody').first()
  const firstRow = page.locator('table tbody tr').first()
  const noListingsMessage = page.getByText(/no listings found|no results|empty|nothing found/i)

  await expect(firstRow.or(noListingsMessage)).toBeVisible()
  if (await tableBody.isVisible()) {
    await expect(tableBody).not.toHaveClass(/opacity-50/)
  }
}

async function openFilterDropdown(filterButton: Locator) {
  await filterButton.scrollIntoViewIfNeeded()
  let opened = false
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await filterButton.click()
    try {
      await expect(filterButton).toHaveAttribute('aria-expanded', 'true', { timeout: 750 })
      opened = true
      break
    } catch {
      // Retry because the filter button can re-render while URL-backed state updates.
    }
  }
  expect(opened).toBe(true)
  await expect(filterButton).toHaveAttribute('aria-expanded', 'true')
}

async function selectFirstFilterOption(
  page: Page,
  filterButton: Locator,
  expectedParam: string,
  optionText?: string,
) {
  await openFilterDropdown(filterButton)
  const options = page.locator('label:has(input[type="checkbox"])')
  const option = optionText ? options.filter({ hasText: optionText }).first() : options.first()
  await expect(option).toBeVisible()
  await option.click()
  await expect(page).toHaveURL(new RegExp(`[?&]${expectedParam}=`))
  await filterButton.click()
  await expect(filterButton).toHaveAttribute('aria-expanded', 'false')
  await waitForListingsTableIdle(page)
}

test.describe('Filtering Tests', () => {
  test('should close a filter dropdown with Escape', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await openFilterDropdown(listingsPage.deviceFilter)

    const firstOption = page.locator('label:has(input[type="checkbox"])').first()
    await expect(firstOption).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(firstOption).toBeHidden()
  })

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

    const deviceName = await listingsPage.getFirstListingDeviceName()
    await selectFirstFilterOption(page, listingsPage.deviceFilter, 'deviceIds', deviceName)

    await expect(page).toHaveURL(/[?&]deviceIds=/)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should filter listings by emulator', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(page, listingsPage.emulatorFilter, 'emulatorIds')

    await expect(page).toHaveURL(/[?&]emulatorIds=/)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should filter listings by performance rating', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await selectFirstFilterOption(page, listingsPage.performanceFilter, 'performanceIds')

    await expect(page).toHaveURL(/[?&]performanceIds=/)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should apply multiple filters and clear them', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    const deviceName = await listingsPage.getFirstListingDeviceName()
    await selectFirstFilterOption(page, listingsPage.emulatorFilter, 'emulatorIds')
    await expect(page).toHaveURL(/[?&]emulatorIds=/)

    await selectFirstFilterOption(page, listingsPage.deviceFilter, 'deviceIds', deviceName)
    await expect(page).toHaveURL(/[?&]deviceIds=/)

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

    const deviceName = await listingsPage.getFirstListingDeviceName()
    await selectFirstFilterOption(page, listingsPage.deviceFilter, 'deviceIds', deviceName)

    await expect(page).toHaveURL(/[?&]deviceIds=/)
  })

  test('should persist filters after navigating back from a listing detail', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    const deviceName = await listingsPage.getFirstListingDeviceName()
    await selectFirstFilterOption(page, listingsPage.deviceFilter, 'deviceIds', deviceName)
    await expect(page).toHaveURL(/[?&]deviceIds=/)

    await listingsPage.clickFirstListing()
    await page.goBack()
    await listingsPage.verifyPageLoaded()

    await expect(page).toHaveURL(/[?&]deviceIds=/)
  })
})
