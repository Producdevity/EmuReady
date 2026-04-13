import { test, expect } from '@playwright/test'
import { GameFormPage } from './pages/GameFormPage'
import { GamesPage } from './pages/GamesPage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Game Form - Authentication Required', () => {
  test('should redirect unauthenticated users away from game form', async ({ page }) => {
    await page.goto('/games/new', { waitUntil: 'domcontentloaded' })

    const signInIndicator = page
      .getByRole('button', { name: /sign in/i })
      .or(page.getByText(/sign in|log in|authentication required|please sign/i))
    await expect(signInIndicator.first()).toBeVisible()
  })
})

test.describe('Game Form - Authenticated Admin', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })

  test('should display game form with title, system, and submit', async ({ page }) => {
    const gameForm = new GameFormPage(page)
    await gameForm.goto()

    await expect(gameForm.form).toBeVisible()
    await expect(gameForm.titleInput).toBeVisible()
    await expect(gameForm.systemSelect).toBeVisible()
    await expect(gameForm.submitButton).toBeVisible()
  })

  test('should show validation errors on empty submit', async ({ page }) => {
    const gameForm = new GameFormPage(page)
    await gameForm.goto()

    await expect(gameForm.form).toBeVisible()
    await gameForm.submitForm()

    await expect(gameForm.errorMessages.first()).toBeVisible()
  })

  test('should navigate to game form from games page', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    const gameForm = new GameFormPage(page)

    await gamesPage.goto()

    await expect(gamesPage.addGameButton).toBeVisible()
    await gamesPage.clickAddGame()

    await expect(gameForm.form).toBeVisible()
    await expect(gameForm.titleInput).toBeVisible()
  })
})

test.describe('Listing Form - Authentication Required', () => {
  test('should require authentication to access listing form', async ({ page }) => {
    await page.goto('/listings/new', { waitUntil: 'domcontentloaded' })

    const signInIndicator = page
      .getByText(/you need to be logged in|please sign in|sign in required/i)
      .or(page.locator('main').getByRole('button', { name: /sign in/i }))
    await expect(signInIndicator.first()).toBeVisible()
  })
})

test.describe('Listing Form - Authenticated User', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/listings/new', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: /create.*handheld.*compatibility.*report/i }),
    ).toBeVisible()
  })

  test('should display listing form fields', async ({ page }) => {
    await expect(page.getByPlaceholder(/search for a game/i)).toBeVisible()
    await expect(page.getByPlaceholder(/search for a device/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /create compatibility report/i })).toBeVisible()
  })

  test('should show validation errors on empty submit', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /create compatibility report/i })
    await submitBtn.click()

    const errorIndicator = page
      .locator('.error, [role="alert"], .text-red-500, .text-destructive')
      .first()
    await expect(errorIndicator).toBeVisible()
  })

  test('should populate game autocomplete options on search', async ({ page }) => {
    const gameInput = page.getByPlaceholder(/search for a game/i)
    await gameInput.click()
    await gameInput.fill('Mario')

    const listbox = page.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()

    const options = listbox.locator('[role="option"]')
    await expect(options.first()).toBeVisible()
  })

  test('should show selected game after picking from autocomplete', async ({ page }) => {
    const gameInput = page.getByPlaceholder(/search for a game/i)
    await gameInput.click()
    await gameInput.fill('Mario')

    const listbox = page.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()
    await listbox.locator('[role="option"]').first().click()

    await expect(page.getByText(/mario/i).first()).toBeVisible()
  })

  test('should populate device autocomplete options on search', async ({ page }) => {
    const deviceInput = page.getByPlaceholder(/search for a device/i)
    await deviceInput.click()
    await deviceInput.fill('Rog')

    const listbox = page.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()

    const options = listbox.locator('[role="option"]')
    await expect(options.first()).toBeVisible()
  })
})

test.describe('Listing Form - Navigation', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('should navigate to listing form from listings page', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.addReportButton).toBeVisible()

    await listingsPage.addReportButton.click()
    await expect(
      page.getByRole('heading', { name: /create.*handheld.*compatibility.*report/i }),
    ).toBeVisible()
  })

  test('should handle browser back navigation from form', async ({ page }) => {
    const gamesPage = new GamesPage(page)

    await gamesPage.goto()
    const gamesUrl = page.url()

    await page.goto('/listings/new', { waitUntil: 'domcontentloaded' })
    await page.goBack()

    await expect(page).toHaveURL(gamesUrl)
    await gamesPage.verifyPageLoaded()
  })
})
