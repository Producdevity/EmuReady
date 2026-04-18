import path from 'path'
import { test, expect } from '@playwright/test'

test.describe('PC Listings', () => {
  test.describe('PC Listings Page', () => {
    test('should display PC Reports heading and table structure', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByRole('heading', { name: /pc reports/i }).first()).toBeVisible()

      const table = page.locator('table')
      await expect(table).toBeVisible()

      await expect(page.locator('th').filter({ hasText: /^cpu$/i })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: /^gpu$/i })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: /memory/i })).toBeVisible()

      await expect(page.locator('th').filter({ hasText: /game/i })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: /emulator/i })).toBeVisible()
    })

    test('should display table rows', async ({ page }) => {
      await page.goto('/pc-listings')

      await expect(page.locator('tbody tr').first()).toBeVisible()
    })

    test('should sort by CPU column', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const cpuHeader = page.locator('th').filter({ hasText: /^cpu$/i })
      await cpuHeader.click()

      await expect(page).toHaveURL(/sortField=cpu/)
      await expect(page).toHaveURL(/sortDirection=asc/)

      await cpuHeader.click()
      await expect(page).toHaveURL(/sortDirection=desc/)
    })

    test('should sort by GPU column', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const gpuHeader = page.locator('th').filter({ hasText: /^gpu$/i })
      await gpuHeader.click()

      await expect(page).toHaveURL(/sortField=gpu/)
      await expect(page).toHaveURL(/sortDirection=asc/)
    })

    test('should sort by Verified (success rate) column', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const verifiedHeader = page.locator('th').filter({ hasText: /verified/i })
      await verifiedHeader.click()

      await expect(page).toHaveURL(/sortField=successRate/)
      await expect(page).toHaveURL(/sortDirection=asc/)
    })
  })

  test.describe('PC Listings Navigation', () => {
    test('should navigate to PC listing detail on row click', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const rows = page.locator('tbody tr')
      await expect(rows.first()).toBeVisible()

      const link = rows.first().locator('a[href*="/pc-listings/"]').first()
      await link.click()
      await expect(page).toHaveURL(/\/pc-listings\/[a-z0-9]/)
    })

    test('should show Add PC Report button', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const addButton = page.getByRole('link', { name: /add pc report/i })
      await expect(addButton).toBeVisible()
      await expect(addButton).toHaveAttribute('href', '/pc-listings/new')
    })
  })

  test.describe('PC Listings with Authentication', () => {
    test.use({ storageState: path.join(__dirname, '.auth/user.json') })

    test('should toggle My Reports filter', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const myReportsButton = page.getByRole('button', { name: /my reports/i })
      await expect(myReportsButton).toBeVisible()

      await myReportsButton.click()
      await expect(page).toHaveURL(/myListings=true/)
    })

    test('should show display toggle buttons', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const systemToggle = page.getByRole('button', { name: /system icons|system names/i }).first()
      await expect(systemToggle).toBeVisible()

      await systemToggle.click()
      await expect(
        page.getByRole('button', { name: /system icons|system names/i }).first(),
      ).toBeVisible()
    })
  })
})
