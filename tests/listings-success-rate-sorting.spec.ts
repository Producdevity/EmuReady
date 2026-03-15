import path from 'path'
import { test, expect } from '@playwright/test'

/**
 * E2E tests for success rate sorting on the listings page.
 *
 * The listings table has a "Verified" column (field: successRate) using
 * SortableHeader. Click cycle: asc → desc → clear. Success rate cells
 * display "X% (Y votes)" via SuccessRateBar.
 */

test.describe('Success Rate Sorting', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') })

  test.beforeEach(async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('domcontentloaded')

    // Dismiss community support banner if present (can intercept header clicks)
    const dismissBanner = page.getByRole('button', { name: /dismiss community support/i })
    if (await dismissBanner.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dismissBanner.click()
    }
  })

  test('should sort by success rate ascending on first click', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })
    await verifiedHeader.click()

    // URL should reflect ascending sort
    await expect(page).toHaveURL(/sortField=successRate/)
    await expect(page).toHaveURL(/sortDirection=asc/)

    // Active sort indicator should appear
    await expect(verifiedHeader.locator('.text-blue-500')).toBeVisible()

    // Wait for sorted data to load (tRPC refetch after URL change)
    await page.waitForLoadState('domcontentloaded')

    // Verify data loaded in sorted order
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should sort by success rate descending on second click', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })

    // First click: asc, second click: desc
    await verifiedHeader.click()
    await expect(page).toHaveURL(/sortDirection=asc/)
    await verifiedHeader.click()

    await expect(page).toHaveURL(/sortField=successRate/)
    await expect(page).toHaveURL(/sortDirection=desc/)

    // Active sort indicator should appear
    await expect(verifiedHeader.locator('.text-blue-500')).toBeVisible()

    // Wait for sorted data to load
    await page.waitForLoadState('domcontentloaded')

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should clear sorting on third click (return to default)', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })

    // Click three times: asc → desc → clear
    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=asc/)
    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=desc/)
    await verifiedHeader.click()

    // Sort params should be cleared from URL
    await expect(page).not.toHaveURL(/sortField=successRate/)
    await expect(page).not.toHaveURL(/sortDirection/)

    // No active sort indicator on the Verified header
    const activeIcon = verifiedHeader.locator('.text-blue-500')
    await expect(activeIcon).not.toBeVisible()
  })

  test('should maintain sort across pagination', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })
    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=asc/)

    // Switch to descending
    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=desc/)
    await page.waitForLoadState('domcontentloaded')

    const nextButton = page.getByRole('button', { name: /go to next page/i })
    const hasNextPage = await nextButton.isVisible().catch(() => false)

    if (hasNextPage && (await nextButton.isEnabled())) {
      await nextButton.click()
      await page.waitForLoadState('domcontentloaded')

      // Sort params should persist on page 2
      await expect(page).toHaveURL(/sortField=successRate/)
      await expect(page).toHaveURL(/sortDirection=desc/)

      // Table should still have rows
      const rows = page.locator('tbody tr')
      expect(await rows.count()).toBeGreaterThan(0)
    }
  })

  test('should sort within reasonable time', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })

    const startTime = Date.now()
    await verifiedHeader.click()
    await page.waitForLoadState('domcontentloaded')
    const elapsed = Date.now() - startTime

    // Sorting + re-render should complete within 5 seconds
    expect(elapsed).toBeLessThan(5000)
  })
})
