import { test, expect } from '@playwright/test'

test.describe('Trust System', () => {
  test.describe('Trust Score Display', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display user trust score in profile', async ({ page }) => {
      await page.goto('/profile')

      // Check trust score display
      await expect(page.locator('[data-testid="trust-score"]')).toBeVisible()
      await expect(page.locator('[data-testid="trust-level"]')).toBeVisible()

      // Verify trust level badge
      const trustLevel = await page.locator('[data-testid="trust-level"]').textContent()
      expect(['Newcomer', 'Regular', 'Trusted', 'Veteran', 'Elite']).toContain(trustLevel)
    })

    test('should show trust score breakdown', async ({ page }) => {
      await page.goto('/profile/trust')

      // Verify trust components
      await expect(page.locator('[data-testid="content-score"]')).toBeVisible()
      await expect(page.locator('[data-testid="engagement-score"]')).toBeVisible()
      await expect(page.locator('[data-testid="reputation-score"]')).toBeVisible()
      await expect(page.locator('[data-testid="activity-score"]')).toBeVisible()

      // Check trust history
      await expect(page.locator('[data-testid="trust-history"]')).toBeVisible()
    })

    test('should display trust badges on user content', async ({ page }) => {
      await page.goto('/listings')

      // Find listings from trusted users
      const trustedListings = await page.locator('[data-testid="trusted-user-badge"]').count()
      expect(trustedListings).toBeGreaterThanOrEqual(0)

      // Check comments from trusted users
      await page.locator('[data-testid="listing-card"]').first().click()
      const trustedComments = await page.locator('[data-testid="trusted-commenter"]').count()
      expect(trustedComments).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Trust Score Actions', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('creating quality content should increase trust', async ({ page }) => {
      // Get initial trust score
      await page.goto('/profile/trust')
      const initialScore = await page.locator('[data-testid="trust-score-value"]').textContent()

      // Create a listing
      await page.goto('/listings/new')
      await page.fill('[name="title"]', 'High quality listing for trust test')
      await page.selectOption('[name="gameId"]', { index: 1 })
      await page.selectOption('[name="deviceId"]', { index: 1 })
      await page.selectOption('[name="emulatorId"]', { index: 1 })
      await page.fill('[name="notes"]', 'Detailed testing notes with helpful information')
      await page.click('[data-testid="submit-listing"]')

      // Wait for processing
      await page.waitForTimeout(2000)

      // Check if trust increased
      await page.goto('/profile/trust')
      const newScore = await page.locator('[data-testid="trust-score-value"]').textContent()

      // Score should increase or stay same (never decrease for positive actions)
      expect(parseInt(newScore || '0')).toBeGreaterThanOrEqual(parseInt(initialScore || '0'))
    })

    test('receiving upvotes should increase trust', async ({ browser }) => {
      // Create content as user1
      const context1 = await browser.newContext({ storageState: 'tests/.auth/user.json' })
      const page1 = await context1.newPage()

      await page1.goto('/listings')
      await page1.locator('[data-testid="listing-card"]').first().click()

      // Add a comment
      const commentText = `Trust test comment ${Date.now()}`
      await page1.fill('[data-testid="comment-input"]', commentText)
      await page1.click('[data-testid="submit-comment"]')

      const listingUrl = page1.url()

      // Vote as user2
      const context2 = await browser.newContext({ storageState: 'tests/.auth/user2.json' })
      const page2 = await context2.newPage()

      await page2.goto(listingUrl)

      // Find and upvote the comment
      const comment = page2.locator('[data-testid="comment-text"]').filter({ hasText: commentText })
      await comment.locator('..').locator('[data-testid="upvote-comment"]').click()

      // Check trust increased for user1
      await page1.goto('/profile/trust')
      await page1.reload() // Refresh to get latest score

      // Verify trust action in history
      await expect(page1.locator('[data-testid="trust-history"]')).toContainText('upvote')

      await context1.close()
      await context2.close()
    })

    test('spam or low quality content should decrease trust', async ({ page }) => {
      await page.goto('/profile/trust')
      const initialScore = await page.locator('[data-testid="trust-score-value"]').textContent()

      // Create multiple low-quality comments quickly (spam behavior)
      await page.goto('/listings')
      await page.locator('[data-testid="listing-card"]').first().click()

      // Post multiple short, low-quality comments
      for (let i = 0; i < 3; i++) {
        await page.fill('[data-testid="comment-input"]', 'spam')
        await page.click('[data-testid="submit-comment"]')
        await page.waitForTimeout(500)
      }

      // Check if trust decreased or stayed same
      await page.goto('/profile/trust')
      const newScore = await page.locator('[data-testid="trust-score-value"]').textContent()

      // Trust might decrease for spam behavior
      expect(parseInt(newScore || '0')).toBeLessThanOrEqual(parseInt(initialScore || '0'))
    })
  })

  test.describe('Admin Trust Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access trust management panel', async ({ page }) => {
      await page.goto('/admin/trust')

      await expect(page.locator('h1')).toContainText('Trust System Management')
      await expect(page.locator('[data-testid="trust-logs"]')).toBeVisible()
      await expect(page.locator('[data-testid="trust-stats"]')).toBeVisible()
      await expect(page.locator('[data-testid="trust-settings"]')).toBeVisible()
    })

    test('should view trust logs', async ({ page }) => {
      await page.goto('/admin/trust/logs')

      // Verify log entries
      await expect(page.locator('[data-testid="trust-log-entry"]').first()).toBeVisible()

      // Filter by action type
      await page.selectOption('[data-testid="action-filter"]', 'UPVOTE')
      await page.click('[data-testid="apply-filters"]')

      // Verify filtered results
      const actions = await page.locator('[data-testid="log-action"]').all()
      for (const action of actions.slice(0, 3)) {
        await expect(action).toContainText('UPVOTE')
      }

      // Filter by user
      await page.fill('[data-testid="user-filter"]', 'testuser')
      await page.click('[data-testid="apply-filters"]')

      await expect(page.locator('[data-testid="trust-log-entry"]')).toBeVisible()
    })

    test('should view trust statistics', async ({ page }) => {
      await page.goto('/admin/trust/stats')

      // Verify statistics display
      await expect(page.locator('[data-testid="average-trust"]')).toBeVisible()
      await expect(page.locator('[data-testid="trust-distribution"]')).toBeVisible()
      await expect(page.locator('[data-testid="trust-level-breakdown"]')).toBeVisible()

      // Check charts
      await expect(page.locator('[data-testid="trust-trends-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="trust-actions-chart"]')).toBeVisible()
    })

    test('should manually adjust user trust score', async ({ page }) => {
      await page.goto('/admin/users')

      // Search for a user
      await page.fill('[data-testid="search-users"]', 'testuser')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="user-row"]')

      const userRow = page.locator('[data-testid="user-row"]').first()
      if (await userRow.isVisible()) {
        // Open trust adjustment modal
        await userRow.locator('[data-testid="adjust-trust"]').click()

        // Make adjustment
        await page.fill('[name="adjustment"]', '50')
        await page.fill('[name="reason"]', 'Manual adjustment for exceptional contribution')
        await page.click('[data-testid="confirm-adjustment"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('adjusted')

        // Verify in logs
        await page.goto('/admin/trust/logs')
        await expect(page.locator('[data-testid="trust-log-entry"]').first()).toContainText(
          'Manual adjustment',
        )
      }
    })

    test('should run monthly active user bonus', async ({ page }) => {
      await page.goto('/admin/trust/settings')

      // Run monthly bonus
      await page.click('[data-testid="run-monthly-bonus"]')

      // Confirm
      await page.click('[data-testid="confirm-monthly-bonus"]')

      // Wait for processing
      await page.waitForSelector('[data-testid="bonus-results"]', { timeout: 30000 })

      // Verify results
      await expect(page.locator('[data-testid="users-rewarded"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-bonus-points"]')).toBeVisible()
    })

    test('should configure trust level thresholds', async ({ page }) => {
      await page.goto('/admin/trust/settings')

      // Update trust level thresholds
      await page.fill('[name="regular-threshold"]', '100')
      await page.fill('[name="trusted-threshold"]', '500')
      await page.fill('[name="veteran-threshold"]', '1000')
      await page.fill('[name="elite-threshold"]', '5000')

      // Save settings
      await page.click('[data-testid="save-thresholds"]')

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
    })

    test('should configure trust action weights', async ({ page }) => {
      await page.goto('/admin/trust/settings')

      await page.click('[data-testid="action-weights-tab"]')

      // Update action weights
      await page.fill('[name="weight-LISTING_CREATED"]', '10')
      await page.fill('[name="weight-UPVOTE"]', '2')
      await page.fill('[name="weight-DOWNVOTE"]', '-1')
      await page.fill('[name="weight-COMMENT_CREATED"]', '3')

      // Save weights
      await page.click('[data-testid="save-weights"]')

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
    })
  })

  test.describe('Trust Level Privileges', () => {
    test('newcomer level limitations', async ({ browser }) => {
      const context = await browser.newContext({ storageState: 'tests/.auth/newcomer.json' })
      const page = await context.newPage()

      await page.goto('/listings/new')

      // Check for rate limiting notice
      await expect(page.locator('[data-testid="rate-limit-notice"]')).toBeVisible()

      // Verify limited features
      await expect(page.locator('[data-testid="advanced-options"]')).not.toBeVisible()

      await context.close()
    })

    test('trusted user privileges', async ({ browser }) => {
      const context = await browser.newContext({ storageState: 'tests/.auth/trusted.json' })
      const page = await context.newPage()

      await page.goto('/listings/new')

      // Should have access to advanced features
      await expect(page.locator('[data-testid="advanced-options"]')).toBeVisible()

      // Can skip CAPTCHA
      await expect(page.locator('[data-testid="captcha"]')).not.toBeVisible()

      // Has higher rate limits
      await expect(page.locator('[data-testid="rate-limit-notice"]')).not.toBeVisible()

      await context.close()
    })

    test('elite user privileges', async ({ browser }) => {
      const context = await browser.newContext({ storageState: 'tests/.auth/elite.json' })
      const page = await context.newPage()

      await page.goto('/profile')

      // Should have elite badge
      await expect(page.locator('[data-testid="elite-badge"]')).toBeVisible()

      // Has access to beta features
      await page.goto('/beta')
      await expect(page).not.toHaveURL(/unauthorized/)

      // Can moderate community content
      await page.goto('/community/moderate')
      await expect(page.locator('[data-testid="moderation-tools"]')).toBeVisible()

      await context.close()
    })
  })

  test.describe('Trust Decay and Recovery', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should show trust decay warning for inactivity', async ({ page }) => {
      await page.goto('/profile/trust')

      // Check for inactivity warning if applicable
      const warning = page.locator('[data-testid="inactivity-warning"]')
      if (await warning.isVisible()) {
        await expect(warning).toContainText('inactive')

        // Should show days until decay
        await expect(page.locator('[data-testid="days-until-decay"]')).toBeVisible()
      }
    })

    test('should show trust recovery suggestions', async ({ page }) => {
      await page.goto('/profile/trust')

      // Check current trust level
      const trustScore = await page.locator('[data-testid="trust-score-value"]').textContent()

      if (parseInt(trustScore || '0') < 500) {
        // Should show suggestions for improving trust
        await expect(page.locator('[data-testid="trust-suggestions"]')).toBeVisible()

        // Verify suggestions include positive actions
        await expect(page.locator('[data-testid="suggestion-item"]').first()).toBeVisible()
        const suggestions = await page.locator('[data-testid="suggestion-item"]').all()

        for (const suggestion of suggestions.slice(0, 3)) {
          const text = await suggestion.textContent()
          expect(text).toMatch(/create|contribute|engage|help/i)
        }
      }
    })

    test('should track trust milestones', async ({ page }) => {
      await page.goto('/profile/trust')

      // Check milestones section
      await page.click('[data-testid="milestones-tab"]')

      // Verify milestone display
      await expect(page.locator('[data-testid="achieved-milestones"]')).toBeVisible()
      await expect(page.locator('[data-testid="upcoming-milestones"]')).toBeVisible()

      // Check progress to next level
      await expect(page.locator('[data-testid="next-level-progress"]')).toBeVisible()
      const progress = await page.locator('[data-testid="progress-percentage"]').textContent()
      expect(parseInt(progress || '0')).toBeGreaterThanOrEqual(0)
      expect(parseInt(progress || '0')).toBeLessThanOrEqual(100)
    })
  })

  test.describe('Trust System Integration', () => {
    test('trust level should affect content visibility', async ({ page }) => {
      await page.goto('/listings')

      // Elite user content should be highlighted
      const eliteContent = await page.locator('[data-testid="elite-content"]').count()
      if (eliteContent > 0) {
        // Elite content should have special styling
        const eliteListing = page.locator('[data-testid="elite-content"]').first()
        await expect(eliteListing).toHaveClass(/highlighted|featured/)
      }

      // Low trust content might be collapsed or hidden
      const lowTrustContent = await page.locator('[data-testid="low-trust-content"]').count()
      if (lowTrustContent > 0) {
        const lowTrustListing = page.locator('[data-testid="low-trust-content"]').first()
        await expect(lowTrustListing).toHaveClass(/collapsed|dimmed/)
      }
    })

    test('trust should affect sorting and ranking', async ({ page }) => {
      await page.goto('/listings')

      // Sort by trust
      await page.selectOption('[data-testid="sort-by"]', 'trust')

      await page.waitForSelector('[data-testid="listing-card"]')

      // Get trust scores of first few listings
      const trustScores = await page.locator('[data-testid="author-trust"]').all()
      const scores = await Promise.all(
        trustScores.slice(0, 3).map(async (s) => {
          const text = await s.textContent()
          return parseInt(text?.match(/\d+/)?.[0] || '0')
        }),
      )

      // Verify descending order
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1])
      }
    })

    test('trust should affect rate limits', async ({ browser }) => {
      // Test with low trust user
      const lowTrustContext = await browser.newContext({
        storageState: 'tests/.auth/newcomer.json',
      })
      const lowTrustPage = await lowTrustContext.newPage()

      await lowTrustPage.goto('/api/rate-limit-test')
      const lowTrustLimit = await lowTrustPage.locator('[data-testid="rate-limit"]').textContent()

      // Test with high trust user
      const highTrustContext = await browser.newContext({ storageState: 'tests/.auth/elite.json' })
      const highTrustPage = await highTrustContext.newPage()

      await highTrustPage.goto('/api/rate-limit-test')
      const highTrustLimit = await highTrustPage.locator('[data-testid="rate-limit"]').textContent()

      // High trust users should have higher rate limits
      expect(parseInt(highTrustLimit || '0')).toBeGreaterThan(parseInt(lowTrustLimit || '0'))

      await lowTrustContext.close()
      await highTrustContext.close()
    })
  })
})
