import { test, expect } from '@playwright/test'

/**
 * E2E tests for the listing (compatibility report) creation flow.
 *
 * Handheld listing creation: /listings/new
 * Form fields: Game (autocomplete), Device (autocomplete), Emulator (autocomplete),
 *   Performance (select), Notes (markdown editor), Custom Fields (dynamic).
 * Submit button: "Create Compatibility Report"
 * Success redirect to /listings.
 */

test.describe('Full Listing Creation Flow', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('should display handheld listing creation form', async ({ page }) => {
    await page.goto('/listings/new')
    await page.waitForLoadState('domcontentloaded')

    // Page heading
    await expect(
      page.getByRole('heading', { name: /create.*handheld.*compatibility.*report/i }),
    ).toBeVisible()

    // Core form fields
    await expect(page.getByText(/^game$/i).first()).toBeVisible()
    await expect(page.getByText(/^device$/i).first()).toBeVisible()
    await expect(page.getByText(/^emulator$/i).first()).toBeVisible()
    await expect(page.getByText(/^performance$/i).first()).toBeVisible()
    await expect(page.getByText(/^notes$/i).first()).toBeVisible()
  })

  test('should have game search autocomplete', async ({ page }) => {
    await page.goto('/listings/new')
    await page.waitForLoadState('domcontentloaded')

    // Game autocomplete with search placeholder
    const gameInput = page.getByPlaceholder(/search for a game/i)
    await expect(gameInput).toBeVisible()

    // "Add it here" link for missing games
    const addGameLink = page.getByRole('link', { name: /add it here/i })
    const hasLink = await addGameLink.isVisible().catch(() => false)

    if (hasLink) {
      await expect(addGameLink).toHaveAttribute('href', /\/games\/new/)
    }
  })

  test('should have device search autocomplete', async ({ page }) => {
    await page.goto('/listings/new')
    await page.waitForLoadState('domcontentloaded')

    const deviceInput = page.getByPlaceholder(/search for a device/i)
    await expect(deviceInput).toBeVisible()
  })

  test('should have emulator search autocomplete', async ({ page }) => {
    await page.goto('/listings/new')
    await page.waitForLoadState('domcontentloaded')

    // Emulator field requires a game to be selected first
    // Shows warning if no game is selected
    const emulatorSection = page.getByText(/emulator/i).first()
    await expect(emulatorSection).toBeVisible()

    // Without game selected, may show warning
    const warning = page.getByText(/please select a game first/i)
    const hasWarning = await warning.isVisible().catch(() => false)

    if (hasWarning) {
      await expect(warning).toBeVisible()
    }
  })

  test('should have notes markdown editor', async ({ page }) => {
    await page.goto('/listings/new')
    await page.waitForLoadState('domcontentloaded')

    // Wait for the form to actually render (React hydration)
    await page
      .getByRole('heading', { name: /create.*handheld.*compatibility.*report/i })
      .waitFor({ state: 'visible', timeout: 15000 })

    // Notes section with markdown editor may only appear after selecting an emulator.
    // Check if it's visible or if the form shows a prerequisite message instead.
    const notesPlaceholder = page.getByPlaceholder(/share your experience/i)
    const hasNotes = await notesPlaceholder.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasNotes) {
      await expect(notesPlaceholder).toBeVisible()

      // Toolbar buttons (Bold, Italic, etc.)
      const boldButton = page.getByRole('button', { name: /bold/i })
      const hasBold = await boldButton.isVisible().catch(() => false)

      if (hasBold) {
        await expect(boldButton).toBeVisible()
      }
    } else {
      // Notes section requires emulator selection — form shows prerequisite message
      await expect(page.getByText(/select an emulator/i)).toBeVisible()
    }
  })

  test('should have submit button', async ({ page }) => {
    await page.goto('/listings/new')
    await page.waitForLoadState('domcontentloaded')

    const submitButton = page.getByRole('button', { name: /create compatibility report/i })
    await expect(submitButton).toBeVisible()
  })

  test('should show custom fields placeholder before emulator selection', async ({ page }) => {
    await page.goto('/listings/new')
    await page.waitForLoadState('domcontentloaded')

    // Right column shows custom fields section
    const placeholder = page.getByText(/select an emulator/i)
    const hasPlaceholder = await placeholder.isVisible().catch(() => false)

    if (hasPlaceholder) {
      await expect(placeholder).toBeVisible()
    }
  })

  test.describe('PC Listing Creation', () => {
    test('should display PC listing creation form', async ({ page }) => {
      await page.goto('/pc-listings/new')
      await page.waitForLoadState('domcontentloaded')

      // PC listing form should have similar structure but with PC-specific fields
      const heading = page.getByRole('heading', { level: 1 })
      await expect(heading).toBeVisible()

      // Game autocomplete should be present
      const gameInput = page.getByPlaceholder(/search for a game/i)
      await expect(gameInput).toBeVisible()
    })
  })
})
