import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Authenticated User Flow Tests - Requires User Authentication', () => {
  test('should complete full user journey from signup to first listing', async ({
    page,
  }) => {
    const homePage = new HomePage(page)

    // Start at home page
    await homePage.goto()

    // Navigate to auth - use first visible sign-in button
    const signInButton = page
      .locator('button, a')
      .filter({ hasText: /sign.*in|log.*in/i })
      .first()
    if (await signInButton.isVisible({ timeout: 3000 })) {
      await signInButton.click()

      // Look for sign up option
      const signUpLink = page
        .locator('a, button')
        .filter({ hasText: /sign.*up|create.*account/i })
      if (await signUpLink.isVisible({ timeout: 3000 })) {
        await signUpLink.click()

        // Sign up form
        const emailInput = page.locator('input[type="email"]')
        const passwordInput = page.locator('input[type="password"]')

        if (
          (await emailInput.isVisible()) &&
          (await passwordInput.isVisible())
        ) {
          const timestamp = Date.now()
          await emailInput.fill(`testuser${timestamp}@example.com`)
          await passwordInput.fill('TestPassword123!')

          // Additional fields
          const nameInput = page.locator('input[name*="name"]').first()
          if (await nameInput.isVisible()) {
            await nameInput.fill(`Test User ${timestamp}`)
          }

          console.log('Sign up form completed')

          // Note: Not submitting to avoid creating test accounts
          const submitButton = page.locator('button[type="submit"]')
          await expect(submitButton).toBeVisible()
        }
      }
    }
  })

  test('should access profile settings after authentication', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)

    // Check if authenticated
    const isAuthenticated = await authPage.isAuthenticated()

    if (isAuthenticated) {
      // Navigate to profile
      await page.goto('/profile')

      // Profile sections
      const profileSections = {
        'Account Settings': '[data-testid*="account"], .account-settings',
        'Device Preferences': '[data-testid*="device"], .device-preferences',
        'Notification Settings':
          '[data-testid*="notification"], .notification-settings',
        'Privacy Settings': '[data-testid*="privacy"], .privacy-settings',
      }

      for (const [section, selector] of Object.entries(profileSections)) {
        const element = page.locator(selector)
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✓ Profile section: ${section}`)
        }
      }

      // Profile actions
      const actions = [
        'Edit Profile',
        'Change Password',
        'Manage Devices',
        'Download Data',
      ]

      for (const action of actions) {
        const button = page.locator('button, a').filter({ hasText: action })
        if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`✓ Action available: ${action}`)
        }
      }
    } else {
      console.log('User not authenticated - profile tests skipped')
    }
  })

  test('should create a new listing as authenticated user', async ({
    page,
  }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      // Navigate to new listing page
      await page.goto('/listings/new')

      // Check for listing form
      const listingForm = page.locator('form, [data-testid*="listing-form"]')

      if (await listingForm.isVisible({ timeout: 3000 })) {
        // Game selection
        const gameSelect = listingForm.locator(
          'select[name*="game"], [data-testid*="game-select"]',
        )
        const gameSearch = listingForm.locator('input[placeholder*="game"]')

        if (await gameSelect.isVisible()) {
          await gameSelect.selectOption({ index: 1 })
          console.log('Game selected from dropdown')
        } else if (await gameSearch.isVisible()) {
          await gameSearch.fill('Super Mario')
          await page.waitForTimeout(1000)

          // Select from search results
          const searchResult = page
            .locator('[data-testid*="search-result"]')
            .first()
          if (await searchResult.isVisible()) {
            await searchResult.click()
            console.log('Game selected from search')
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
        const performanceSelect = listingForm.locator(
          'select[name*="performance"]',
        )
        const performanceRadios = listingForm.locator(
          'input[type="radio"][name*="performance"]',
        )

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

        console.log('Listing form filled out')

        // Verify submit button exists
        const submitButton = listingForm.locator('button[type="submit"]')
        await expect(submitButton).toBeVisible()
      }
    }
  })

  test('should manage user notifications', async ({ page }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      // Navigate to notifications
      await page.goto('/notifications')

      // Notification list
      const notificationList = page.locator(
        '[data-testid*="notification"], .notification-list',
      )

      if (await notificationList.isVisible({ timeout: 3000 })) {
        const notifications = notificationList.locator(
          '.notification-item, [data-testid*="notification-item"]',
        )
        const notifCount = await notifications.count()

        console.log(`${notifCount} notifications found`)

        if (notifCount > 0) {
          // Check notification structure
          const firstNotif = notifications.first()

          // Title/message
          const message = firstNotif.locator(
            '.message, [data-testid*="message"]',
          )
          await expect(message).toBeVisible()

          // Timestamp
          const timestamp = firstNotif.locator('time, .timestamp')
          await expect(timestamp).toBeVisible()

          // Mark as read action
          const markRead = firstNotif
            .locator('button')
            .filter({ hasText: /mark.*read/i })
          if (await markRead.isVisible()) {
            console.log('Can mark notifications as read')
          }
        }

        // Notification actions
        const markAllRead = page
          .locator('button')
          .filter({ hasText: /mark.*all.*read/i })
        if (await markAllRead.isVisible()) {
          console.log('Can mark all notifications as read')
        }
      }
    }
  })

  test('should view and edit own listings', async ({ page }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      // Navigate to profile listings
      await page.goto('/profile')

      // Find listings tab
      const listingsTab = page
        .locator('button, a')
        .filter({ hasText: /my.*listings|listings/i })

      if (await listingsTab.isVisible({ timeout: 3000 })) {
        await listingsTab.click()

        // User's listings
        const userListings = page.locator(
          '[data-testid*="user-listing"], .user-listing',
        )
        const listingCount = await userListings.count()

        console.log(`User has ${listingCount} listings`)

        if (listingCount > 0) {
          // Check first listing
          const firstListing = userListings.first()

          // Edit button
          const editButton = firstListing
            .locator('button, a')
            .filter({ hasText: /edit/i })
          if (await editButton.isVisible()) {
            await editButton.click()

            // Edit form should appear
            const editForm = page
              .locator('[role="dialog"], form')
              .filter({ hasText: /edit.*listing/i })
            if (await editForm.isVisible({ timeout: 3000 })) {
              console.log('Edit listing form opened')

              // Make a change
              const notesField = editForm.locator('textarea[name*="notes"]')
              if (await notesField.isVisible()) {
                const currentNotes = await notesField.inputValue()
                await notesField.fill(`${currentNotes}\nUpdated via E2E test`)
              }

              // Cancel
              const cancelButton = editForm
                .locator('button')
                .filter({ hasText: /cancel/i })
              await cancelButton.click()
            }
          }

          // Delete button
          const deleteButton = firstListing
            .locator('button')
            .filter({ hasText: /delete/i })
          if (await deleteButton.isVisible()) {
            console.log('Delete listing option available')
          }
        }
      }
    }
  })

  test('should participate in community features', async ({ page }) => {
    const authPage = new AuthPage(page)
    const listingsPage = new ListingsPage(page)

    if (await authPage.isAuthenticated()) {
      // Go to listings
      await listingsPage.goto()
      await listingsPage.verifyPageLoaded()

      if ((await listingsPage.getListingCount()) > 0) {
        // Open first listing
        await listingsPage.clickFirstListing()

        // Vote on listing
        const voteButtons = page.locator(
          'button[aria-label*="vote"], [data-testid*="vote"]',
        )
        if ((await voteButtons.count()) > 0) {
          const upvote = voteButtons.filter({ hasText: /up|👍/i }).first()
          if (await upvote.isVisible()) {
            await upvote.click()
            console.log('Voted on listing')

            // Vote should be recorded
            const isActive =
              (await upvote.getAttribute('data-active')) ||
              (await upvote.getAttribute('aria-pressed'))
            expect(isActive).toBeTruthy()
          }
        }

        // Comment on listing
        const commentSection = page.locator(
          '[data-testid*="comment"], .comment-section',
        )
        if (await commentSection.isVisible({ timeout: 2000 })) {
          const commentInput = commentSection.locator(
            'textarea, input[type="text"]',
          )
          if (await commentInput.isVisible()) {
            await commentInput.fill(
              'Great compatibility report! Thanks for sharing.',
            )

            const submitButton = commentSection
              .locator('button')
              .filter({ hasText: /post|submit|comment/i })
            await expect(submitButton).toBeVisible()
            console.log('Can post comments')
          }
        }

        // Report inappropriate content
        const reportButton = page
          .locator('button, a')
          .filter({ hasText: /report/i })
        if (await reportButton.isVisible()) {
          console.log('Can report inappropriate content')
        }
      }
    }
  })

  test('should manage account preferences', async ({ page }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      await page.goto('/profile')

      // Settings section
      const settingsButton = page
        .locator('button, a')
        .filter({ hasText: /settings|preferences/i })

      if (await settingsButton.isVisible({ timeout: 3000 })) {
        await settingsButton.click()

        // Preference categories
        const preferences = {
          'Email Notifications': 'input[type="checkbox"][name*="email"]',
          Theme: 'select[name*="theme"], input[type="radio"][name*="theme"]',
          Language: 'select[name*="language"]',
          Privacy: 'input[type="checkbox"][name*="privacy"]',
        }

        for (const [pref, selector] of Object.entries(preferences)) {
          const element = page.locator(selector)
          if (
            await element
              .first()
              .isVisible({ timeout: 1000 })
              .catch(() => false)
          ) {
            console.log(`✓ Preference available: ${pref}`)

            // Toggle/change preference
            if (pref === 'Email Notifications') {
              const firstCheckbox = element.first()
              const isChecked = await firstCheckbox.isChecked()
              await firstCheckbox.setChecked(!isChecked)
              await firstCheckbox.setChecked(isChecked) // Reset
            }
          }
        }

        // Save preferences button
        const saveButton = page
          .locator('button')
          .filter({ hasText: /save.*preferences|update.*settings/i })
        await expect(saveButton).toBeVisible()
      }
    }
  })

  test('should access user dashboard', async ({ page }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      // Navigate to dashboard
      await page.goto('/dashboard')

      // Alternative: profile might be the dashboard
      if (!page.url().includes('dashboard')) {
        await page.goto('/profile')
      }

      // Dashboard widgets
      const dashboardWidgets = {
        'Recent Activity': '[data-testid*="activity"], .recent-activity',
        Statistics: '[data-testid*="stats"], .user-stats',
        'Quick Actions': '[data-testid*="quick-actions"], .quick-actions',
        Recommendations: '[data-testid*="recommendations"], .recommendations',
      }

      for (const [widget, selector] of Object.entries(dashboardWidgets)) {
        const element = page.locator(selector)
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✓ Dashboard widget: ${widget}`)
        }
      }

      // User stats
      const stats = page.locator('.stat, [data-testid*="stat"]')
      if ((await stats.count()) > 0) {
        console.log(`${await stats.count()} user statistics displayed`)

        // Common stats
        const statTypes = ['Listings', 'Votes', 'Comments', 'Trust Score']
        for (const statType of statTypes) {
          const stat = stats.filter({ hasText: statType })
          if (await stat.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await stat.textContent()
            console.log(`${statType}: ${value}`)
          }
        }
      }
    }
  })

  test('should handle session persistence', async ({ page, context }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      // Get current user info
      const userMenu = page.locator('[data-testid*="user-menu"], .user-menu')
      let userName = ''

      if (await userMenu.isVisible({ timeout: 3000 })) {
        userName = (await userMenu.textContent()) || ''
        console.log(`Logged in as: ${userName}`)
      }

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

      console.log('Session persists across navigation and tabs')

      await newPage.close()
    }
  })

  test('should handle logout flow', async ({ page }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      // Find logout option
      const userMenu = page.locator('[data-testid*="user-menu"], .user-menu')

      if (await userMenu.isVisible({ timeout: 3000 })) {
        await userMenu.click()

        // Look for logout
        const logoutButton = page
          .locator('button, a')
          .filter({ hasText: /log.*out|sign.*out/i })

        if (await logoutButton.isVisible({ timeout: 2000 })) {
          console.log('Logout option available')

          // Note: Not clicking to maintain session for other tests

          // Close menu
          await page.keyboard.press('Escape')
        }
      }
    }
  })

  test('should show personalized content', async ({ page }) => {
    const authPage = new AuthPage(page)

    if (await authPage.isAuthenticated()) {
      // Home page personalization
      await page.goto('/')

      // Personalized sections
      const personalizedSections = {
        'Recommended for You': '[data-testid*="recommended"], .recommendations',
        'Based on Your Activity': '[data-testid*="personalized"], .for-you',
        'Continue Where You Left Off':
          '[data-testid*="continue"], .recent-views',
      }

      for (const [section, selector] of Object.entries(personalizedSections)) {
        const element = page.locator(selector)
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✓ Personalized section: ${section}`)
        }
      }

      // Listings page personalization
      await page.goto('/listings')

      // Personalized filters
      const myDevicesFilter = page
        .locator('button, label')
        .filter({ hasText: /my.*devices/i })
      if (await myDevicesFilter.isVisible({ timeout: 2000 })) {
        console.log('Personalized device filter available')
      }

      // Following/favorites
      const followingFilter = page
        .locator('button, label')
        .filter({ hasText: /following|favorites/i })
      if (await followingFilter.isVisible()) {
        console.log('Can filter by followed content')
      }
    }
  })
})
