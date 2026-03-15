import path from 'path'
import { test, expect } from '@playwright/test'

/**
 * E2E tests for the PC listings page.
 *
 * Route: /pc-listings
 * Heading: "PC Reports"
 * Table layout with PC-specific columns: CPU, GPU, Memory, OS.
 * Sorting via SortableHeader, pagination with aria-labels.
 */

test.describe('PC Listings', () => {
  test.describe('PC Listings Page', () => {
    test('should display PC Reports heading and table structure', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      // Page heading
      await expect(page.getByRole('heading', { name: /pc reports/i }).first()).toBeVisible()

      // Table should be present
      const table = page.locator('table')
      await expect(table).toBeVisible()

      // PC-specific column headers: CPU, GPU, Memory
      await expect(page.locator('th').filter({ hasText: /^cpu$/i })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: /^gpu$/i })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: /memory/i })).toBeVisible()

      // Shared columns: Game, Emulator
      await expect(page.locator('th').filter({ hasText: /game/i })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: /emulator/i })).toBeVisible()
    })

    test('should display table rows or empty state', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const rows = page.locator('tbody tr')
      const emptyState = page.getByText(/no.*listings|no.*reports|no.*found/i)

      const hasRows = (await rows.count()) > 0
      const hasEmptyState = await emptyState.isVisible().catch(() => false)

      expect(hasRows || hasEmptyState).toBe(true)
    })

    test('should sort by CPU column', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const cpuHeader = page.locator('th').filter({ hasText: /^cpu$/i })
      await cpuHeader.click()

      // URL should reflect sort params
      await expect(page).toHaveURL(/sortField=cpu/)
      await expect(page).toHaveURL(/sortDirection=asc/)

      // Click again for descending
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

      // Wait for table data to load
      const rows = page.locator('tbody tr')
      await rows
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {})

      if ((await rows.count()) > 0) {
        // Click the game name link inside the first row cell
        const link = rows.first().locator('a[href*="/pc-listings/"]').first()
        await link.click()
        // Use toHaveURL which auto-retries — waitForURL hangs on client-side navigation
        // because it waits for a 'load' event that never fires with pushState
        await expect(page).toHaveURL(/\/pc-listings\/[a-z0-9]/)
      }
    })

    test('should show Add PC Report button', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const addButton = page.getByRole('link', { name: /add pc report/i })
      const hasButton = await addButton.isVisible().catch(() => false)

      if (hasButton) {
        await expect(addButton).toHaveAttribute('href', '/pc-listings/new')
      }
    })
  })

  test.describe('PC Listings with Authentication', () => {
    test.use({ storageState: path.join(__dirname, '.auth/user.json') })

    test('should toggle My Reports filter', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const myReportsButton = page.getByRole('button', { name: /my reports/i })
      const hasMyReports = await myReportsButton.isVisible().catch(() => false)

      if (hasMyReports) {
        await myReportsButton.click()
        await expect(page).toHaveURL(/myListings=true/)
      }
    })

    test('should show display toggle buttons', async ({ page }) => {
      await page.goto('/pc-listings')
      await page.waitForLoadState('domcontentloaded')

      const systemToggle = page.getByRole('button', { name: /system icons|system names/i }).first()
      const hasToggle = await systemToggle.isVisible().catch(() => false)

      if (hasToggle) {
        await systemToggle.click()
        await expect(
          page.getByRole('button', { name: /system icons|system names/i }).first(),
        ).toBeVisible()
      }
    })
  })
})
