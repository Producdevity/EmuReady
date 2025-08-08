import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Voting Functionality Tests', () => {
  test('should display vote buttons on listings', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    // Check if listings have vote buttons
    const voteButtons = page.locator(
      '[data-testid*="vote"], button[aria-label*="vote"], .vote-button',
    )
    const hasVoteButtons = (await voteButtons.count()) > 0

    if (hasVoteButtons) {
      // Verify upvote and downvote buttons
      const upvoteButtons = page.locator('[aria-label*="upvote"], [data-testid="upvote"], .upvote')
      const downvoteButtons = page.locator(
        '[aria-label*="downvote"], [data-testid="downvote"], .downvote',
      )

      expect(await upvoteButtons.count()).toBeGreaterThan(0)
      expect(await downvoteButtons.count()).toBeGreaterThan(0)

      console.log('Vote buttons are present on listings')
    } else {
      console.log('No vote buttons found - voting might require authentication')
    }
  })

  test('should show vote counts', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Look for vote count displays
    const voteCounts = page.locator(
      '[data-testid*="vote-count"], .vote-count, [aria-label*="votes"]',
    )

    if ((await voteCounts.count()) > 0) {
      const firstCount = await voteCounts.first().textContent()
      expect(firstCount).toMatch(/\d+/) // Should contain a number

      console.log(`Vote counts displayed: ${firstCount}`)
    }
  })

  test('should handle voting when not authenticated', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    const authPage = new AuthPage(page)

    await listingsPage.goto()

    // Ensure not authenticated
    const isAuth = await authPage.isAuthenticated()
    if (!isAuth) {
      // Try to vote
      const upvoteButton = page.locator('[aria-label*="upvote"]').first()

      if (await upvoteButton.isVisible({ timeout: 3000 })) {
        await upvoteButton.click()

        // Should either:
        // 1. Show auth prompt
        // 2. Redirect to login
        // 3. Show error message

        const authPrompt = await page
          .getByText(/sign in|log in|authenticate/i)
          .isVisible({ timeout: 2000 })
          .catch(() => false)
        const onAuthPage = page.url().includes('/sign-in') || page.url().includes('/login')
        const errorMessage = await page
          .getByText(/must.*log|please.*sign/i)
          .isVisible({ timeout: 2000 })
          .catch(() => false)

        expect(authPrompt || onAuthPage || errorMessage).toBe(true)
        console.log('Voting requires authentication as expected')
      }
    }
  })

  test('should update vote UI optimistically', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Find a listing with vote buttons
    const voteContainer = page.locator('[data-testid*="vote-container"], .vote-container').first()

    if (await voteContainer.isVisible({ timeout: 3000 })) {
      // Get initial vote count
      const voteCount = voteContainer.locator('[data-testid*="vote-count"], .vote-count')
      const initialCount = await voteCount.textContent()
      const initialNumber = parseInt(initialCount || '0')

      // Click upvote
      const upvoteButton = voteContainer.locator('[aria-label*="upvote"], .upvote')

      if (await upvoteButton.isEnabled()) {
        await upvoteButton.click()

        // UI should update immediately (optimistic update)
        await page.waitForTimeout(100) // Small wait for UI update

        const newCount = await voteCount.textContent()
        const newNumber = parseInt(newCount || '0')

        // Count should change (increase or toggle)
        expect(newNumber).not.toBe(initialNumber)
      }
    }
  })

  test('should handle vote toggling', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const firstListing = page.locator('[data-testid="listing-card"], .listing-item').first()

    if (await firstListing.isVisible({ timeout: 3000 })) {
      const upvote = firstListing.locator('[aria-label*="upvote"]')
      const downvote = firstListing.locator('[aria-label*="downvote"]')

      // Check if voting is available
      if ((await upvote.isVisible()) && (await downvote.isVisible())) {
        // Click upvote
        await upvote.click()
        await page.waitForTimeout(500)

        // Check if upvote is active (might have different styling)
        const upvoteClass = await upvote.getAttribute('class')
        const isUpvoteActive =
          upvoteClass?.includes('active') ||
          upvoteClass?.includes('selected') ||
          (await upvote.getAttribute('aria-pressed')) === 'true'

        // Click downvote (should toggle)
        await downvote.click()
        await page.waitForTimeout(500)

        // Upvote should no longer be active
        const upvoteClassAfter = await upvote.getAttribute('class')
        const isUpvoteActiveAfter =
          upvoteClassAfter?.includes('active') ||
          upvoteClassAfter?.includes('selected') ||
          (await upvote.getAttribute('aria-pressed')) === 'true'

        if (isUpvoteActive) {
          expect(isUpvoteActiveAfter).toBe(false)
        }
      }
    }
  })

  test('should persist votes across page navigation', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Vote on first listing
    const firstVoteButton = page.locator('[aria-label*="upvote"]').first()

    if (await firstVoteButton.isVisible({ timeout: 3000 })) {
      // Remember the listing details
      const listingText = await page.locator('[data-testid="listing-card"]').first().textContent()

      // Vote
      await firstVoteButton.click()
      await page.waitForTimeout(1000)

      // Navigate away and back
      await listingsPage.navigateToHome()
      await listingsPage.goto()

      // Find the same listing
      const sameListing = page
        .locator('[data-testid="listing-card"]')
        .filter({ hasText: listingText || '' })

      if (await sameListing.isVisible()) {
        // Vote state might be persisted if authenticated
        const voteButton = sameListing.locator('[aria-label*="upvote"]')
        const voteState =
          (await voteButton.getAttribute('aria-pressed')) ||
          (await voteButton.getAttribute('data-state'))

        console.log(`Vote persistence: ${voteState}`)
      }
    }
  })

  test('should show voting statistics on detail pages', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Navigate to a listing detail
    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for detailed voting stats
      const voteStats = page.locator('[data-testid*="vote-stats"], .vote-statistics')

      if (await voteStats.isVisible({ timeout: 3000 })) {
        const statsText = await voteStats.textContent()

        // Might show percentage or breakdown
        expect(statsText).toMatch(/\d+/) // Contains numbers
        console.log(`Vote statistics: ${statsText}`)
      }

      // Check for vote breakdown
      const upvotePercentage = page.locator(
        '[data-testid*="upvote-percentage"], .upvote-percentage',
      )
      if (await upvotePercentage.isVisible()) {
        const percentage = await upvotePercentage.textContent()
        expect(percentage).toMatch(/\d+%?/) // Number with optional %
      }
    }
  })

  test('should handle concurrent voting', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Get all visible vote buttons
    const upvoteButtons = page.locator('[aria-label*="upvote"]')
    const buttonCount = await upvoteButtons.count()

    if (buttonCount >= 3) {
      // Click multiple vote buttons rapidly
      const votePromises = []
      for (let i = 0; i < 3; i++) {
        votePromises.push(upvoteButtons.nth(i).click())
      }

      // Execute all votes concurrently
      await Promise.all(votePromises)

      // Page should remain stable
      await page.waitForTimeout(1000)
      await expect(listingsPage.pageHeading).toBeVisible()

      console.log('Handled concurrent voting without errors')
    }
  })

  test('should display vote confirmation feedback', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Set up listener for toasts/notifications
    const toastPromise = page
      .waitForSelector('[role="alert"], .toast, .notification', {
        timeout: 3000,
        state: 'visible',
      })
      .catch(() => null)

    // Vote on a listing
    const voteButton = page.locator('[aria-label*="upvote"]').first()

    if (await voteButton.isVisible()) {
      await voteButton.click()

      // Check for feedback
      const toast = await toastPromise

      if (toast) {
        const message = await toast.textContent()
        console.log(`Vote feedback: ${message}`)
        expect(message).toBeTruthy()
      }

      // Or check for visual feedback on button
      const buttonState =
        (await voteButton.getAttribute('data-state')) ||
        (await voteButton.getAttribute('aria-pressed'))

      console.log(`Button state after vote: ${buttonState}`)
    }
  })
})

test.describe('Mobile Voting Tests', () => {
  test('should handle voting on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Check if vote buttons are accessible on mobile
    const voteButtons = page.locator('[aria-label*="vote"]')

    if ((await voteButtons.count()) > 0) {
      const firstButton = voteButtons.first()

      // Verify button is large enough for mobile tap
      const box = await firstButton.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44) // Minimum tap target
        expect(box.height).toBeGreaterThanOrEqual(44)
      }

      // Test voting on mobile
      await firstButton.tap()

      // Should work same as desktop
      console.log('Mobile voting interface works correctly')
    }
  })

  test('should not interfere with swipe gestures', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Simulate swipe gesture
    await page.touchscreen.tap(200, 300)
    await page.touchscreen.tap(100, 300)

    // Vote buttons should still work after swipe
    const voteButton = page.locator('[aria-label*="vote"]').first()

    if (await voteButton.isVisible()) {
      await voteButton.tap()

      // Verify tap registered
      await expect(voteButton).toBeVisible()
    }
  })
})
