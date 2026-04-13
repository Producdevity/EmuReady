import { test, expect } from '@playwright/test'
import { GameFormPage } from './pages/GameFormPage'
import { GamesPage } from './pages/GamesPage'

test.describe('Game Management', () => {
  test.describe('Public Games Page', () => {
    test('should display games library heading and search input', async ({ page }) => {
      const gamesPage = new GamesPage(page)
      await gamesPage.goto()

      await expect(gamesPage.pageHeading).toBeVisible()
      await expect(page.getByPlaceholder(/search games/i)).toBeVisible()
    })

    test('should display game cards', async ({ page }) => {
      const gamesPage = new GamesPage(page)
      await gamesPage.goto()

      const gameCards = page.locator('a[href^="/games/"]').filter({
        has: page.locator('h2'),
      })

      await expect(gameCards.first()).toBeVisible()
      const count = await gameCards.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should search games by title', async ({ page }) => {
      const gamesPage = new GamesPage(page)
      await gamesPage.goto()

      const searchInput = page.getByPlaceholder(/search games/i)
      await searchInput.fill('test')

      await expect(page).toHaveURL(/search=test/)
    })

    test('should navigate to game detail page', async ({ page }) => {
      const gamesPage = new GamesPage(page)
      await gamesPage.goto()

      const gameCards = page.locator('a[href^="/games/"]').filter({
        has: page.locator('h2'),
      })
      await expect(gameCards.first()).toBeVisible()

      await gameCards.first().click()

      await expect(page).toHaveURL(/\/games\//)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Game Detail Page', () => {
    test('should display game information', async ({ page }) => {
      const gamesPage = new GamesPage(page)
      await gamesPage.goto()

      const gameCards = page.locator('a[href^="/games/"]').filter({
        has: page.locator('h2'),
      })
      await expect(gameCards.first()).toBeVisible()

      const href = await gameCards.first().getAttribute('href')
      expect(href).toBeTruthy()

      await page.goto(href!)
      await page.waitForLoadState('domcontentloaded')

      await expect(page).toHaveURL(/\/games\/[^/]+/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Game Creation Page', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should display add new game page with method selection', async ({ page }) => {
      const gameForm = new GameFormPage(page)
      await gameForm.goto()

      await expect(gameForm.pageHeading).toBeVisible()

      await expect(page.getByRole('heading', { name: /igdb search/i, level: 3 })).toBeVisible()
      await expect(page.getByRole('heading', { name: /thegamesdb/i, level: 3 })).toBeVisible()
      await expect(page.getByRole('heading', { name: /^manual entry$/i, level: 3 })).toBeVisible()

      await expect(page.getByText(/recommended/i)).toBeVisible()
    })

    test('should show manual entry form on the page', async ({ page }) => {
      const gameForm = new GameFormPage(page)
      await gameForm.goto()

      await expect(page.getByPlaceholder(/^enter game title$/i)).toBeVisible()
      await expect(page.getByRole('combobox', { name: /system/i })).toBeVisible()
      await expect(gameForm.submitButton).toBeVisible()
    })

    test('should navigate to IGDB search from method card', async ({ page }) => {
      const gameForm = new GameFormPage(page)
      await gameForm.goto()

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

      await expect(page.getByRole('heading', { name: /games management/i })).toBeVisible()

      const stats = page.locator('text=/total games|used in reports|rejected/i')
      await expect(stats.first()).toBeVisible()

      await expect(page.getByPlaceholder(/search games by title/i)).toBeVisible()
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
