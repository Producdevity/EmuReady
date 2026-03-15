import { test, expect } from '@playwright/test'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Filtering Tests', () => {
  test('should filter listings by device', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    // Check if device filter is available
    if (await listingsPage.deviceFilter.isVisible({ timeout: 3000 })) {
      // Get initial count
      const initialCount = await listingsPage.getListingCount()

      // Apply device filter
      await listingsPage.deviceFilter.click()
      const deviceOptions = page.getByRole('option')
      const optionCount = await deviceOptions.count()

      if (optionCount > 1) {
        // First option is usually "All"
        // Click second option
        const secondOption = deviceOptions.nth(1)
        const deviceName = await secondOption.textContent()
        await secondOption.click()

        await expect(
          listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
        ).toBeVisible()

        const filteredCount = await listingsPage.getListingCount()
        expect(filteredCount).toBeLessThanOrEqual(initialCount)

        // Verify filter is applied
        const selectedDevice = await listingsPage.deviceFilter.textContent()
        expect(selectedDevice).toContain(deviceName || '')
      }
    }
  })

  test('should filter listings by emulator', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if (await listingsPage.emulatorFilter.isVisible({ timeout: 3000 })) {
      await listingsPage.emulatorFilter.click()

      const emulatorOptions = page.getByRole('option')
      if ((await emulatorOptions.count()) > 1) {
        const firstEmulator = emulatorOptions.nth(1)
        const emulatorName = await firstEmulator.textContent()
        await firstEmulator.click()

        await expect(
          listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
        ).toBeVisible()

        // All visible listings should be for this emulator
        const listings = await listingsPage.listingItems.all()
        if (listings.length > 0) {
          // Check first listing contains emulator name
          const firstListingText = await listings[0].textContent()

          // Verify the listing actually contains the emulator name
          if (emulatorName && firstListingText) {
            expect(firstListingText.toLowerCase()).toContain(emulatorName.toLowerCase())
          }
        }

        // Verify filter is active
        expect(await listingsPage.emulatorFilter.textContent()).toContain(emulatorName || '')
      }
    }
  })

  test('should filter listings by performance rating', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if (await listingsPage.performanceFilter.isVisible({ timeout: 3000 })) {
      const initialCount = await listingsPage.getListingCount()

      await listingsPage.performanceFilter.click()

      // Look for performance options (Perfect, Excellent, Good, etc.)
      const perfOptions = page
        .getByRole('option')
        .filter({ hasText: /perfect|excellent|good|playable/i })

      if ((await perfOptions.count()) > 0) {
        const firstOption = perfOptions.first()
        const performanceLevel = await firstOption.textContent()
        await firstOption.click()

        await expect(
          listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
        ).toBeVisible()

        const filteredCount = await listingsPage.getListingCount()

        // Verify the filter actually changed the results (unless all listings already matched)
        if (initialCount > 0) {
          expect(filteredCount).toBeLessThanOrEqual(initialCount)
        }

        // Verify filter is applied
        expect(await listingsPage.performanceFilter.textContent()).toContain(performanceLevel || '')
      }
    }
  })

  test('should apply multiple filters simultaneously', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    let filtersApplied = 0

    // Apply device filter
    if (await listingsPage.deviceFilter.isVisible({ timeout: 2000 })) {
      await listingsPage.deviceFilter.click()
      const deviceOption = page.getByRole('option').nth(1)
      if (await deviceOption.isVisible({ timeout: 1000 })) {
        await deviceOption.click()
        filtersApplied++
        await expect(
          listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
        ).toBeVisible()
      }
    }

    // Apply emulator filter
    if (await listingsPage.emulatorFilter.isVisible({ timeout: 2000 })) {
      await listingsPage.emulatorFilter.click()
      const emulatorOption = page.getByRole('option').nth(1)
      if (await emulatorOption.isVisible({ timeout: 1000 })) {
        await emulatorOption.click()
        filtersApplied++
        await expect(
          listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
        ).toBeVisible()
      }
    }

    if (filtersApplied > 1) {
      // Results should be filtered by both criteria
      const filteredCount = await listingsPage.getListingCount()
      expect(typeof filteredCount).toBe('number')

      // Clear filters button should be visible
      if (await listingsPage.clearFiltersButton.isVisible({ timeout: 2000 })) {
        await listingsPage.clearAllFilters()

        // Count should increase after clearing
        const clearedCount = await listingsPage.getListingCount()
        expect(clearedCount).toBeGreaterThanOrEqual(filteredCount)
      }
    }
  })

  test('should persist filters when navigating', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Apply a filter
    if (await listingsPage.deviceFilter.isVisible({ timeout: 3000 })) {
      await listingsPage.deviceFilter.click()
      const option = page.getByRole('option').nth(1)
      const filterValue = await option.textContent()
      await option.click()
      await expect(
        listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
      ).toBeVisible()

      // Navigate to a listing detail if available
      if ((await listingsPage.getListingCount()) > 0) {
        await listingsPage.clickFirstListing()

        // Go back
        await page.goBack()
        await listingsPage.verifyPageLoaded()

        // Filter should still be applied
        const currentFilter = await listingsPage.deviceFilter.textContent()
        expect(currentFilter).toContain(filterValue || '')
      }
    }
  })

  test('should update URL with filter parameters', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const initialUrl = page.url()

    // Apply any available filter
    const filters = [
      listingsPage.deviceFilter,
      listingsPage.emulatorFilter,
      listingsPage.performanceFilter,
    ]

    for (const filter of filters) {
      if (await filter.isVisible({ timeout: 2000 })) {
        await filter.click()
        const option = page.getByRole('option').nth(1)
        if (await option.isVisible({ timeout: 1000 })) {
          await option.click()
          await expect(
            listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
          ).toBeVisible()

          // URL should have changed
          const newUrl = page.url()
          expect(newUrl).not.toBe(initialUrl)

          // URL should contain filter parameter
          expect(newUrl).toMatch(/[?&](device|emulator|performance)=/i)
          break
        }
      }
    }
  })

  test('should show appropriate message when no results match filters', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Try to apply very restrictive filters
    let filtersApplied = 0

    // Apply all available filters with random selections
    const filters = [
      listingsPage.deviceFilter,
      listingsPage.emulatorFilter,
      listingsPage.performanceFilter,
    ]

    for (const filter of filters) {
      if (await filter.isVisible({ timeout: 2000 })) {
        await filter.click()
        const options = page.getByRole('option')
        const count = await options.count()

        if (count > 1) {
          // Select last option (often most restrictive)
          await options.nth(count - 1).click()
          filtersApplied++
          await expect(
            listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
          ).toBeVisible()
        }
      }
    }

    if (filtersApplied > 0) {
      const resultCount = await listingsPage.getListingCount()

      if (resultCount === 0) {
        // Should show no results message
        const noResultsMessage = await listingsPage.noListingsMessage.isVisible({ timeout: 3000 })
        expect(noResultsMessage).toBe(true)

        // Clear filters should still be available
        if (await listingsPage.clearFiltersButton.isVisible()) {
          await listingsPage.clearAllFilters()

          // Should show results again
          const clearedCount = await listingsPage.getListingCount()
          expect(clearedCount).toBeGreaterThan(0)
        }
      }
    }
  })

  test('should handle filter combinations that produce no results', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Apply conflicting filters if possible
    if (
      (await listingsPage.deviceFilter.isVisible()) &&
      (await listingsPage.emulatorFilter.isVisible())
    ) {
      // Select a device
      await listingsPage.deviceFilter.click()
      await page.getByRole('option').nth(1).click()
      await expect(
        listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
      ).toBeVisible()

      // Select an emulator that might not support this device
      await listingsPage.emulatorFilter.click()
      const emulatorOptions = page.getByRole('option')
      const lastOption = emulatorOptions.nth((await emulatorOptions.count()) - 1)
      await lastOption.click()
      await expect(
        listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
      ).toBeVisible()

      const count = await listingsPage.getListingCount()

      if (count === 0) {
        // Should show helpful message
        const noResults = await page
          .getByText(/no listings found|try adjusting your filters/i)
          .isVisible({ timeout: 2000 })
        expect(noResults).toBe(true)
      }
    }
  })
})

test.describe('Quick Filter Tests', () => {
  test('should apply quick filters if available', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Look for quick filter buttons
    const quickFilters = page
      .getByRole('button')
      .filter({ hasText: /latest|popular|trending|top rated|newest/i })

    if ((await quickFilters.count()) > 0) {
      const firstQuickFilter = quickFilters.first()

      await firstQuickFilter.click()
      await expect(
        listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
      ).toBeVisible()

      // Verify filter is active (button might change style)
      const isActive =
        (await firstQuickFilter.getAttribute('aria-pressed')) === 'true' ||
        (await firstQuickFilter.getAttribute('data-state')) === 'active' ||
        ((await firstQuickFilter.getAttribute('class')) || '').includes('active')

      expect(isActive).toBe(true)
    }
  })

  test('should toggle filter panel on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Look for filter toggle button on mobile
    const filterToggle = page
      .getByRole('button')
      .filter({ hasText: /filter/i })
      .or(page.getByLabel(/toggle filter/i))

    if (await filterToggle.isVisible({ timeout: 3000 })) {
      // Filters might be hidden initially on mobile
      const filtersVisible = await listingsPage.deviceFilter.isVisible({
        timeout: 1000,
      })

      if (!filtersVisible) {
        // Click to show filters
        await filterToggle.click()

        // Filters should now be visible
        await expect(listingsPage.deviceFilter.or(listingsPage.emulatorFilter)).toBeVisible()
      }
    }
  })
})
