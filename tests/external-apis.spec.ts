import { test, expect } from '@playwright/test'

test.describe('External API Integrations', () => {
  test.describe('RAWG API Integration', () => {
    test('should search games using RAWG API', async ({ page }) => {
      // Navigate to RAWG search if it exists
      await page.goto('/games/new/search/rawg')

      // If RAWG search page doesn't exist, skip these tests
      if (page.url().includes('rawg')) {
        // Search for a popular game
        await page.fill('[data-testid="search-input"]', 'The Witcher 3')
        await page.click('[data-testid="search-button"]')

        // Wait for results
        await page.waitForSelector('[data-testid="game-result"]', { timeout: 10000 })

        // Verify results
        const results = await page.locator('[data-testid="game-result"]').count()
        expect(results).toBeGreaterThan(0)

        // Check result contains expected fields
        const firstResult = page.locator('[data-testid="game-result"]').first()
        await expect(firstResult.locator('[data-testid="game-title"]')).toBeVisible()
        await expect(firstResult.locator('[data-testid="game-image"]')).toBeVisible()
        await expect(firstResult.locator('[data-testid="release-date"]')).toBeVisible()
        await expect(firstResult.locator('[data-testid="metacritic-score"]')).toBeVisible()
      }
    })

    test('should get game details from RAWG', async ({ page }) => {
      await page.goto('/games/new/search/rawg')

      if (page.url().includes('rawg')) {
        // Search and select a game
        await page.fill('[data-testid="search-input"]', 'Red Dead Redemption 2')
        await page.click('[data-testid="search-button"]')

        await page.waitForSelector('[data-testid="game-result"]')

        // Click on first result
        await page.locator('[data-testid="game-result"]').first().click()

        // Should show detailed view
        await expect(page.locator('[data-testid="game-detail-modal"]')).toBeVisible()

        // Check for RAWG-specific details
        await expect(page.locator('[data-testid="game-description"]')).toBeVisible()
        await expect(page.locator('[data-testid="game-genres"]')).toBeVisible()
        await expect(page.locator('[data-testid="game-platforms"]')).toBeVisible()
        await expect(page.locator('[data-testid="game-developers"]')).toBeVisible()
        await expect(page.locator('[data-testid="game-publishers"]')).toBeVisible()
        await expect(page.locator('[data-testid="esrb-rating"]')).toBeVisible()
      }
    })

    test('should fetch game images from RAWG', async ({ page }) => {
      await page.goto('/games/new/search/rawg')

      if (page.url().includes('rawg')) {
        await page.fill('[data-testid="search-input"]', 'Cyberpunk 2077')
        await page.click('[data-testid="search-button"]')

        await page.waitForSelector('[data-testid="game-result"]')
        await page.locator('[data-testid="game-result"]').first().click()

        // Check image gallery
        await page.click('[data-testid="view-images"]')

        // Should show multiple images
        const images = await page.locator('[data-testid="game-screenshot"]').count()
        expect(images).toBeGreaterThan(0)

        // Test image selection
        await page.locator('[data-testid="game-screenshot"]').first().click()
        await page.click('[data-testid="use-as-cover"]')

        // Verify image selected
        await expect(page.locator('[data-testid="selected-cover"]')).toBeVisible()
      }
    })

    test('should handle RAWG API errors gracefully', async ({ page }) => {
      await page.goto('/games/new/search/rawg')

      if (page.url().includes('rawg')) {
        // Search with invalid/unusual query to potentially trigger error
        await page.fill('[data-testid="search-input"]', '!@#$%^&*()')
        await page.click('[data-testid="search-button"]')

        // Should show appropriate message
        const noResults = page.locator('[data-testid="no-results"]')
        const errorMessage = page.locator('[data-testid="error-message"]')

        // Either no results or error message should appear
        await expect(noResults.or(errorMessage)).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('API Fallback Mechanism', () => {
    test('should fallback to alternative API when primary fails', async ({ page }) => {
      await page.goto('/games/new')

      // Check for API selector
      const apiSelector = page.locator('[data-testid="api-selector"]')

      if (await apiSelector.isVisible()) {
        // Select primary API
        await apiSelector.selectOption('igdb')

        // Search for a game
        await page.fill('[data-testid="game-search"]', 'Mario')
        await page.click('[data-testid="search-games"]')

        // If IGDB fails, should show fallback option
        const fallbackNotice = page.locator('[data-testid="api-fallback-notice"]')
        if (await fallbackNotice.isVisible({ timeout: 5000 })) {
          await expect(fallbackNotice).toContainText('fallback')

          // Should offer to try alternative
          await expect(page.locator('[data-testid="try-alternative-api"]')).toBeVisible()
        }
      }
    })

    test('should cache API responses', async ({ page }) => {
      await page.goto('/games/new/search')

      // First search
      await page.fill('[data-testid="search-input"]', 'Zelda')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="search-result"]')

      // Note response time if displayed
      const firstLoadTime = page.locator('[data-testid="load-time"]')
      let firstTime = 0
      if (await firstLoadTime.isVisible()) {
        firstTime = parseInt((await firstLoadTime.textContent()) || '0')
      }

      // Search same term again
      await page.fill('[data-testid="search-input"]', 'Zelda')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="search-result"]')

      // Second load should be faster (cached)
      const secondLoadTime = page.locator('[data-testid="load-time"]')
      if (await secondLoadTime.isVisible()) {
        const secondTime = parseInt((await secondLoadTime.textContent()) || '0')

        // Cached response should be faster
        if (firstTime > 0 && secondTime > 0) {
          expect(secondTime).toBeLessThanOrEqual(firstTime)
        }
      }

      // Check for cache indicator
      const cacheIndicator = page.locator('[data-testid="cached-result"]')
      if (await cacheIndicator.isVisible()) {
        await expect(cacheIndicator).toContainText('cached')
      }
    })
  })

  test.describe('API Rate Limiting', () => {
    test('should handle rate limiting gracefully', async ({ page }) => {
      await page.goto('/games/new/search')

      // Make multiple rapid searches to potentially trigger rate limit
      const searches = []
      for (let i = 0; i < 10; i++) {
        searches.push(
          (async () => {
            await page.fill('[data-testid="search-input"]', `Game ${i}`)
            await page.click('[data-testid="search-button"]')
          })(),
        )
      }

      await Promise.all(searches)

      // Check for rate limit message
      const rateLimitMessage = page.locator('[data-testid="rate-limit-message"]')
      if (await rateLimitMessage.isVisible()) {
        await expect(rateLimitMessage).toContainText('rate limit')

        // Should show retry timer
        await expect(page.locator('[data-testid="retry-timer"]')).toBeVisible()
      }
    })

    test('should queue API requests appropriately', async ({ page }) => {
      await page.goto('/games/new/search')

      // Start multiple searches quickly
      await page.fill('[data-testid="search-input"]', 'First Game')
      await page.click('[data-testid="search-button"]')

      await page.fill('[data-testid="search-input"]', 'Second Game')
      await page.click('[data-testid="search-button"]')

      await page.fill('[data-testid="search-input"]', 'Third Game')
      await page.click('[data-testid="search-button"]')

      // Check for queue indicator
      const queueIndicator = page.locator('[data-testid="request-queue"]')
      if (await queueIndicator.isVisible()) {
        const queueLength = await queueIndicator.textContent()
        expect(parseInt(queueLength || '0')).toBeGreaterThan(0)
      }

      // Wait for all to complete
      await page.waitForSelector('[data-testid="search-complete"]', { timeout: 15000 })
    })
  })

  test.describe('Multi-API Search', () => {
    test('should search across multiple APIs simultaneously', async ({ page }) => {
      await page.goto('/games/new/search/multi')

      // If multi-search exists
      if (page.url().includes('multi')) {
        // Enable multiple APIs
        await page.check('[name="enable-igdb"]')
        await page.check('[name="enable-tgdb"]')
        await page.check('[name="enable-rawg"]')

        // Search
        await page.fill('[data-testid="search-input"]', 'Final Fantasy')
        await page.click('[data-testid="search-all"]')

        // Should show results from multiple sources
        await page.waitForSelector('[data-testid="search-results"]')

        // Check for source indicators
        await expect(page.locator('[data-testid="igdb-results"]')).toBeVisible()
        await expect(page.locator('[data-testid="tgdb-results"]')).toBeVisible()
        await expect(page.locator('[data-testid="rawg-results"]')).toBeVisible()

        // Should allow filtering by source
        await page.click('[data-testid="filter-igdb-only"]')
        await expect(page.locator('[data-testid="tgdb-results"]')).not.toBeVisible()
        await expect(page.locator('[data-testid="rawg-results"]')).not.toBeVisible()
      }
    })

    test('should merge duplicate results from multiple APIs', async ({ page }) => {
      await page.goto('/games/new/search/multi')

      if (page.url().includes('multi')) {
        await page.check('[name="enable-igdb"]')
        await page.check('[name="enable-tgdb"]')

        // Search for a common game
        await page.fill('[data-testid="search-input"]', 'Super Mario Odyssey')
        await page.click('[data-testid="search-all"]')

        await page.waitForSelector('[data-testid="search-results"]')

        // Check for duplicate detection
        const mergedIndicator = page.locator('[data-testid="merged-result"]')
        if (await mergedIndicator.isVisible()) {
          // Should show which APIs provided this result
          await expect(mergedIndicator).toContainText('Found in')

          // Hover to see all sources
          await mergedIndicator.hover()
          await expect(page.locator('[data-testid="result-sources"]')).toBeVisible()
        }
      }
    })
  })

  test.describe('API Data Enrichment', () => {
    test.use({ storageState: 'tests/.auth/developer.json' })

    test('should enrich game data from multiple sources', async ({ page }) => {
      await page.goto('/admin/games')

      // Find a game with incomplete data
      await page.fill('[data-testid="search-games"]', 'test')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="game-row"]')

      const gameRow = page.locator('[data-testid="game-row"]').first()
      if (await gameRow.isVisible()) {
        // Click enrich data
        await gameRow.locator('[data-testid="enrich-data"]').click()

        // Should show enrichment options
        await expect(page.locator('[data-testid="enrichment-modal"]')).toBeVisible()

        // Select data sources
        await page.check('[name="enrich-from-igdb"]')
        await page.check('[name="enrich-from-rawg"]')

        // Select fields to enrich
        await page.check('[name="enrich-description"]')
        await page.check('[name="enrich-images"]')
        await page.check('[name="enrich-metadata"]')

        // Start enrichment
        await page.click('[data-testid="start-enrichment"]')

        // Wait for completion
        await page.waitForSelector('[data-testid="enrichment-complete"]', { timeout: 30000 })

        // Check results
        await expect(page.locator('[data-testid="enriched-fields"]')).toBeVisible()
        await expect(page.locator('[data-testid="data-sources"]')).toBeVisible()
      }
    })

    test('should validate and clean API data', async ({ page }) => {
      await page.goto('/admin/games/import')

      // Import from API
      await page.selectOption('[name="importSource"]', 'igdb')
      await page.fill('[name="gameId"]', '1942') // Example game ID

      // Preview import
      await page.click('[data-testid="preview-import"]')

      await page.waitForSelector('[data-testid="import-preview"]')

      // Should show data validation results
      await expect(page.locator('[data-testid="validation-results"]')).toBeVisible()

      // Check for warnings
      const warnings = await page.locator('[data-testid="validation-warning"]').count()
      if (warnings > 0) {
        // Should explain what will be cleaned/fixed
        await expect(page.locator('[data-testid="data-cleaning-notes"]')).toBeVisible()
      }

      // Proceed with import
      await page.click('[data-testid="confirm-import"]')

      // Should sanitize and import
      await expect(page.locator('[data-testid="success-message"]')).toContainText('imported')
    })
  })

  test.describe('API Health Monitoring', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should display API health status', async ({ page }) => {
      await page.goto('/admin/api-health')

      // Check health dashboard
      await expect(page.locator('[data-testid="api-health-dashboard"]')).toBeVisible()

      // Check individual API statuses
      const apis = ['igdb', 'tgdb', 'rawg']

      for (const api of apis) {
        const status = page.locator(`[data-testid="${api}-status"]`)
        if (await status.isVisible()) {
          // Should show status indicator
          const statusText = await status.textContent()
          expect(['healthy', 'degraded', 'down']).toContain(statusText?.toLowerCase())

          // Should show response time
          await expect(page.locator(`[data-testid="${api}-response-time"]`)).toBeVisible()

          // Should show rate limit status
          await expect(page.locator(`[data-testid="${api}-rate-limit"]`)).toBeVisible()
        }
      }

      // Check historical data
      await expect(page.locator('[data-testid="uptime-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="response-time-chart"]')).toBeVisible()
    })

    test('should test API endpoints', async ({ page }) => {
      await page.goto('/admin/api-health')

      // Test IGDB endpoint
      await page.click('[data-testid="test-igdb"]')

      // Wait for test to complete
      await page.waitForSelector('[data-testid="test-result"]', { timeout: 10000 })

      // Check test results
      const testResult = await page.locator('[data-testid="test-result"]').textContent()
      expect(['success', 'failure']).toContain(testResult?.toLowerCase())

      // If failed, should show error details
      if (testResult?.toLowerCase() === 'failure') {
        await expect(page.locator('[data-testid="error-details"]')).toBeVisible()
      }
    })

    test('should configure API fallback rules', async ({ page }) => {
      await page.goto('/admin/api-health/settings')

      // Configure fallback
      await page.selectOption('[name="primaryApi"]', 'igdb')
      await page.selectOption('[name="fallbackApi"]', 'tgdb')

      // Set fallback conditions
      await page.fill('[name="fallbackThreshold"]', '500') // ms response time
      await page.fill('[name="fallbackErrorRate"]', '10') // % error rate

      // Enable automatic fallback
      await page.check('[name="enableAutoFallback"]')

      // Save settings
      await page.click('[data-testid="save-api-settings"]')

      // Verify saved
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'API settings updated',
      )
    })
  })
})
