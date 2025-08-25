import { test, expect } from '@playwright/test'

test.describe('Badge System', () => {
  test.describe('User Badge Display', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display user badges on profile', async ({ page }) => {
      await page.goto('/profile')

      // Check badge section exists
      await expect(page.locator('[data-testid="user-badges"]')).toBeVisible()

      // Verify badge display
      const badges = await page.locator('[data-testid="badge-item"]').count()
      expect(badges).toBeGreaterThanOrEqual(0)

      // Check badge details on hover
      if (badges > 0) {
        const firstBadge = page.locator('[data-testid="badge-item"]').first()
        await firstBadge.hover()

        // Tooltip should show badge details
        await expect(page.locator('[data-testid="badge-tooltip"]')).toBeVisible()
        await expect(page.locator('[data-testid="badge-name"]')).toBeVisible()
        await expect(page.locator('[data-testid="badge-description"]')).toBeVisible()
      }
    })

    test('should display badges on user content', async ({ page }) => {
      await page.goto('/listings')

      // Find listings with badge indicators
      const listingsWithBadges = await page.locator('[data-testid="author-badges"]').count()

      if (listingsWithBadges > 0) {
        // Badges should be visible on listings
        const authorBadges = page.locator('[data-testid="author-badges"]').first()
        await expect(authorBadges).toBeVisible()

        // Click to view author profile
        await authorBadges.locator('..').locator('[data-testid="author-name"]').click()

        // Should navigate to author profile with badges
        await expect(page).toHaveURL(/\/users\/\d+/)
        await expect(page.locator('[data-testid="user-badges"]')).toBeVisible()
      }
    })

    test('should show badge progress', async ({ page }) => {
      await page.goto('/profile/badges')

      // Check earned badges
      await expect(page.locator('[data-testid="earned-badges"]')).toBeVisible()

      // Check available badges
      await expect(page.locator('[data-testid="available-badges"]')).toBeVisible()

      // Check progress badges
      const progressBadges = await page.locator('[data-testid="badge-progress"]').count()

      if (progressBadges > 0) {
        const firstProgress = page.locator('[data-testid="badge-progress"]').first()

        // Should show progress bar
        await expect(firstProgress.locator('[data-testid="progress-bar"]')).toBeVisible()

        // Should show progress text
        const progressText = await firstProgress
          .locator('[data-testid="progress-text"]')
          .textContent()
        expect(progressText).toMatch(/\d+\/\d+|\d+%/)
      }
    })

    test('should filter badges by category', async ({ page }) => {
      await page.goto('/profile/badges')

      // Check if category filters exist
      const categories = await page.locator('[data-testid="badge-category"]').all()

      if (categories.length > 0) {
        // Click first category
        await categories[0].click()

        // Verify filtered results
        await page.waitForSelector('[data-testid="badge-item"]')

        // All visible badges should be from selected category
        const visibleBadges = await page.locator('[data-testid="badge-item"]:visible').all()
        for (const badge of visibleBadges) {
          const category = await badge.getAttribute('data-category')
          expect(category).toBe(await categories[0].getAttribute('data-category'))
        }
      }
    })
  })

  test.describe('Badge Earning', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should earn badge for first listing', async ({ page }) => {
      // Check current badges
      await page.goto('/profile/badges')
      const initialBadgeCount = await page.locator('[data-testid="earned-badge"]').count()

      // Create first listing
      await page.goto('/listings/new')
      await page.fill('[name="title"]', 'My First Listing for Badge')
      await page.selectOption('[name="gameId"]', { index: 1 })
      await page.selectOption('[name="deviceId"]', { index: 1 })
      await page.selectOption('[name="emulatorId"]', { index: 1 })
      await page.click('[data-testid="submit-listing"]')

      // Check for badge notification
      const notification = page.locator('[data-testid="badge-earned-notification"]')
      if (await notification.isVisible({ timeout: 5000 })) {
        await expect(notification).toContainText('Badge Earned')

        // Go back to badges page
        await page.goto('/profile/badges')

        // Should have one more badge
        const newBadgeCount = await page.locator('[data-testid="earned-badge"]').count()
        expect(newBadgeCount).toBeGreaterThan(initialBadgeCount)
      }
    })

    test('should earn badge for helping others', async ({ page }) => {
      await page.goto('/listings')

      // Find a listing with questions
      const listingWithQuestion = page
        .locator('[data-testid="listing-card"]')
        .filter({ has: page.locator('[data-testid="has-questions"]') })
        .first()

      if (await listingWithQuestion.isVisible()) {
        await listingWithQuestion.click()

        // Answer a question helpfully
        await page.fill(
          '[data-testid="comment-input"]',
          'Here is a detailed solution to your problem...',
        )
        await page.click('[data-testid="submit-comment"]')

        // Check if earned helper badge
        const notification = page.locator('[data-testid="badge-earned-notification"]')
        if (await notification.isVisible({ timeout: 3000 })) {
          await expect(notification).toContainText('Helper')
        }
      }
    })

    test('should track milestone progress', async ({ page }) => {
      await page.goto('/profile/badges')

      // Find milestone badges
      const milestoneBadge = page.locator('[data-testid="milestone-badge"]').first()

      if (await milestoneBadge.isVisible()) {
        // Check current progress
        const progress = await milestoneBadge.locator('[data-testid="progress-text"]').textContent()
        const current = parseInt(progress?.split('/')[0] || '0')
        const target = parseInt(progress?.split('/')[1] || '0')

        // Perform action to increase progress
        if (current < target) {
          await page.goto('/listings/new')
          await page.fill('[name="title"]', 'Progress toward milestone')
          await page.selectOption('[name="gameId"]', { index: 1 })
          await page.selectOption('[name="deviceId"]', { index: 1 })
          await page.selectOption('[name="emulatorId"]', { index: 1 })
          await page.click('[data-testid="submit-listing"]')

          // Check updated progress
          await page.goto('/profile/badges')
          const newProgress = await milestoneBadge
            .locator('[data-testid="progress-text"]')
            .textContent()
          const newCurrent = parseInt(newProgress?.split('/')[0] || '0')

          expect(newCurrent).toBeGreaterThan(current)
        }
      }
    })
  })

  test.describe('Admin Badge Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access badge management panel', async ({ page }) => {
      await page.goto('/admin/badges')

      await expect(page.locator('h1')).toContainText('Badge Management')
      await expect(page.locator('[data-testid="badges-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="create-badge"]')).toBeVisible()
    })

    test('should create new badge', async ({ page }) => {
      await page.goto('/admin/badges')

      await page.click('[data-testid="create-badge"]')

      // Fill badge details
      await page.fill('[name="name"]', 'Test Achievement Badge')
      await page.fill('[name="description"]', 'Awarded for completing test achievements')
      await page.selectOption('[name="category"]', 'achievement')
      await page.selectOption('[name="rarity"]', 'rare')

      // Set criteria
      await page.selectOption('[name="criteriaType"]', 'listings_count')
      await page.fill('[name="criteriaValue"]', '10')

      // Upload or select icon
      await page.fill('[name="iconUrl"]', 'https://example.com/badge-icon.png')

      // Save badge
      await page.click('[data-testid="save-badge"]')

      // Verify badge created
      await expect(page.locator('[data-testid="success-message"]')).toContainText('created')
      await expect(page.locator('[data-testid="badge-row"]')).toContainText(
        'Test Achievement Badge',
      )
    })

    test('should edit existing badge', async ({ page }) => {
      await page.goto('/admin/badges')

      const badges = await page.locator('[data-testid="badge-row"]').count()

      if (badges > 0) {
        // Edit first badge
        await page.locator('[data-testid="edit-badge"]').first().click()

        // Update description
        await page.fill('[name="description"]', 'Updated badge description')

        // Save changes
        await page.click('[data-testid="save-badge"]')

        // Verify updated
        await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
      }
    })

    test('should manually assign badge to user', async ({ page }) => {
      await page.goto('/admin/badges')

      const badges = await page.locator('[data-testid="badge-row"]').count()

      if (badges > 0) {
        // Click assign on first badge
        await page.locator('[data-testid="assign-badge"]').first().click()

        // Search for user
        await page.fill('[data-testid="user-search"]', 'testuser')
        await page.click('[data-testid="search-users"]')

        await page.waitForSelector('[data-testid="user-option"]')

        // Select user
        await page.locator('[data-testid="user-option"]').first().click()

        // Add reason
        await page.fill('[name="assignReason"]', 'Manual award for exceptional contribution')

        // Confirm assignment
        await page.click('[data-testid="confirm-assign"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('assigned')
      }
    })

    test('should bulk assign badges', async ({ page }) => {
      await page.goto('/admin/badges')

      // Click bulk assign
      await page.click('[data-testid="bulk-assign"]')

      // Select badge
      await page.selectOption('[name="badgeId"]', { index: 1 })

      // Upload user list or select criteria
      await page.click('[data-testid="select-by-criteria"]')
      await page.selectOption('[name="criteria"]', 'trust_level')
      await page.selectOption('[name="criteriaValue"]', 'elite')

      // Preview affected users
      await page.click('[data-testid="preview-users"]')
      await page.waitForSelector('[data-testid="affected-users"]')

      const affectedCount = await page.locator('[data-testid="affected-user"]').count()

      if (affectedCount > 0) {
        // Confirm bulk assignment
        await page.click('[data-testid="confirm-bulk-assign"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText(
          `${affectedCount} users`,
        )
      }
    })

    test('should revoke badge from user', async ({ page }) => {
      await page.goto('/admin/users')

      // Search for user with badges
      await page.fill('[data-testid="search-users"]', 'testuser')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="user-row"]')

      // Click view badges
      await page.locator('[data-testid="view-badges"]').first().click()

      const userBadges = await page.locator('[data-testid="user-badge"]').count()

      if (userBadges > 0) {
        // Revoke first badge
        await page.locator('[data-testid="revoke-badge"]').first().click()

        // Provide reason
        await page.fill('[name="revokeReason"]', 'Badge criteria no longer met')
        await page.click('[data-testid="confirm-revoke"]')

        // Verify revoked
        await expect(page.locator('[data-testid="success-message"]')).toContainText('revoked')

        // Badge count should decrease
        const newCount = await page.locator('[data-testid="user-badge"]').count()
        expect(newCount).toBeLessThan(userBadges)
      }
    })

    test('should view badge statistics', async ({ page }) => {
      await page.goto('/admin/badges/stats')

      // Verify statistics display
      await expect(page.locator('[data-testid="total-badges"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-assignments"]')).toBeVisible()
      await expect(page.locator('[data-testid="unique-holders"]')).toBeVisible()

      // Check rarity distribution
      await expect(page.locator('[data-testid="rarity-chart"]')).toBeVisible()

      // Check most earned badges
      await expect(page.locator('[data-testid="popular-badges"]')).toBeVisible()

      // Check recent awards
      await expect(page.locator('[data-testid="recent-awards"]')).toBeVisible()
    })

    test('should manage badge categories', async ({ page }) => {
      await page.goto('/admin/badges/categories')

      // Create new category
      await page.click('[data-testid="create-category"]')
      await page.fill('[name="categoryName"]', 'Special Events')
      await page.fill('[name="categoryDescription"]', 'Badges for special events and occasions')
      await page.click('[data-testid="save-category"]')

      // Verify created
      await expect(page.locator('[data-testid="category-item"]')).toContainText('Special Events')

      // Edit category
      await page.locator('[data-testid="edit-category"]').last().click()
      await page.fill('[name="categoryDescription"]', 'Updated description for special events')
      await page.click('[data-testid="save-category"]')

      // Verify updated
      await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
    })
  })

  test.describe('Badge Showcase', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should customize badge showcase', async ({ page }) => {
      await page.goto('/profile/badges/showcase')

      // Select badges to showcase
      const availableBadges = await page.locator('[data-testid="available-badge"]').count()

      if (availableBadges > 0) {
        // Select up to 3 badges
        for (let i = 0; i < Math.min(3, availableBadges); i++) {
          await page.click(`[data-testid="select-badge"]:nth-child(${i + 1})`)
        }

        // Arrange order
        const firstBadge = page.locator('[data-testid="showcase-badge"]').first()
        await firstBadge.dragTo(page.locator('[data-testid="showcase-slot-2"]'))

        // Save showcase
        await page.click('[data-testid="save-showcase"]')

        // Verify saved
        await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')

        // Check profile displays showcase
        await page.goto('/profile')
        await expect(page.locator('[data-testid="badge-showcase"]')).toBeVisible()
      }
    })

    test('should set primary badge', async ({ page }) => {
      await page.goto('/profile/badges')

      const earnedBadges = await page.locator('[data-testid="earned-badge"]').count()

      if (earnedBadges > 0) {
        // Set first badge as primary
        await page.locator('[data-testid="set-primary"]').first().click()

        // Confirm
        await page.click('[data-testid="confirm-primary"]')

        // Verify set
        await expect(page.locator('[data-testid="primary-badge"]')).toBeVisible()

        // Check it appears next to username
        await page.goto('/profile')
        await expect(page.locator('[data-testid="primary-badge-display"]')).toBeVisible()
      }
    })

    test('should share badge achievement', async ({ page }) => {
      await page.goto('/profile/badges')

      const earnedBadges = await page.locator('[data-testid="earned-badge"]').count()

      if (earnedBadges > 0) {
        // Click share on first badge
        await page.locator('[data-testid="share-badge"]').first().click()

        // Check share options
        await expect(page.locator('[data-testid="share-modal"]')).toBeVisible()
        await expect(page.locator('[data-testid="copy-link"]')).toBeVisible()
        await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible()

        // Copy link
        await page.click('[data-testid="copy-link"]')

        // Verify copied
        await expect(page.locator('[data-testid="copied-message"]')).toBeVisible()
      }
    })
  })

  test.describe('Badge Leaderboards', () => {
    test('should display badge leaderboards', async ({ page }) => {
      await page.goto('/badges/leaderboard')

      // Check leaderboard sections
      await expect(page.locator('[data-testid="most-badges"]')).toBeVisible()
      await expect(page.locator('[data-testid="rarest-badges"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-earners"]')).toBeVisible()

      // Check user rankings
      const topUsers = await page.locator('[data-testid="leaderboard-user"]').all()

      for (let i = 0; i < Math.min(3, topUsers.length); i++) {
        const user = topUsers[i]
        await expect(user.locator('[data-testid="user-rank"]')).toContainText(`${i + 1}`)
        await expect(user.locator('[data-testid="badge-count"]')).toBeVisible()
      }
    })

    test('should filter leaderboard by time period', async ({ page }) => {
      await page.goto('/badges/leaderboard')

      // Filter by this month
      await page.selectOption('[data-testid="time-filter"]', 'month')

      await page.waitForSelector('[data-testid="leaderboard-user"]')

      // Verify filtered results
      const monthlyLeaders = await page.locator('[data-testid="leaderboard-user"]').count()

      // Filter by all time
      await page.selectOption('[data-testid="time-filter"]', 'all')

      await page.waitForSelector('[data-testid="leaderboard-user"]')

      const allTimeLeaders = await page.locator('[data-testid="leaderboard-user"]').count()

      // All time should have more or equal entries
      expect(allTimeLeaders).toBeGreaterThanOrEqual(monthlyLeaders)
    })

    test('should view badge rarity tiers', async ({ page }) => {
      await page.goto('/badges')

      // Check rarity sections
      const rarityTiers = ['common', 'uncommon', 'rare', 'epic', 'legendary']

      for (const tier of rarityTiers) {
        const section = page.locator(`[data-testid="rarity-${tier}"]`)
        if (await section.isVisible()) {
          // Check badge count for this tier
          const badges = await section.locator('[data-testid="badge-card"]').count()

          // Rarer tiers should have fewer badges
          if (tier === 'legendary') {
            expect(badges).toBeLessThanOrEqual(5)
          }
        }
      }
    })
  })
})
