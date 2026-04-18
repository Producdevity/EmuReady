import { test, expect } from '@playwright/test'

test.describe('Handheld Listing Creation Form', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/listings/new', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: /create.*handheld.*compatibility.*report/i }),
    ).toBeVisible()
  })

  test('should display the form heading and core field labels', async ({ page }) => {
    await expect(page.getByText(/^game$/i).first()).toBeVisible()
    await expect(page.getByText(/^device$/i).first()).toBeVisible()
    await expect(page.getByText(/^emulator$/i).first()).toBeVisible()
    await expect(page.getByText(/^performance$/i).first()).toBeVisible()
    await expect(page.getByText(/^notes$/i).first()).toBeVisible()
  })

  test('should have game search autocomplete and add-game link', async ({ page }) => {
    const gameInput = page.getByPlaceholder(/search for a game/i)
    await expect(gameInput).toBeVisible()

    const addGameLink = page.getByRole('link', { name: /add it here/i })
    await expect(addGameLink).toBeVisible()
    await expect(addGameLink).toHaveAttribute('href', /\/games\/new/)
  })

  test('should have device search autocomplete', async ({ page }) => {
    const deviceInput = page.getByPlaceholder(/search for a device/i)
    await expect(deviceInput).toBeVisible()
  })

  test('should show emulator prerequisite warning before game selection', async ({ page }) => {
    await expect(page.getByText(/please select a game first/i)).toBeVisible()
  })

  test('should show custom fields placeholder before emulator selection', async ({ page }) => {
    await expect(page.getByText(/select an emulator/i)).toBeVisible()
  })

  test('should have notes section with markdown editor', async ({ page }) => {
    const notesPlaceholder = page.getByPlaceholder(/share your experience/i)
    await expect(notesPlaceholder).toBeVisible()
  })

  test('should have submit button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /create compatibility report/i })
    await expect(submitButton).toBeVisible()
  })
})

test.describe('PC Listing Creation Form', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('should display PC listing form with game search', async ({ page }) => {
    await page.goto('/pc-listings/new', { waitUntil: 'domcontentloaded' })

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    const gameInput = page.getByPlaceholder(/search for a game/i)
    await expect(gameInput).toBeVisible()
  })
})
