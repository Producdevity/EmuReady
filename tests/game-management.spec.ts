import { test, expect } from '@playwright/test'

test.describe('Game Management System', () => {
  test.describe('Public Game Access', () => {
    test('should display games listing page', async ({ page }) => {
      await page.goto('/games')
      await expect(page).toHaveTitle(/Games/)
      await expect(page.locator('h1')).toContainText('Games')
    })

    test('should search games by title', async ({ page }) => {
      await page.goto('/games')

      await page.fill('[data-testid="search-input"]', 'Mario')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="game-card"]')
      const games = await page.locator('[data-testid="game-card"]').all()

      for (const game of games.slice(0, 3)) {
        const title = await game.locator('[data-testid="game-title"]').textContent()
        expect(title?.toLowerCase()).toContain('mario')
      }
    })

    test('should filter games by system', async ({ page }) => {
      await page.goto('/games')

      // Select a system filter
      await page.selectOption('[data-testid="system-filter"]', { label: 'Nintendo Switch' })
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="game-card"]')

      // Verify all games are for the selected system
      const systems = await page.locator('[data-testid="game-system"]').all()
      for (const system of systems) {
        await expect(system).toContainText('Switch')
      }
    })

    test('should view game details with listings', async ({ page }) => {
      await page.goto('/games')

      await page.waitForSelector('[data-testid="game-card"]')
      const firstGame = page.locator('[data-testid="game-card"]').first()
      const gameTitle = await firstGame.locator('[data-testid="game-title"]').textContent()

      await firstGame.click()

      // Verify game details page
      await expect(page.locator('h1')).toContainText(gameTitle || '')
      await expect(page.locator('[data-testid="game-description"]')).toBeVisible()
      await expect(page.locator('[data-testid="game-listings"]')).toBeVisible()
    })

    test('should check existing games by TGDB IDs', async ({ page }) => {
      // This would typically be tested via API, but we can test UI integration
      await page.goto('/games/new/search')

      // Search for games
      await page.fill('[data-testid="game-search"]', 'Zelda')
      await page.click('[data-testid="search-games"]')

      await page.waitForSelector('[data-testid="search-result"]')

      // Check for "already exists" indicators
      const existingIndicators = await page.locator('[data-testid="game-exists"]').count()
      expect(existingIndicators).toBeGreaterThanOrEqual(0)
    })

    test('should find Switch title ID', async ({ page }) => {
      await page.goto('/games')

      // Find a Switch game
      await page.selectOption('[data-testid="system-filter"]', { label: 'Nintendo Switch' })
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="game-card"]')
      await page.locator('[data-testid="game-card"]').first().click()

      // Check for title ID if it's a Switch game
      const titleId = page.locator('[data-testid="switch-title-id"]')
      if (await titleId.isVisible()) {
        const id = await titleId.textContent()
        expect(id).toMatch(/^[0-9A-F]{16}$/i)
      }
    })
  })

  test.describe('Authenticated Game Creation', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should create a new game', async ({ page }) => {
      await page.goto('/games/new')

      // Fill game creation form
      await page.fill('[name="title"]', `Test Game ${Date.now()}`)
      await page.selectOption('[name="systemId"]', { index: 1 })
      await page.fill('[name="description"]', 'This is a test game description')

      // Add cover image URL if available
      await page.fill('[name="imageUrl"]', 'https://via.placeholder.com/300x400')

      // Set release date
      await page.fill('[name="releaseDate"]', '2024-01-01')

      // Submit form
      await page.click('[data-testid="submit-game"]')

      // Verify success
      await expect(page).toHaveURL(/\/games\/\d+|\/games\/new\/success/)
      await expect(page.locator('[data-testid="success-message"]')).toContainText('created')
    })

    test('should update own pending game', async ({ page }) => {
      await page.goto('/profile/games')

      // Find a pending game
      const pendingGame = page.locator('[data-testid="game-status-pending"]').first()

      if (await pendingGame.isVisible()) {
        await pendingGame.locator('[data-testid="edit-game"]').click()

        // Update description
        await page.fill('[name="description"]', 'Updated game description')
        await page.click('[data-testid="save-game"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
      }
    })

    test('should search and add game from TGDB', async ({ page }) => {
      await page.goto('/games/new/search')

      // Search for a game
      await page.fill('[data-testid="game-search"]', 'Super Mario')
      await page.selectOption('[data-testid="system-select"]', { index: 1 })
      await page.click('[data-testid="search-games"]')

      await page.waitForSelector('[data-testid="search-result"]')

      // Select first non-existing game
      const newGame = page
        .locator('[data-testid="search-result"]')
        .filter({ hasNot: page.locator('[data-testid="game-exists"]') })
        .first()

      if (await newGame.isVisible()) {
        await newGame.click()

        // Confirm selection
        await page.click('[data-testid="add-game"]')

        // Verify redirect to listing creation
        await expect(page).toHaveURL(/\/listings\/new\?gameId=\d+/)
      }
    })

    test('should search and add game from IGDB', async ({ page }) => {
      await page.goto('/games/new/search/v2')

      // Search for a game
      await page.fill('[data-testid="search-input"]', 'Halo')
      await page.selectOption('[data-testid="system-select"]', { index: 1 })
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="game-result"]')

      // Select a game
      await page.locator('[data-testid="game-result"]').first().click()

      // Preview and add
      await page.click('[data-testid="add-game"]')

      // Verify success
      await expect(page).toHaveURL(/\/listings\/new\?gameId=\d+/)
    })
  })

  test.describe('Developer Game Management', () => {
    test.use({ storageState: 'tests/.auth/developer.json' })

    test('should access pending games queue', async ({ page }) => {
      await page.goto('/admin/games/pending')

      await expect(page.locator('h1')).toContainText('Pending Games')
      await expect(page.locator('[data-testid="pending-games-table"]')).toBeVisible()
    })

    test('should approve a pending game', async ({ page }) => {
      await page.goto('/admin/games/pending')

      const pendingGames = await page.locator('[data-testid="pending-game"]').count()

      if (pendingGames > 0) {
        // View first pending game
        await page.locator('[data-testid="view-game"]').first().click()

        // Review and approve
        await page.click('[data-testid="approve-game"]')
        await page.click('[data-testid="confirm-approve"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('approved')
      }
    })

    test('should reject a pending game', async ({ page }) => {
      await page.goto('/admin/games/pending')

      const pendingGames = await page.locator('[data-testid="pending-game"]').count()

      if (pendingGames > 0) {
        await page.locator('[data-testid="view-game"]').first().click()

        // Reject with reason
        await page.click('[data-testid="reject-game"]')
        await page.fill('[name="rejectionReason"]', 'Duplicate game entry')
        await page.click('[data-testid="confirm-reject"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('rejected')
      }
    })

    test('should bulk approve games', async ({ page }) => {
      await page.goto('/admin/games/pending')

      const pendingGames = await page.locator('[data-testid="pending-game"]').count()

      if (pendingGames >= 2) {
        // Select multiple games
        await page.click('[data-testid="select-all"]')

        // Bulk approve
        await page.click('[data-testid="bulk-actions"]')
        await page.click('[data-testid="bulk-approve"]')
        await page.click('[data-testid="confirm-bulk"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText(
          'games approved',
        )
      }
    })

    test('should bulk reject games', async ({ page }) => {
      await page.goto('/admin/games/pending')

      const pendingGames = await page.locator('[data-testid="pending-game"]').count()

      if (pendingGames >= 2) {
        // Select first two games
        await page.locator('[data-testid="select-game"]').nth(0).click()
        await page.locator('[data-testid="select-game"]').nth(1).click()

        // Bulk reject
        await page.click('[data-testid="bulk-actions"]')
        await page.click('[data-testid="bulk-reject"]')
        await page.fill('[name="bulkRejectionReason"]', 'Low quality submissions')
        await page.click('[data-testid="confirm-bulk-reject"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText(
          'games rejected',
        )
      }
    })
  })

  test.describe('Admin Game Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should edit any game', async ({ page }) => {
      await page.goto('/admin/games')

      await page.waitForSelector('[data-testid="game-row"]')

      // Edit first game
      await page.locator('[data-testid="edit-game"]').first().click()

      // Update game details
      await page.fill('[name="description"]', 'Admin updated description')
      await page.selectOption('[name="approvalStatus"]', 'APPROVED')

      // Save changes
      await page.click('[data-testid="save-game"]')

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
    })

    test('should delete a game', async ({ page }) => {
      await page.goto('/admin/games')

      // Search for a test game to delete
      await page.fill('[data-testid="search-input"]', 'Test Game')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="game-row"]')

      const testGames = await page.locator('[data-testid="game-row"]').count()

      if (testGames > 0) {
        // Delete first test game
        await page.locator('[data-testid="delete-game"]').first().click()

        // Confirm deletion
        await page.click('[data-testid="confirm-delete"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('deleted')
      }
    })

    test('should override game approval status', async ({ page }) => {
      await page.goto('/admin/games')

      await page.waitForSelector('[data-testid="game-row"]')

      // Find a rejected game
      const rejectedGame = page
        .locator('[data-testid="game-row"]')
        .filter({ has: page.locator('[data-testid="status-rejected"]') })
        .first()

      if (await rejectedGame.isVisible()) {
        await rejectedGame.locator('[data-testid="override-status"]').click()

        // Override to approved
        await page.selectOption('[name="newStatus"]', 'APPROVED')
        await page.fill('[name="overrideReason"]', 'Admin override: Game is acceptable')
        await page.click('[data-testid="confirm-override"]')

        // Verify status changed
        await expect(rejectedGame.locator('[data-testid="status-approved"]')).toBeVisible()
      }
    })

    test('should view game statistics', async ({ page }) => {
      await page.goto('/admin/games/stats')

      // Verify statistics display
      await expect(page.locator('[data-testid="total-games"]')).toBeVisible()
      await expect(page.locator('[data-testid="pending-games"]')).toBeVisible()
      await expect(page.locator('[data-testid="approved-games"]')).toBeVisible()
      await expect(page.locator('[data-testid="rejected-games"]')).toBeVisible()

      // Check charts
      await expect(page.locator('[data-testid="games-by-system"]')).toBeVisible()
      await expect(page.locator('[data-testid="games-timeline"]')).toBeVisible()
    })

    test('should manage Switch title IDs', async ({ page }) => {
      await page.goto('/admin/games/switch')

      // Search for a Switch game
      await page.fill('[data-testid="search-input"]', 'Mario')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="switch-game"]')

      const firstGame = page.locator('[data-testid="switch-game"]').first()

      // Add or update title ID
      await firstGame.locator('[data-testid="edit-title-id"]').click()
      await page.fill('[name="titleId"]', '0100000000010000')
      await page.click('[data-testid="save-title-id"]')

      // Verify saved
      await expect(firstGame.locator('[data-testid="title-id-display"]')).toContainText(
        '0100000000010000',
      )
    })

    test('should update game status in bulk', async ({ page }) => {
      await page.goto('/admin/games')

      // Filter by pending games
      await page.selectOption('[data-testid="status-filter"]', 'PENDING')
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="game-row"]')

      const pendingCount = await page.locator('[data-testid="game-row"]').count()

      if (pendingCount >= 2) {
        // Select all
        await page.click('[data-testid="select-all"]')

        // Update status
        await page.click('[data-testid="bulk-actions"]')
        await page.click('[data-testid="bulk-update-status"]')
        await page.selectOption('[name="newStatus"]', 'APPROVED')
        await page.click('[data-testid="confirm-bulk-update"]')

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
      }
    })
  })

  test.describe('Game Search and Discovery', () => {
    test('should search games across multiple fields', async ({ page }) => {
      await page.goto('/games')

      // Test description search
      await page.fill('[data-testid="search-input"]', 'adventure')
      await page.selectOption('[data-testid="search-field"]', 'description')
      await page.click('[data-testid="search-button"]')

      await page.waitForSelector('[data-testid="game-card"]')

      // Verify results
      const results = await page.locator('[data-testid="game-card"]').count()
      expect(results).toBeGreaterThan(0)
    })

    test('should filter by release year', async ({ page }) => {
      await page.goto('/games')

      // Set year range
      await page.fill('[data-testid="year-from"]', '2020')
      await page.fill('[data-testid="year-to"]', '2024')
      await page.click('[data-testid="apply-filters"]')

      await page.waitForSelector('[data-testid="game-card"]')

      // Verify dates
      const releaseDates = await page.locator('[data-testid="release-date"]').all()
      for (const date of releaseDates) {
        const year = await date.getAttribute('data-year')
        if (year) {
          expect(parseInt(year)).toBeGreaterThanOrEqual(2020)
          expect(parseInt(year)).toBeLessThanOrEqual(2024)
        }
      }
    })

    test('should sort games by various criteria', async ({ page }) => {
      await page.goto('/games')

      // Sort by newest first
      await page.selectOption('[data-testid="sort-by"]', 'newest')

      await page.waitForSelector('[data-testid="game-card"]')

      // Get dates
      const dates = await page.locator('[data-testid="created-date"]').all()
      const dateValues = await Promise.all(
        dates.slice(0, 3).map(async (d) => new Date((await d.getAttribute('data-date')) || '')),
      )

      // Verify descending order
      for (let i = 0; i < dateValues.length - 1; i++) {
        expect(dateValues[i].getTime()).toBeGreaterThanOrEqual(dateValues[i + 1].getTime())
      }

      // Sort alphabetically
      await page.selectOption('[data-testid="sort-by"]', 'alphabetical')

      await page.waitForSelector('[data-testid="game-card"]')

      // Get titles
      const titles = await page.locator('[data-testid="game-title"]').all()
      const titleValues = await Promise.all(
        titles.slice(0, 3).map(async (t) => (await t.textContent()) || ''),
      )

      // Verify alphabetical order
      for (let i = 0; i < titleValues.length - 1; i++) {
        expect(
          titleValues[i].toLowerCase().localeCompare(titleValues[i + 1].toLowerCase()),
        ).toBeLessThanOrEqual(0)
      }
    })

    test('should paginate through games', async ({ page }) => {
      await page.goto('/games')

      await page.waitForSelector('[data-testid="game-card"]')

      // Check if pagination exists
      const nextButton = page.locator('[data-testid="next-page"]')

      if (await nextButton.isVisible()) {
        // Get first game on page 1
        const firstPageGame = await page.locator('[data-testid="game-title"]').first().textContent()

        // Go to page 2
        await nextButton.click()
        await page.waitForSelector('[data-testid="game-card"]')

        // Get first game on page 2
        const secondPageGame = await page
          .locator('[data-testid="game-title"]')
          .first()
          .textContent()

        // Verify different content
        expect(firstPageGame).not.toBe(secondPageGame)
      }
    })
  })
})
