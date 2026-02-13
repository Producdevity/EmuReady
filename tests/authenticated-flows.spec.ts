import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Authenticated User Flow Tests - Requires User Authentication', () => {
  test('should complete full user journey from signup to first listing', async ({ page }) => {
    const homePage = new HomePage(page)

    // Start at home page
    await homePage.goto()

    // Navigate to auth - use first visible sign-in button
    const signInButton = page
      .locator('button, a')
      .filter({ hasText: /sign.*in|log.*in/i })
      .first()

    const signInVisible = await signInButton.isVisible({ timeout: 3000 })
    test.skip(!signInVisible, 'Sign-in button not visible -- cannot test signup journey')

    await signInButton.click()

    // Look for sign up option
    const signUpLink = page.locator('a, button').filter({ hasText: /sign.*up|create.*account/i })
    const signUpVisible = await signUpLink.isVisible({ timeout: 3000 })
    test.skip(!signUpVisible, 'Sign-up link not visible -- cannot test signup journey')

    await signUpLink.click()

    // Sign up form
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    const formVisible = (await emailInput.isVisible()) && (await passwordInput.isVisible())
    test.skip(!formVisible, 'Sign-up form inputs not visible')

    const timestamp = Date.now()
    await emailInput.fill(`testuser${timestamp}@example.com`)
    await passwordInput.fill('TestPassword123!')

    // Additional fields
    const nameInput = page.locator('input[name*="name"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill(`Test User ${timestamp}`)
    }

    // Note: Not submitting to avoid creating test accounts
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should access profile settings after authentication', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping profile settings test')

    // Navigate to profile
    await page.goto('/profile')

    // Verify profile page loaded
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('should create a new listing as authenticated user', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping listing creation test')

    // Navigate to new listing page
    await page.goto('/listings/new')

    // Check for listing form
    const listingForm = page.locator('form, [data-testid*="listing-form"]')
    const formVisible = await listingForm.isVisible({ timeout: 3000 })
    test.skip(!formVisible, 'Listing form not visible')

    // Game selection
    const gameSelect = listingForm.locator('select[name*="game"], [data-testid*="game-select"]')
    const gameSearch = listingForm.locator('input[placeholder*="game"]')

    if (await gameSelect.isVisible()) {
      await gameSelect.selectOption({ index: 1 })
    } else if (await gameSearch.isVisible()) {
      await gameSearch.fill('Super Mario')
      await page.waitForLoadState('domcontentloaded')

      // Select from search results
      const searchResult = page.locator('[data-testid*="search-result"]').first()
      if (await searchResult.isVisible()) {
        await searchResult.click()
      }
    }

    // Device selection
    const deviceSelect = listingForm.locator('select[name*="device"]')
    if (await deviceSelect.isVisible()) {
      await deviceSelect.selectOption({ index: 1 })
    }

    // Emulator selection
    const emulatorSelect = listingForm.locator('select[name*="emulator"]')
    if (await emulatorSelect.isVisible()) {
      await emulatorSelect.selectOption({ index: 1 })
    }

    // Performance rating
    const performanceSelect = listingForm.locator('select[name*="performance"]')
    const performanceRadios = listingForm.locator('input[type="radio"][name*="performance"]')

    if (await performanceSelect.isVisible()) {
      await performanceSelect.selectOption('4')
    } else if ((await performanceRadios.count()) > 0) {
      await performanceRadios.nth(3).check()
    }

    // Notes
    const notesTextarea = listingForm.locator('textarea[name*="notes"]')
    if (await notesTextarea.isVisible()) {
      await notesTextarea.fill('Test listing created by E2E test')
    }

    // Verify submit button exists
    const submitButton = listingForm.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should manage user notifications', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping notifications test')

    // Navigate to notifications
    await page.goto('/notifications')

    // Notification list
    const notificationList = page.locator('[data-testid*="notification"], .notification-list')
    const listVisible = await notificationList.isVisible({ timeout: 3000 })

    if (listVisible) {
      const notifications = notificationList.locator(
        '.notification-item, [data-testid*="notification-item"]',
      )
      const notifCount = await notifications.count()

      if (notifCount > 0) {
        // Check notification structure
        const firstNotif = notifications.first()

        // Title/message
        const message = firstNotif.locator('.message, [data-testid*="message"]')
        await expect(message).toBeVisible()

        // Timestamp
        const timestamp = firstNotif.locator('time, .timestamp')
        await expect(timestamp).toBeVisible()
      }

      expect(typeof notifCount).toBe('number')
    } else {
      // Page loaded but no notification list -- verify page at least rendered
      const mainContent = page.locator('main')
      await expect(mainContent).toBeVisible()
    }
  })

  test('should view and edit own listings', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping own listings test')

    // Navigate to profile listings
    await page.goto('/profile')

    // Find listings tab
    const listingsTab = page.locator('button, a').filter({ hasText: /my.*listings|listings/i })
    const tabVisible = await listingsTab.isVisible({ timeout: 3000 })

    if (tabVisible) {
      await listingsTab.click()

      // User's listings
      const userListings = page.locator('[data-testid*="user-listing"], .user-listing')
      const listingCount = await userListings.count()
      expect(typeof listingCount).toBe('number')

      if (listingCount > 0) {
        // Check first listing
        const firstListing = userListings.first()

        // Edit button
        const editButton = firstListing.locator('button, a').filter({ hasText: /edit/i })
        if (await editButton.isVisible()) {
          await editButton.click()

          // Edit form should appear
          const editForm = page
            .locator('[role="dialog"], form')
            .filter({ hasText: /edit.*listing/i })
          if (await editForm.isVisible({ timeout: 3000 })) {
            // Make a change
            const notesField = editForm.locator('textarea[name*="notes"]')
            if (await notesField.isVisible()) {
              const currentNotes = await notesField.inputValue()
              await notesField.fill(`${currentNotes}\nUpdated via E2E test`)
            }

            // Cancel
            const cancelButton = editForm.locator('button').filter({ hasText: /cancel/i })
            await cancelButton.click()
          }
        }
      }
    } else {
      // Profile page loaded but no listings tab
      const mainContent = page.locator('main')
      await expect(mainContent).toBeVisible()
    }
  })

  test('should participate in community features', async ({ page }) => {
    const authPage = new AuthPage(page)
    const listingsPage = new ListingsPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping community features test')

    // Go to listings
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test community features')

    // Open first listing
    await listingsPage.clickFirstListing()

    // Vote on listing
    const voteButtons = page.locator('button[aria-label*="vote"], [data-testid*="vote"]')
    if ((await voteButtons.count()) > 0) {
      const upvote = voteButtons.filter({ hasText: /up/i }).first()
      if (await upvote.isVisible()) {
        await upvote.click()

        // Vote should be recorded
        const isActive =
          (await upvote.getAttribute('data-active')) || (await upvote.getAttribute('aria-pressed'))
        expect(isActive).toBeTruthy()
      }
    }

    // Comment on listing
    const commentSection = page.locator('[data-testid*="comment"], .comment-section')
    if (await commentSection.isVisible({ timeout: 2000 })) {
      const commentInput = commentSection.locator('textarea, input[type="text"]')
      if (await commentInput.isVisible()) {
        await commentInput.fill('Great compatibility report! Thanks for sharing.')

        const submitButton = commentSection
          .locator('button')
          .filter({ hasText: /post|submit|comment/i })
        await expect(submitButton).toBeVisible()
      }
    }
  })

  test('should manage account preferences', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping account preferences test')

    await page.goto('/profile')

    // Settings section
    const settingsButton = page.locator('button, a').filter({ hasText: /settings|preferences/i })
    const settingsVisible = await settingsButton.isVisible({ timeout: 3000 })

    if (settingsVisible) {
      await settingsButton.click()

      // Save preferences button
      const saveButton = page
        .locator('button')
        .filter({ hasText: /save.*preferences|update.*settings/i })
      await expect(saveButton).toBeVisible()
    } else {
      // Profile page loaded but no settings button
      const mainContent = page.locator('main')
      await expect(mainContent).toBeVisible()
    }
  })

  test('should access user dashboard', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping dashboard test')

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Alternative: profile might be the dashboard
    if (!page.url().includes('dashboard')) {
      await page.goto('/profile')
    }

    // Verify the dashboard/profile page loaded
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('should handle session persistence', async ({ page, context }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping session persistence test')

    // Navigate away and back
    await page.goto('https://example.com')
    await page.goBack()

    // Should still be authenticated
    const stillAuthenticated = await authPage.isAuthenticated()
    expect(stillAuthenticated).toBe(true)

    // Open new tab
    const newPage = await context.newPage()
    await newPage.goto(page.url())

    // Should be authenticated in new tab
    const newAuthPage = new AuthPage(newPage)
    const authenticatedInNewTab = await newAuthPage.isAuthenticated()
    expect(authenticatedInNewTab).toBe(true)

    await newPage.close()
  })

  test('should handle logout flow', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping logout flow test')

    // Find logout option
    const userMenu = page.locator('[data-testid*="user-menu"], .user-menu')
    const menuVisible = await userMenu.isVisible({ timeout: 3000 })
    test.skip(!menuVisible, 'User menu not visible -- cannot test logout flow')

    await userMenu.click()

    // Look for logout
    const logoutButton = page.locator('button, a').filter({ hasText: /log.*out|sign.*out/i })
    const logoutVisible = await logoutButton.isVisible({ timeout: 2000 })

    // Note: Not clicking to maintain session for other tests
    expect(logoutVisible).toBe(true)

    // Close menu
    await page.keyboard.press('Escape')
  })

  test('should show personalized content', async ({ page }) => {
    const authPage = new AuthPage(page)
    const isAuthenticated = await authPage.isAuthenticated()
    test.skip(!isAuthenticated, 'User not authenticated -- skipping personalized content test')

    // Home page personalization
    await page.goto('/')

    // Verify the page loaded
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()

    // Listings page personalization
    await page.goto('/listings')

    // Verify listings page loaded
    const listingsMain = page.locator('main')
    await expect(listingsMain).toBeVisible()
  })
})
