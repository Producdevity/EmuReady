import { test, expect } from '@playwright/test'

test.describe('IGDB Search', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('should display IGDB search page with header', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByRole('heading', { name: /search game database/i })).toBeVisible()
    await expect(page.getByText(/powered by igdb/i)).toBeVisible()
  })

  test('should show system selection and search input', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByPlaceholder(/choose a system/i)).toBeVisible()
    await expect(page.getByPlaceholder(/enter game title/i)).toBeVisible()
    await expect(page.locator('button[type="submit"]').filter({ hasText: /search/i })).toBeVisible()
  })

  test('should require system selection before search', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    await page.getByPlaceholder(/enter game title/i).fill('Mario')
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: /search/i })
      .click()

    await expect(page.getByText(/please select a system/i)).toBeVisible()
  })

  test('should have search button disabled for empty query', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    await expect(
      page.locator('button[type="submit"]').filter({ hasText: /search/i }),
    ).toBeDisabled()
  })

  test('should enable search button when query has 2+ characters', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    await page.getByPlaceholder(/enter game title/i).fill('Ma')

    await expect(page.locator('button[type="submit"]').filter({ hasText: /search/i })).toBeEnabled()
  })

  test('should show search description text', async ({ page }) => {
    await page.goto('/games/new/search/v2')
    await page.waitForLoadState('domcontentloaded')

    await expect(
      page.getByText(/comprehensive.*game.*information|metadata.*images/i).first(),
    ).toBeVisible()
  })
})
