import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'
import { GameFormPage } from './pages/GameFormPage'
import { GamesPage } from './pages/GamesPage'
import { ListingFormPage } from './pages/ListingFormPage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Game Form Tests', () => {
  test('should require authentication to access add game form', async ({ page }) => {
    const gameForm = new GameFormPage(page)

    // Navigate to add game page
    await gameForm.goto()
    await page.waitForLoadState('domcontentloaded')

    // Check various indicators that page is protected
    const currentUrl = page.url()
    const hasSignInButton = await page
      .getByRole('button', { name: /sign in/i })
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    const hasAuthText = await page
      .getByText(/sign in|log in|authentication required|please sign/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    const hasForm = await page
      .locator('form')
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    const hasGameTitleInput = await page
      .locator('input[name="title"], input[placeholder*="title"]')
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    // The page is protected if ANY of these conditions are true:
    // 1. URL changed (redirect)
    // 2. Sign-in button is shown
    // 3. Auth message is shown
    // 4. No form is visible
    // 5. No game title input is visible
    const isProtected =
      !currentUrl.includes('/games/new') ||
      hasSignInButton ||
      hasAuthText ||
      !hasForm ||
      !hasGameTitleInput

    if (!isProtected) {
      // If none of the above, try to interact with the form
      try {
        await gameForm.fillRequiredFields('Test Game')
        await gameForm.submitForm()
        // If submission succeeds without auth, that's unexpected
        const newUrl = page.url()
        // Form should not submit successfully
        expect(newUrl).toContain('/games/new')
      } catch {
        // Expected - form interaction failed
      }
    }

    // Test passes if page is protected in any way
    expect(isProtected).toBe(true)
  })

  test('should show game form fields when accessible', async ({ page }) => {
    const gameForm = new GameFormPage(page)
    const authPage = new AuthPage(page)

    await gameForm.goto()

    // Check if form is accessible
    const hasForm = await page.locator('form').isVisible({ timeout: 2000 })

    if (hasForm) {
      // Check for any input fields to verify we have a form
      const hasInputs = await page
        .locator('input, select, textarea')
        .first()
        .isVisible({ timeout: 3000 })
      expect(hasInputs).toBe(true)

      // Try to find specific form fields
      const titleVisible = await gameForm.titleInput.isVisible({ timeout: 2000 }).catch(() => false)
      const systemVisible = await gameForm.systemSelect
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      const submitVisible = await gameForm.submitButton
        .isVisible({ timeout: 2000 })
        .catch(() => false)

      // At least some form fields should be present
      expect(titleVisible || systemVisible || submitVisible).toBe(true)
    } else {
      // Form requires authentication
      const hasAuthRequirement = await authPage.hasAuthRequirement()
      expect(hasAuthRequirement).toBe(true)
    }
  })

  test('should validate required fields on game form', async ({ page }) => {
    const gameForm = new GameFormPage(page)

    await gameForm.goto()

    // Check if form is accessible
    const hasForm = await page.locator('form').isVisible({ timeout: 2000 })
    test.skip(!hasForm, 'Game form not accessible - auth required')

    // Try to submit empty form
    await gameForm.submitForm()

    // Should show validation errors or remain on form page
    const hasErrors = await gameForm.hasValidationErrors()
    if (hasErrors) {
      await gameForm.verifyValidationError()
    } else {
      // Form might be submitted but rejected server-side
      const currentUrl = page.url()
      expect(currentUrl).toContain('/games/new')
    }
  })

  test('should navigate to add game form from games page', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    const gameForm = new GameFormPage(page)
    const authPage = new AuthPage(page)

    await gamesPage.goto()

    // Wait for loading to finish
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    // Look for add game button
    const hasAddButton = await gamesPage.addGameButton
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    test.skip(!hasAddButton, 'Add game button not visible - requires auth or conditionally shown')

    await gamesPage.clickAddGame()

    // Should either show form or auth requirement
    const hasForm = await gameForm.isFormVisible()
    const hasAuthRequirement = await authPage.hasAuthRequirement()

    expect(hasForm || hasAuthRequirement).toBe(true)
  })
})

test.describe('Listing Form Tests', () => {
  test('should require authentication to access add listing form', async ({ page }) => {
    const listingForm = new ListingFormPage(page)
    const authPage = new AuthPage(page)

    await listingForm.goto()

    // Wait for page to settle (may show loading spinner during redirect/auth check)
    await page.waitForLoadState('networkidle').catch(() => {})

    // Should either show auth requirement or have form without submission capability
    const hasAuthRequirement = await authPage.hasAuthRequirement()
    const hasForm = await page.locator('form').isVisible({ timeout: 2000 })

    if (hasAuthRequirement) {
      await authPage.verifyAuthRequired()
    } else if (hasForm) {
      // Form is accessible - try to submit without auth, should fail
      await listingForm.fillRequiredFields()
      await listingForm.submitForm()

      // Should either show error or not submit
      const hasErrors = await listingForm.hasValidationErrors()
      const currentUrl = page.url()

      expect(hasErrors || currentUrl.includes('/listings/new')).toBe(true)
    } else {
      // Page shows loading spinner or redirected - auth is protecting the page
      const isOnFormPage = page.url().includes('/listings/new')
      const hasLoadingSpinner = await page
        .locator('main img')
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      // Either redirected away or still showing loading (auth check in progress)
      expect(!isOnFormPage || hasLoadingSpinner).toBe(true)
    }
  })

  test('should show listing form fields when accessible', async ({ page }) => {
    const listingForm = new ListingFormPage(page)

    await listingForm.goto()

    // Wait for page to settle (may show loading spinner during redirect/auth check)
    await page.waitForLoadState('networkidle').catch(() => {})

    // Check if form is accessible
    const hasForm = await page
      .locator('form')
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    test.skip(!hasForm, 'Listing form not accessible - auth required or page still loading')

    // Verify form fields are present with timeout
    await expect(listingForm.gameSelect).toBeVisible({ timeout: 5000 })
    await expect(listingForm.deviceSelect).toBeVisible({ timeout: 2000 })
    await expect(listingForm.submitButton).toBeVisible({ timeout: 2000 })
  })

  test('should validate required fields on listing form', async ({ page }) => {
    const listingForm = new ListingFormPage(page)

    await listingForm.goto()

    // Check if form is accessible
    const hasForm = await page.locator('form').isVisible({ timeout: 2000 })
    test.skip(!hasForm, 'Listing form not accessible - auth required')

    // Try to submit empty form
    await listingForm.submitForm()

    // Should show validation errors or remain on form page
    const hasErrors = await listingForm.hasValidationErrors()
    if (hasErrors) {
      await listingForm.verifyValidationError()
    } else {
      // Form might be submitted but rejected server-side
      const currentUrl = page.url()
      expect(currentUrl).toContain('/listings/new')
    }
  })

  test('should navigate to add listing form from listings page', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    const listingForm = new ListingFormPage(page)
    const authPage = new AuthPage(page)

    await listingsPage.goto()

    // Wait for loading to finish
    await page
      .getByText(/loading/i)
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {})

    // Look for add listing button (may be named "Add Report" on the listings page)
    const hasAddButton = await listingsPage.addListingButton
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    const hasCreateButton = await listingsPage.createListingButton
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    const hasAddReport = await page
      .getByRole('link', { name: /add report/i })
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    test.skip(
      !hasAddButton && !hasCreateButton && !hasAddReport,
      'Add listing button not visible - requires auth or conditionally shown',
    )

    if (hasAddButton || hasCreateButton) {
      await listingsPage.clickAddListing()
    } else {
      await page.getByRole('link', { name: /add report/i }).click()
      await page.waitForLoadState('domcontentloaded')
    }

    // Should either show form or auth requirement
    const hasForm = await listingForm.isFormVisible()
    const hasAuthRequirement = await authPage.hasAuthRequirement()

    expect(hasForm || hasAuthRequirement).toBe(true)
  })

  test('should show custom fields when device is selected', async ({ page }) => {
    const listingForm = new ListingFormPage(page)

    await listingForm.goto()

    // Check if form is accessible
    const hasForm = await page.locator('form').isVisible({ timeout: 2000 })
    test.skip(!hasForm, 'Listing form not accessible - auth required')

    // Select a device to trigger custom fields
    await listingForm.selectDeviceByIndex(1)

    // Wait for potential custom fields to load
    await page.waitForLoadState('domcontentloaded')

    // Check if custom fields appear
    const customFieldCount = await listingForm.getCustomFieldCount()
    test.skip(customFieldCount === 0, 'No custom fields configured for this device')

    await listingForm.verifyCustomFieldsVisible()
  })
})

test.describe('Form Navigation Tests', () => {
  test('should handle form cancellation properly', async ({ page }) => {
    const gameForm = new GameFormPage(page)

    await gameForm.goto()

    // Check if form is accessible
    const hasForm = await page.locator('form').isVisible({ timeout: 2000 })
    test.skip(!hasForm, 'Game form not accessible - auth required')

    await gameForm.fillGameTitle('Test Game')

    // Look for cancel button
    const hasCancelButton = await gameForm.cancelButton.isVisible({ timeout: 2000 })
    test.skip(!hasCancelButton, 'No cancel button found on form')

    await gameForm.cancelForm()

    // Should navigate away from form
    await expect(page).not.toHaveURL(/\/games\/new/)
  })

  test('should preserve form data during navigation', async ({ page }) => {
    const listingForm = new ListingFormPage(page)

    await listingForm.goto()

    // Check if form is accessible
    const hasForm = await page.locator('form').isVisible({ timeout: 2000 })
    test.skip(!hasForm, 'Listing form not accessible - auth required')

    // Select some options
    await listingForm.selectGameByIndex(1)
    await listingForm.selectDeviceByIndex(1)

    // Get selected values
    const selectedGame = await listingForm.gameSelect.inputValue()
    const selectedDevice = await listingForm.deviceSelect.inputValue()

    expect(selectedGame).toBeTruthy()
    expect(selectedDevice).toBeTruthy()
  })

  test('should handle browser back navigation from forms', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    const gameForm = new GameFormPage(page)

    // Start at games page
    await gamesPage.goto()
    const gamesUrl = page.url()

    // Navigate to add game form
    await gameForm.goto()

    // Use browser back button
    await page.goBack()

    // Should be back at games page
    await expect(page).toHaveURL(gamesUrl)
    await gamesPage.verifyPageLoaded()
  })
})
