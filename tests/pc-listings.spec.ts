import { test, expect } from '@playwright/test'

test.describe('PC Listings System', () => {
  test.describe('Public PC Listings Access', () => {
    test('should display PC listings page', async ({ page }) => {
      await page.goto('/pc-listings')
      await expect(page).toHaveTitle(/PC Compatibility/)
      await expect(page.locator('h1')).toContainText('PC Game Compatibility')
    })

    test('should filter PC listings by CPU', async ({ page }) => {
      await page.goto('/pc-listings')

      // Wait for listings to load
      await page.waitForSelector('[data-testid="pc-listing-card"]', { timeout: 10000 })

      // Apply CPU filter
      await page.click('[data-testid="cpu-filter-button"]')
      await page.fill('[placeholder*="CPU"]', 'Intel')
      await page.click('[data-testid="apply-filters"]')

      // Verify filtered results
      await page.waitForSelector('[data-testid="pc-listing-card"]')
      const listings = await page.locator('[data-testid="pc-listing-card"]').count()
      expect(listings).toBeGreaterThan(0)
    })

    test('should filter PC listings by GPU', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')

      // Apply GPU filter
      await page.click('[data-testid="gpu-filter-button"]')
      await page.fill('[placeholder*="GPU"]', 'NVIDIA')
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="pc-listing-card"]')
      const listings = await page.locator('[data-testid="pc-listing-card"]').count()
      expect(listings).toBeGreaterThan(0)
    })

    test('should view PC listing details', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')

      // Click on first listing
      const firstListing = page.locator('[data-testid="pc-listing-card"]').first()
      const listingTitle = await firstListing.locator('h3').textContent()
      await firstListing.click()

      // Verify details page
      await expect(page.locator('h1')).toContainText(listingTitle || '')
      await expect(page.locator('[data-testid="cpu-info"]')).toBeVisible()
      await expect(page.locator('[data-testid="gpu-info"]')).toBeVisible()
      await expect(page.locator('[data-testid="performance-info"]')).toBeVisible()
    })

    test('should display PC listing comments', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')
      await page.locator('[data-testid="pc-listing-card"]').first().click()

      // Check for comments section
      await expect(page.locator('[data-testid="comments-section"]')).toBeVisible()
    })
  })

  test.describe('Authenticated PC Listings Features', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should create new PC listing', async ({ page }) => {
      await page.goto('/pc-listings/new')

      // Fill in PC listing form
      await page.fill('[name="title"]', 'Test PC Game Listing')
      await page.selectOption('[name="gameId"]', { index: 1 })
      await page.selectOption('[name="emulatorId"]', { index: 1 })

      // Hardware specs
      await page.fill('[name="cpuModel"]', 'Intel Core i7-12700K')
      await page.fill('[name="gpuModel"]', 'NVIDIA RTX 3080')
      await page.fill('[name="ram"]', '32')
      await page.fill('[name="os"]', 'Windows 11')

      // Performance details
      await page.selectOption('[name="performanceRating"]', 'excellent')
      await page.fill('[name="fps"]', '60')
      await page.fill('[name="resolution"]', '1920x1080')
      await page.selectOption('[name="graphicsPreset"]', 'high')

      // Notes
      await page.fill('[name="notes"]', 'Runs perfectly with no issues')

      // Submit
      await page.click('[data-testid="submit-pc-listing"]')

      // Verify redirect to listing or success message
      await expect(page).toHaveURL(/\/pc-listings\/(new\/success|\d+)/)
    })

    test('should edit own PC listing', async ({ page }) => {
      // Navigate to user's listings
      await page.goto('/profile/pc-listings')

      // Find and click edit on first listing
      await page.waitForSelector('[data-testid="edit-pc-listing"]')
      await page.locator('[data-testid="edit-pc-listing"]').first().click()

      // Update some fields
      await page.fill('[name="fps"]', '120')
      await page.fill('[name="notes"]', 'Updated: Now runs at 120fps')

      // Save changes
      await page.click('[data-testid="save-pc-listing"]')

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
    })

    test('should vote on PC listing', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')
      await page.locator('[data-testid="pc-listing-card"]').first().click()

      // Vote helpful
      const voteButton = page.locator('[data-testid="vote-helpful"]')
      const initialVotes = await page.locator('[data-testid="vote-count"]').textContent()

      await voteButton.click()

      // Verify vote was recorded
      await expect(voteButton).toHaveAttribute('data-voted', 'true')
      const newVotes = await page.locator('[data-testid="vote-count"]').textContent()
      expect(parseInt(newVotes || '0')).toBeGreaterThan(parseInt(initialVotes || '0'))
    })

    test('should comment on PC listing', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')
      await page.locator('[data-testid="pc-listing-card"]').first().click()

      // Add comment
      const commentText = `Test comment ${Date.now()}`
      await page.fill('[data-testid="comment-input"]', commentText)
      await page.click('[data-testid="submit-comment"]')

      // Verify comment appears
      await expect(page.locator('[data-testid="comment-text"]').last()).toContainText(commentText)
    })

    test('should report inappropriate PC listing', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')
      await page.locator('[data-testid="pc-listing-card"]').first().click()

      // Open report modal
      await page.click('[data-testid="report-listing"]')

      // Fill report form
      await page.selectOption('[name="reason"]', 'MISLEADING_INFORMATION')
      await page.fill('[name="description"]', 'This listing contains incorrect performance data')

      // Submit report
      await page.click('[data-testid="submit-report"]')

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('reported')
    })

    test('should manage PC presets', async ({ page }) => {
      await page.goto('/profile/pc-presets')

      // Create new preset
      await page.click('[data-testid="create-preset"]')

      await page.fill('[name="name"]', 'My Gaming PC')
      await page.fill('[name="cpu"]', 'AMD Ryzen 9 5900X')
      await page.fill('[name="gpu"]', 'AMD RX 6800 XT')
      await page.fill('[name="ram"]', '32')

      await page.click('[data-testid="save-preset"]')

      // Verify preset was created
      await expect(page.locator('[data-testid="preset-card"]')).toContainText('My Gaming PC')

      // Use preset when creating listing
      await page.goto('/pc-listings/new')
      await page.click('[data-testid="use-preset"]')
      await page.selectOption('[name="preset"]', 'My Gaming PC')

      // Verify fields are populated
      await expect(page.locator('[name="cpuModel"]')).toHaveValue('AMD Ryzen 9 5900X')
      await expect(page.locator('[name="gpuModel"]')).toHaveValue('AMD RX 6800 XT')
    })
  })

  test.describe('Developer PC Listings Features', () => {
    test.use({ storageState: 'tests/.auth/developer.json' })

    test('should verify PC listing as developer', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')
      await page.locator('[data-testid="pc-listing-card"]').first().click()

      // Look for verify button (only visible to developers)
      const verifyButton = page.locator('[data-testid="verify-listing"]')

      if (await verifyButton.isVisible()) {
        await verifyButton.click()

        // Fill verification details
        await page.fill('[name="verificationNotes"]', 'Verified on similar hardware')
        await page.click('[data-testid="confirm-verification"]')

        // Check for verification badge
        await expect(page.locator('[data-testid="verified-badge"]')).toBeVisible()
      }
    })

    test('should remove PC listing verification', async ({ page }) => {
      await page.goto('/pc-listings')

      // Find a verified listing
      await page.waitForSelector('[data-testid="verified-badge"]')
      const verifiedListing = page
        .locator('[data-testid="pc-listing-card"]')
        .filter({ has: page.locator('[data-testid="verified-badge"]') })
        .first()
      await verifiedListing.click()

      // Remove verification
      await page.click('[data-testid="remove-verification"]')
      await page.click('[data-testid="confirm-remove"]')

      // Verify badge is gone
      await expect(page.locator('[data-testid="verified-badge"]')).not.toBeVisible()
    })
  })

  test.describe('Admin PC Listings Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access PC listings admin panel', async ({ page }) => {
      await page.goto('/admin/pc-listings')

      await expect(page.locator('h1')).toContainText('PC Listings Management')
      await expect(page.locator('[data-testid="pending-tab"]')).toBeVisible()
      await expect(page.locator('[data-testid="approved-tab"]')).toBeVisible()
      await expect(page.locator('[data-testid="rejected-tab"]')).toBeVisible()
    })

    test('should approve pending PC listing', async ({ page }) => {
      await page.goto('/admin/pc-listings')

      // Go to pending tab
      await page.click('[data-testid="pending-tab"]')

      const pendingListings = await page.locator('[data-testid="pending-listing"]').count()

      if (pendingListings > 0) {
        // Approve first pending listing
        await page.locator('[data-testid="approve-listing"]').first().click()
        await page.click('[data-testid="confirm-approve"]')

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toContainText('approved')

        // Check count decreased
        const newCount = await page.locator('[data-testid="pending-listing"]').count()
        expect(newCount).toBeLessThan(pendingListings)
      }
    })

    test('should reject pending PC listing', async ({ page }) => {
      await page.goto('/admin/pc-listings')

      await page.click('[data-testid="pending-tab"]')

      const pendingListings = await page.locator('[data-testid="pending-listing"]').count()

      if (pendingListings > 0) {
        // Reject first pending listing
        await page.locator('[data-testid="reject-listing"]').first().click()

        // Provide rejection reason
        await page.fill('[name="rejectionReason"]', 'Insufficient performance data provided')
        await page.click('[data-testid="confirm-reject"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('rejected')
      }
    })

    test('should bulk approve PC listings', async ({ page }) => {
      await page.goto('/admin/pc-listings')

      await page.click('[data-testid="pending-tab"]')

      const pendingListings = await page.locator('[data-testid="pending-listing"]').count()

      if (pendingListings >= 2) {
        // Select multiple listings
        await page.click('[data-testid="select-all"]')

        // Bulk approve
        await page.click('[data-testid="bulk-actions"]')
        await page.click('[data-testid="bulk-approve"]')
        await page.click('[data-testid="confirm-bulk-approve"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('approved')
      }
    })

    test('should edit PC listing as admin', async ({ page }) => {
      await page.goto('/admin/pc-listings')

      await page.click('[data-testid="approved-tab"]')

      // Edit first approved listing
      await page.locator('[data-testid="edit-listing"]').first().click()

      // Make changes
      await page.fill('[name="adminNotes"]', 'Admin review: Verified hardware configuration')
      await page.click('[data-testid="save-admin-changes"]')

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
    })

    test('should view PC listing statistics', async ({ page }) => {
      await page.goto('/admin/pc-listings/stats')

      // Verify statistics are displayed
      await expect(page.locator('[data-testid="total-listings"]')).toBeVisible()
      await expect(page.locator('[data-testid="pending-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="approved-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="rejection-rate"]')).toBeVisible()

      // Check charts
      await expect(page.locator('[data-testid="listings-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="hardware-distribution"]')).toBeVisible()
    })

    test('should manage PC listing reports', async ({ page }) => {
      await page.goto('/admin/pc-listings/reports')

      await expect(page.locator('h1')).toContainText('PC Listing Reports')

      const reports = await page.locator('[data-testid="report-item"]').count()

      if (reports > 0) {
        // Process first report
        await page.locator('[data-testid="view-report"]').first().click()

        // Review report details
        await expect(page.locator('[data-testid="report-reason"]')).toBeVisible()
        await expect(page.locator('[data-testid="report-description"]')).toBeVisible()

        // Resolve report
        await page.selectOption('[name="status"]', 'RESOLVED')
        await page.fill('[name="adminNotes"]', 'Reviewed and addressed')
        await page.click('[data-testid="update-report"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
      }
    })
  })

  test.describe('PC Listings Search and Filtering', () => {
    test('should search PC listings by game title', async ({ page }) => {
      await page.goto('/pc-listings')

      // Search for a specific game
      await page.fill('[data-testid="search-input"]', 'Mario')
      await page.click('[data-testid="search-button"]')

      // Wait for results
      await page.waitForSelector('[data-testid="pc-listing-card"]')

      // Verify results contain search term
      const listings = await page.locator('[data-testid="pc-listing-card"]').all()
      for (const listing of listings.slice(0, 3)) {
        const text = await listing.textContent()
        expect(text?.toLowerCase()).toContain('mario')
      }
    })

    test('should filter by performance rating', async ({ page }) => {
      await page.goto('/pc-listings')

      // Filter by excellent performance
      await page.selectOption('[data-testid="performance-filter"]', 'excellent')
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="pc-listing-card"]')

      // Verify all results have excellent rating
      const ratings = await page.locator('[data-testid="performance-rating"]').all()
      for (const rating of ratings) {
        await expect(rating).toContainText('Excellent')
      }
    })

    test('should filter by FPS range', async ({ page }) => {
      await page.goto('/pc-listings')

      // Filter by 60+ FPS
      await page.fill('[data-testid="min-fps"]', '60')
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="pc-listing-card"]')

      // Verify FPS values
      const fpsValues = await page.locator('[data-testid="fps-value"]').all()
      for (const fps of fpsValues) {
        const value = await fps.textContent()
        expect(parseInt(value || '0')).toBeGreaterThanOrEqual(60)
      }
    })

    test('should sort PC listings by date', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')

      // Sort by newest first
      await page.selectOption('[data-testid="sort-by"]', 'date-desc')

      // Get dates of first few listings
      const dates = await page.locator('[data-testid="listing-date"]').all()
      const dateValues = await Promise.all(
        dates.slice(0, 3).map(async (d) => new Date((await d.getAttribute('data-date')) || '')),
      )

      // Verify descending order
      for (let i = 0; i < dateValues.length - 1; i++) {
        expect(dateValues[i].getTime()).toBeGreaterThanOrEqual(dateValues[i + 1].getTime())
      }
    })

    test('should paginate through PC listings', async ({ page }) => {
      await page.goto('/pc-listings')

      await page.waitForSelector('[data-testid="pc-listing-card"]')

      // Check if pagination exists
      const nextButton = page.locator('[data-testid="next-page"]')

      if (await nextButton.isVisible()) {
        // Get first listing on page 1
        const firstPageListing = await page
          .locator('[data-testid="pc-listing-card"]')
          .first()
          .textContent()

        // Go to page 2
        await nextButton.click()
        await page.waitForSelector('[data-testid="pc-listing-card"]')

        // Get first listing on page 2
        const secondPageListing = await page
          .locator('[data-testid="pc-listing-card"]')
          .first()
          .textContent()

        // Verify different content
        expect(firstPageListing).not.toBe(secondPageListing)

        // Go back to page 1
        await page.click('[data-testid="prev-page"]')
        await page.waitForSelector('[data-testid="pc-listing-card"]')

        // Verify we're back on page 1
        const backToFirstPage = await page
          .locator('[data-testid="pc-listing-card"]')
          .first()
          .textContent()
        expect(backToFirstPage).toBe(firstPageListing)
      }
    })
  })
})
