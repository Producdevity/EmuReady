import path from 'path'
import { errors, type Page } from '@playwright/test'
import { test, expect } from './fixtures'

async function dismissCommunitySupportBanner(page: Page) {
  const dismissBanner = page.getByRole('button', { name: /dismiss community support/i }).first()

  try {
    await dismissBanner.waitFor({ state: 'visible', timeout: 1000 })
  } catch (error) {
    if (error instanceof errors.TimeoutError) return
    throw error
  }

  await dismissBanner.click()
}

test.describe('Success Rate Sorting', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') })

  test.beforeEach(async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('domcontentloaded')

    await dismissCommunitySupportBanner(page)
  })

  test('should sort by success rate ascending on first click', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })
    await verifiedHeader.click()

    await expect(page).toHaveURL(/sortField=successRate/)
    await expect(page).toHaveURL(/sortDirection=asc/)
    await expect(verifiedHeader.locator('.text-blue-500')).toBeVisible()

    await page.waitForLoadState('domcontentloaded')

    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0)
  })

  test('should sort by success rate descending on second click', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })

    await verifiedHeader.click()
    await expect(page).toHaveURL(/sortDirection=asc/)
    await verifiedHeader.click()

    await expect(page).toHaveURL(/sortField=successRate/)
    await expect(page).toHaveURL(/sortDirection=desc/)
    await expect(verifiedHeader.locator('.text-blue-500')).toBeVisible()

    await page.waitForLoadState('domcontentloaded')

    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0)
  })

  test('should clear sorting on third click (return to default)', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })

    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=asc/)
    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=desc/)
    await verifiedHeader.click()

    await expect(page).not.toHaveURL(/sortField=successRate/)
    await expect(page).not.toHaveURL(/sortDirection/)
    await expect(verifiedHeader.locator('.text-blue-500')).not.toBeVisible()
  })

  test('should maintain sort across pagination', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })
    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=asc/)
    await verifiedHeader.click()
    await page.waitForURL(/sortDirection=desc/)
    await page.waitForLoadState('domcontentloaded')

    const nextButton = page.getByRole('button', { name: /go to next page/i })
    await expect(nextButton).toBeVisible()
    await expect(nextButton).toBeEnabled()

    await nextButton.click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveURL(/sortField=successRate/)
    await expect(page).toHaveURL(/sortDirection=desc/)
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0)
  })

  test('should sort within reasonable time', async ({ page }) => {
    const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })

    const startTime = Date.now()
    await verifiedHeader.click()
    await page.waitForLoadState('domcontentloaded')
    const elapsed = Date.now() - startTime

    expect(elapsed).toBeLessThan(5000)
  })
})
