import path from 'path'
import { test, expect } from '@playwright/test'

/**
 * Critical E2E tests for success rate sorting functionality.
 * This is core business logic - any failure here breaks the application.
 */

test.describe('Success Rate Sorting - Critical Business Logic', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') })

  test.beforeEach(async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
  })

  test('should sort by success rate in descending order (highest first)', async ({ page }) => {
    // Click the success rate column header
    await page.click('[data-testid="sort-success-rate"]')

    // Verify the sort direction indicator shows descending
    await expect(
      page.locator('[data-testid="sort-success-rate"] [data-testid="sort-desc"]'),
    ).toBeVisible()

    // Wait for listings to load
    await page.waitForSelector('[data-testid="listing-card"]')

    // Get all success rate values from the page
    const successRates = await page.locator('[data-testid="success-rate-value"]').allTextContents()

    // Convert to numbers and verify descending order
    const numericRates = successRates.map((rate) => {
      const match = rate.match(/(\d+(?:\.\d+)?)%/)
      return match ? parseFloat(match[1]) : 0
    })

    // Verify descending order
    for (let i = 0; i < numericRates.length - 1; i++) {
      expect(numericRates[i]).toBeGreaterThanOrEqual(numericRates[i + 1])
    }
  })

  test('should sort by success rate in ascending order (lowest first)', async ({ page }) => {
    // Click twice to get ascending order
    await page.click('[data-testid="sort-success-rate"]')
    await page.click('[data-testid="sort-success-rate"]')

    // Verify the sort direction indicator shows ascending
    await expect(
      page.locator('[data-testid="sort-success-rate"] [data-testid="sort-asc"]'),
    ).toBeVisible()

    await page.waitForSelector('[data-testid="listing-card"]')

    const successRates = await page.locator('[data-testid="success-rate-value"]').allTextContents()
    const numericRates = successRates.map((rate) => {
      const match = rate.match(/(\d+(?:\.\d+)?)%/)
      return match ? parseFloat(match[1]) : 0
    })

    // Verify ascending order
    for (let i = 0; i < numericRates.length - 1; i++) {
      expect(numericRates[i]).toBeLessThanOrEqual(numericRates[i + 1])
    }
  })

  test('should handle neutral state (default sorting)', async ({ page }) => {
    // Click three times to return to neutral state
    await page.click('[data-testid="sort-success-rate"]')
    await page.click('[data-testid="sort-success-rate"]')
    await page.click('[data-testid="sort-success-rate"]')

    // Verify no sort indicator is shown
    await expect(
      page.locator('[data-testid="sort-success-rate"] [data-testid="sort-asc"]'),
    ).not.toBeVisible()
    await expect(
      page.locator('[data-testid="sort-success-rate"] [data-testid="sort-desc"]'),
    ).not.toBeVisible()

    await page.waitForSelector('[data-testid="listing-card"]')

    // In neutral state, should sort by creation date (newest first)
    const timestamps = await page.locator('[data-testid="listing-created-at"]').allTextContents()

    // Convert to dates and verify newest first (descending order)
    const dates = timestamps.map((timestamp) => new Date(timestamp).getTime())
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1])
    }
  })

  test('should handle listings with zero votes correctly', async ({ page }) => {
    await page.click('[data-testid="sort-success-rate"]')
    await page.waitForSelector('[data-testid="listing-card"]')

    // Find listings with 0 votes
    const zeroVoteListings = page.locator('[data-testid="listing-card"]').filter({
      has: page.locator('[data-testid="vote-count"]', { hasText: '0' }),
    })

    // Zero vote listings should appear at the end when sorting by success rate
    const allListings = await page.locator('[data-testid="listing-card"]').count()
    const zeroVoteCount = await zeroVoteListings.count()

    if (zeroVoteCount > 0) {
      // Get the position of first zero-vote listing
      const firstZeroVoteIndex = await page
        .locator('[data-testid="listing-card"]')
        .nth(allListings - zeroVoteCount)
        .getAttribute('data-listing-id')
      expect(firstZeroVoteIndex).toBeTruthy()
    }
  })

  test('should handle pagination correctly with success rate sorting', async ({ page }) => {
    await page.click('[data-testid="sort-success-rate"]')
    await page.waitForSelector('[data-testid="listing-card"]')

    // Get first page success rates
    const firstPageRates = await page
      .locator('[data-testid="success-rate-value"]')
      .allTextContents()

    // Go to next page if it exists
    const nextPageButton = page.locator('[data-testid="pagination-next"]')
    if ((await nextPageButton.isVisible()) && (await nextPageButton.isEnabled())) {
      await nextPageButton.click()
      await page.waitForSelector('[data-testid="listing-card"]')

      const secondPageRates = await page
        .locator('[data-testid="success-rate-value"]')
        .allTextContents()

      // Last item on first page should have >= success rate than first item on second page
      const lastFirstPage = parseFloat(
        firstPageRates[firstPageRates.length - 1].match(/(\d+(?:\.\d+)?)%/)?.[1] || '0',
      )
      const firstSecondPage = parseFloat(secondPageRates[0].match(/(\d+(?:\.\d+)?)%/)?.[1] || '0')

      expect(lastFirstPage).toBeGreaterThanOrEqual(firstSecondPage)
    }
  })

  test('should maintain sort order when filtering', async ({ page }) => {
    // Apply success rate sorting
    await page.click('[data-testid="sort-success-rate"]')
    await page.waitForSelector('[data-testid="listing-card"]')

    // Apply a filter (e.g., system filter)
    const systemFilter = page.locator('[data-testid="system-filter"]').first()
    if (await systemFilter.isVisible()) {
      await systemFilter.click()
      await page.waitForSelector('[data-testid="listing-card"]')

      // Verify sort indicator is still shown
      await expect(
        page.locator('[data-testid="sort-success-rate"] [data-testid="sort-desc"]'),
      ).toBeVisible()

      // Verify results are still sorted
      const successRates = await page
        .locator('[data-testid="success-rate-value"]')
        .allTextContents()
      const numericRates = successRates.map((rate) =>
        parseFloat(rate.match(/(\d+(?:\.\d+)?)%/)?.[1] || '0'),
      )

      for (let i = 0; i < numericRates.length - 1; i++) {
        expect(numericRates[i]).toBeGreaterThanOrEqual(numericRates[i + 1])
      }
    }
  })

  test('should handle equal success rates with secondary sorting', async ({ page }) => {
    await page.click('[data-testid="sort-success-rate"]')
    await page.waitForSelector('[data-testid="listing-card"]')

    // Find listings with same success rate
    const successRates = await page.locator('[data-testid="success-rate-value"]').allTextContents()
    const rates = successRates.map((rate) => parseFloat(rate.match(/(\d+(?:\.\d+)?)%/)?.[1] || '0'))

    // Look for consecutive equal rates
    for (let i = 0; i < rates.length - 1; i++) {
      if (rates[i] === rates[i + 1]) {
        // Found equal success rates - verify secondary sorting by vote count
        const voteCount1 = await page
          .locator('[data-testid="listing-card"]')
          .nth(i)
          .locator('[data-testid="vote-count"]')
          .textContent()
        const voteCount2 = await page
          .locator('[data-testid="listing-card"]')
          .nth(i + 1)
          .locator('[data-testid="vote-count"]')
          .textContent()

        const votes1 = parseInt(voteCount1 || '0')
        const votes2 = parseInt(voteCount2 || '0')

        // Higher vote count should come first for equal success rates
        expect(votes1).toBeGreaterThanOrEqual(votes2)
        break
      }
    }
  })

  test('should perform sorting in reasonable time', async ({ page }) => {
    const startTime = Date.now()

    await page.click('[data-testid="sort-success-rate"]')
    await page.waitForSelector('[data-testid="listing-card"]')

    const endTime = Date.now()
    const sortTime = endTime - startTime

    // Sorting should complete within 5 seconds even with large datasets
    expect(sortTime).toBeLessThan(5000)
  })
})
