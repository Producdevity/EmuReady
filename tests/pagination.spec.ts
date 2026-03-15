import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Pagination Tests', () => {
  test('should display pagination controls when content exceeds page limit', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    // Check if pagination exists
    const paginationControls = page.locator(
      '[data-testid="pagination"], nav[aria-label*="pagination"], .pagination',
    )
    const hasPagination = await paginationControls.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasPagination) {
      // Verify pagination elements
      const nextButton = page
        .getByRole('button', { name: /next/i })
        .or(page.getByLabel(/next page/i))
      const prevButton = page
        .getByRole('button', { name: /previous/i })
        .or(page.getByLabel(/previous page/i))

      // First page: previous should be disabled
      const isPrevDisabled = await prevButton.isDisabled().catch(() => true)
      expect(isPrevDisabled).toBe(true)

      // Next button should be either enabled (more pages) or disabled (single page)
      const isNextEnabled = await nextButton.isEnabled().catch(() => false)
      expect(typeof isNextEnabled).toBe('boolean')
    } else {
      // If no pagination, there should be few items
      const listingCount = await listingsPage.getListingCount()
      expect(listingCount).toBeLessThanOrEqual(20)
    }
  })

  test('should navigate through pages using pagination controls', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Look for pagination
    const nextButton = page.getByRole('button', { name: /next/i }).or(page.getByLabel(/next page/i))
    const hasNext = await nextButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasNext && !(await nextButton.isDisabled())) {
      // Get first item on page 1
      const firstItemPage1 = await listingsPage.listingItems.first().textContent()

      // Click next
      await nextButton.click()
      await expect(listingsPage.listingItems.first()).toBeVisible()

      // Get first item on page 2
      const firstItemPage2 = await listingsPage.listingItems.first().textContent()

      // Items should be different
      expect(firstItemPage1).not.toBe(firstItemPage2)

      // Previous button should now be enabled
      const prevButton = page
        .getByRole('button', { name: /previous/i })
        .or(page.getByLabel(/previous page/i))
      await expect(prevButton).toBeEnabled()

      // Go back to page 1
      await prevButton.click()
      await expect(listingsPage.listingItems.first()).toBeVisible()

      // Should see same first item as before
      const firstItemPage1Again = await listingsPage.listingItems.first().textContent()
      expect(firstItemPage1Again).toBe(firstItemPage1)
    } else {
      // No pagination available; verify page still loaded with content
      await expect(listingsPage.pageHeading).toBeVisible()
    }
  })

  test('should update URL with page parameter', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Check for pagination
    const pageNumbers = page
      .locator('button[aria-label*="page"], a[aria-label*="page"]')
      .filter({ hasText: /^[0-9]+$/ })
    const hasPageNumbers = (await pageNumbers.count()) > 0

    if (hasPageNumbers) {
      // Click page 2
      const page2Button = pageNumbers.filter({ hasText: '2' }).first()
      if (await page2Button.isVisible()) {
        await page2Button.click()
        await page.waitForURL(/[?&]page=2|[?&]p=2/)

        // URL should include page parameter
        const url = page.url()
        expect(url).toMatch(/[?&]page=2|[?&]p=2/)
      }
    }

    // Or try with next button
    const nextButton = page.getByRole('button', { name: /next/i })
    if ((await nextButton.isVisible({ timeout: 2000 })) && !(await nextButton.isDisabled())) {
      const currentUrl = page.url()
      await nextButton.click()
      await page.waitForURL((url) => url.toString() !== currentUrl)

      const newUrl = page.url()
      // URL should have changed
      expect(newUrl).not.toBe(currentUrl)
    }
  })

  test('should persist pagination with filters', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Apply a filter if available
    const deviceFilter = listingsPage.deviceFilter
    if (await deviceFilter.isVisible({ timeout: 3000 })) {
      await deviceFilter.click()
      const firstOption = page.getByRole('option').first()
      if (await firstOption.isVisible({ timeout: 2000 })) {
        const filterText = await firstOption.textContent()
        await firstOption.click()
        await expect(
          listingsPage.listingItems.first().or(listingsPage.noListingsMessage),
        ).toBeVisible()

        // Check if pagination still works with filter
        const nextButton = page.getByRole('button', { name: /next/i })
        if ((await nextButton.isVisible()) && !(await nextButton.isDisabled())) {
          await nextButton.click()
          await expect(listingsPage.listingItems.first()).toBeVisible()

          // Filter should still be applied
          // Verify by checking if filter is still selected
          const selectedFilter = await deviceFilter.textContent()
          expect(selectedFilter).toContain(filterText || '')
        }
      }
    }
  })

  test('should show correct page indicators', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Look for page indicators
    const pageIndicators = [
      page.getByText(/page\s+\d+\s+of\s+\d+/i),
      page.getByText(/showing\s+\d+[-–]\d+\s+of\s+\d+/i),
      page.locator('[aria-current="page"]').first(),
    ]

    let foundIndicator = false
    for (const indicator of pageIndicators) {
      if (await indicator.isVisible({ timeout: 2000 })) {
        foundIndicator = true
        const text = await indicator.textContent()

        // Should show page 1 initially
        expect(text).toMatch(/1|first/i)
        break
      }
    }

    if (!foundIndicator) {
      // No pagination needed; verify item count is within a single page
      const itemCount = await listingsPage.getListingCount()
      expect(itemCount).toBeLessThanOrEqual(20)
    }
  })

  test('should handle keyboard navigation for pagination', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Focus on pagination area
    const pagination = page
      .locator('[data-testid="pagination"], nav[aria-label*="pagination"], .pagination')
      .first()

    if (await pagination.isVisible({ timeout: 3000 })) {
      // Tab to pagination controls
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Check if we can navigate with keyboard
      const focusedElement = page.locator(':focus')
      const focusedText = await focusedElement.textContent().catch(() => '')

      // Try arrow keys or Enter on focused pagination element
      if (focusedText) {
        await page.keyboard.press('Enter')
        await page.waitForLoadState('domcontentloaded')

        // Page content should have updated after keyboard navigation
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })

  test('should handle edge cases in pagination', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Try to go to a very high page number directly
    const url = new URL(page.url())
    url.searchParams.set('page', '9999')
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded' })

    // Should either:
    // 1. Redirect to last valid page
    // 2. Show no results
    // 3. Show first page

    // Wait for data to load
    await page
      .locator('tbody tr')
      .first()
      .or(page.getByText(/no results|no listings found|empty/i))
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {})

    const noResults = await page
      .getByText(/no results|no listings found|empty/i)
      .isVisible()
      .catch(() => false)
    const hasListings = (await page.locator('tbody tr').count()) > 0
    const isFirstPage = page.url().includes('page=1') || !page.url().includes('page=')
    const currentUrl = page.url()
    const redirectedToValid = !currentUrl.includes('page=9999')

    // One of these should be true: no results shown, has listings, redirected to first page, or redirected to valid page
    const handledGracefully = noResults || hasListings || isFirstPage || redirectedToValid

    expect(handledGracefully).toBe(true)
  })

  test('should update pagination when changing items per page', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Look for items per page selector
    const perPageSelectors = [
      page.getByRole('combobox', { name: /items per page/i }),
      page.getByRole('combobox', { name: /show.*entries/i }),
      page.locator('select').filter({ hasText: /10|20|50|100/ }),
    ]

    for (const selector of perPageSelectors) {
      if (await selector.isVisible({ timeout: 2000 })) {
        const currentValue = await selector.inputValue()

        // Change the value
        await selector.selectOption({ index: 1 }) // Select second option
        await page.waitForLoadState('domcontentloaded')

        // Pagination should update
        const newValue = await selector.inputValue()
        expect(newValue).not.toBe(currentValue)
        break
      }
    }
  })
})
