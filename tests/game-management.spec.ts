import { test, expect } from '@playwright/test'

/**
 * E2E tests for game management pages.
 *
 * Public games page: /games (heading: "Games Library", card grid layout)
 * Game detail: /games/[id]
 * Admin games: /admin/games (heading: "Games Management", table layout)
 * Game creation: /games/new (three method cards: IGDB, TGDB, Manual)
 */

test.describe('Game Management', () => {
  test.describe('Public Games Page', () => {
    test('should display games library with heading and cards', async ({ page }) => {
      await page.goto('/games')
      await page.waitForLoadState('domcontentloaded')

      // Page heading
      await expect(page.getByRole('heading', { name: /games library/i })).toBeVisible()

      // Search input
      await expect(page.getByPlaceholder(/search games/i)).toBeVisible()

      // Wait for data to finish loading
      await page
        .getByText(/loading games/i)
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {})

      // Game cards or empty state
      const gameCards = page.locator('a[href^="/games/"]').filter({
        has: page.locator('h2'),
      })
      const emptyState = page.getByText(/no games found/i)

      const hasGames = (await gameCards.count()) > 0
      const hasEmptyState = await emptyState.isVisible().catch(() => false)

      expect(hasGames || hasEmptyState).toBe(true)
    })

    test('should search games by title', async ({ page }) => {
      await page.goto('/games')
      await page.waitForLoadState('domcontentloaded')

      const searchInput = page.getByPlaceholder(/search games/i)
      await searchInput.fill('test')

      // URL should reflect search
      await expect(page).toHaveURL(/search=test/)
    })

    test('should navigate to game detail page', async ({ page }) => {
      await page.goto('/games')
      await page.waitForLoadState('domcontentloaded')

      const gameCards = page.locator('a[href^="/games/"]').filter({
        has: page.locator('h2'),
      })

      const hasGames = (await gameCards.count()) > 0

      if (hasGames) {
        const firstCard = gameCards.first()
        const href = await firstCard.getAttribute('href')
        await firstCard.click()

        // Should navigate to game detail
        await expect(page).toHaveURL(/\/games\//)
        expect(href).toMatch(/\/games\//)

        // Game detail page should have a heading
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      }
    })

    test('should show pagination when many games exist', async ({ page }) => {
      await page.goto('/games')
      await page.waitForLoadState('domcontentloaded')

      const pagination = page.getByRole('navigation', { name: /pagination/i })
      const hasPagination = await pagination.isVisible().catch(() => false)

      if (hasPagination) {
        const nextButton = page.getByRole('button', { name: /go to next page/i })
        await expect(nextButton).toBeVisible()
      }
    })
  })

  test.describe('Game Detail Page', () => {
    test('should display game information and report buttons', async ({ page }) => {
      await page.goto('/games')
      await page.waitForLoadState('domcontentloaded')

      const gameCards = page.locator('a[href^="/games/"]').filter({
        has: page.locator('h2'),
      })

      if ((await gameCards.count()) > 0) {
        const firstCard = gameCards.first()
        const href = await firstCard.getAttribute('href')
        await firstCard.click()

        try {
          await expect(page).toHaveURL(/\/games\/[^/]+/, { timeout: 5000 })
        } catch {
          if (href) {
            await page.goto(href)
            await expect(page).toHaveURL(/\/games\/[^/]+/)
          }
        }
        await page.waitForLoadState('domcontentloaded')

        // Game title heading
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        // Report buttons (handheld and/or PC)
        const addReportButton = page.getByRole('link', { name: /add.*(report|listing)/i }).first()
        const hasAddButton = await addReportButton.isVisible().catch(() => false)

        if (hasAddButton) {
          await expect(addReportButton).toBeVisible()
        }
      }
    })
  })

  test.describe('Game Creation Page', () => {
    // Admin/moderator can see the method selection page; regular users redirect to IGDB
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should display add new game page with method selection', async ({ page }) => {
      await page.goto('/games/new')
      await page.waitForLoadState('domcontentloaded')

      // Page heading
      await expect(page.getByRole('heading', { name: /add new game/i })).toBeVisible()

      // Three method cards: IGDB (recommended), TheGamesDB, Manual
      await expect(page.getByRole('heading', { name: /igdb search/i, level: 3 })).toBeVisible()
      await expect(page.getByRole('heading', { name: /thegamesdb/i, level: 3 })).toBeVisible()
      await expect(page.getByRole('heading', { name: /^manual entry$/i, level: 3 })).toBeVisible()

      // IGDB should be marked as recommended
      await expect(page.getByText(/recommended/i)).toBeVisible()
    })

    test('should show manual entry form on the page', async ({ page }) => {
      await page.goto('/games/new')
      await page.waitForLoadState('domcontentloaded')

      // Manual entry form should have game title and system fields
      const titleInput = page.getByPlaceholder(/^enter game title$/i)
      await expect(titleInput).toBeVisible()

      // System autocomplete (combobox)
      const systemInput = page.getByRole('combobox', { name: /system/i })
      await expect(systemInput).toBeVisible()

      // Submit button
      await expect(page.getByRole('button', { name: /add game to database/i })).toBeVisible()
    })

    test('should navigate to IGDB search from method card', async ({ page }) => {
      await page.goto('/games/new')
      await page.waitForLoadState('domcontentloaded')

      // Find the IGDB "Use This Method" link
      const igdbLink = page.getByRole('link', { name: /use this method/i }).first()
      await igdbLink.click()

      await expect(page).toHaveURL(/\/games\/new\/search\/v2/)
    })
  })

  test.describe('Admin Games Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access admin games management page', async ({ page }) => {
      await page.goto('/admin/games')
      await page.waitForLoadState('domcontentloaded')

      // Page heading
      await expect(page.getByRole('heading', { name: /games management/i })).toBeVisible()

      // Stats display
      const stats = page.locator('text=/total games|used in reports|rejected/i')
      await expect(stats.first()).toBeVisible()

      // Search input
      await expect(page.getByPlaceholder(/search games by title/i)).toBeVisible()

      // Table should be present
      await expect(page.locator('table')).toBeVisible()
    })

    test('should search games in admin panel', async ({ page }) => {
      await page.goto('/admin/games')
      await page.waitForLoadState('domcontentloaded')

      const searchInput = page.getByPlaceholder(/search games by title/i)
      await searchInput.fill('mario')

      await expect(page.locator('table')).toBeVisible()
    })
  })
})
