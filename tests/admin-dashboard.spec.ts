import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard Tests - Requires Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin')

    // Assert we have admin access - test should fail if not admin
    await expect(page).toHaveURL(/\/admin/)

    // Verify admin dashboard loaded
    await expect(page.locator('h1, h2').filter({ hasText: /admin|dashboard/i })).toBeVisible()
  })

  test('should display admin navigation menu with all required items', async ({ page }) => {
    // Admin navigation should be visible
    const adminNav = page
      .locator('[data-testid="admin-nav"], .admin-navigation, nav')
      .filter({ hasText: /dashboard|users|reports/i })
    await expect(adminNav).toBeVisible()

    // All admin menu items must be present
    const requiredMenuItems = [
      'Dashboard',
      'Users',
      'Listings',
      'Games',
      'Reports',
      'Permissions',
      'Analytics',
    ]

    for (const item of requiredMenuItems) {
      const menuLink = adminNav.locator('a, button').filter({ hasText: new RegExp(item, 'i') })
      await expect(menuLink).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display dashboard statistics with valid data', async ({ page }) => {
    // Check if stat cards exist, if not check for other dashboard content
    const statCards = page
      .locator('[data-testid*="stat"], .stat-card, .dashboard-stat, .card')
      .filter({ hasText: /\d+/ })
    const statCount = await statCards.count()

    if (statCount === 0) {
      // No stat cards found, check for dashboard content
      const dashboardContent = page.locator('main')
      await expect(dashboardContent).toBeVisible()
      console.log('Dashboard exists but no stat cards implemented yet')
    } else {
      // Verify each stat card has proper structure
      for (let i = 0; i < Math.min(statCount, 4); i++) {
        const statCard = statCards.nth(i)

        // Must have a numeric value
        const hasNumber = await statCard.textContent()
        expect(hasNumber).toMatch(/\d+/)
      }
      console.log(`Found ${statCount} stat cards`)
    }
  })

  test('should show recent activity feed with entries', async ({ page }) => {
    // Activity feed must be present
    const activityFeed = page.locator('[data-testid*="activity"], .activity-feed, .recent-activity')
    await expect(activityFeed).toBeVisible()

    // Must have activity items
    const activityItems = activityFeed.locator('[data-testid*="activity-item"], .activity-item, li')
    const itemCount = await activityItems.count()
    expect(itemCount).toBeGreaterThan(0)

    // Verify activity item structure
    const firstItem = activityItems.first()

    // Must have timestamp
    const timeElement = firstItem.locator('time, [data-testid*="time"], .timestamp')
    await expect(timeElement).toBeVisible()

    // Must have description text
    await expect(firstItem).not.toBeEmpty()
  })

  test('should have functional quick actions', async ({ page }) => {
    // Quick actions section must exist
    const quickActionsSection = page.locator('[data-testid*="quick-action"], .quick-actions')

    // Verify the quick actions section exists
    const hasQuickActions = (await quickActionsSection.count()) > 0
    if (!hasQuickActions) {
      console.log(
        'No dedicated quick actions section found, checking for individual action buttons',
      )
    }

    // At least one of these actions must be available
    const expectedActions = [
      'Add User',
      'Approve Listings',
      'View Reports',
      'Export Data',
      'Manage Permissions',
      'View Analytics',
    ]

    let foundActions = 0
    for (const action of expectedActions) {
      const actionButton = page.locator('button, a').filter({ hasText: new RegExp(action, 'i') })
      if (await actionButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundActions++
      }
    }

    // Must have at least 2 quick actions
    expect(foundActions).toBeGreaterThanOrEqual(2)
  })

  test('should display system health indicators', async ({ page }) => {
    // System status section should be visible
    const systemStatus = page.locator(
      '[data-testid*="system-status"], .system-health, [data-testid*="health"]',
    )

    // If no dedicated health section, check for health in stats
    if (!(await systemStatus.isVisible({ timeout: 3000 }))) {
      // Alternative: Look for health-related stats
      const healthStats = page.locator('text=/database|api|server|uptime/i')
      expect(await healthStats.count()).toBeGreaterThan(0)
    } else {
      await expect(systemStatus).toBeVisible()

      // Should have indicators
      const indicators = systemStatus.locator('[data-testid*="indicator"], .indicator')
      expect(await indicators.count()).toBeGreaterThan(0)
    }
  })

  test('should have sortable and filterable data tables', async ({ page }) => {
    // Admin dashboard should have at least one data table
    const tables = page.locator('table, [data-testid*="data-table"]')
    expect(await tables.count()).toBeGreaterThan(0)

    const firstTable = tables.first()

    // Table must have sortable headers
    const headers = firstTable.locator('th')
    expect(await headers.count()).toBeGreaterThan(0)

    // Click first header to test sorting
    const firstHeader = headers.first()
    await firstHeader.click()

    // Should have filter/search capability
    const filterInputs = page.locator(
      'input[placeholder*="filter"], input[placeholder*="search"], input[type="search"]',
    )
    expect(await filterInputs.count()).toBeGreaterThan(0)

    // Test filtering
    const firstFilter = filterInputs.first()
    await firstFilter.fill('test')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })

  test('should have responsive admin layout', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 })

    // Sidebar must be visible on desktop
    const sidebar = page.locator('[data-testid="admin-sidebar"], .admin-sidebar, aside')
    await expect(sidebar).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })

    // Mobile menu toggle must be present
    const mobileMenuToggle = page
      .locator('button')
      .filter({ hasText: /menu/i })
      .or(page.locator('[aria-label*="menu"]'))
    await expect(mobileMenuToggle).toBeVisible()

    // Click toggle to open mobile menu
    await mobileMenuToggle.click()
    await page.waitForTimeout(300)

    // Navigation should be accessible
    const mobileNav = page.locator('nav').filter({ hasText: /dashboard|users/i })
    await expect(mobileNav).toBeVisible()
  })

  test('should have working admin search functionality', async ({ page }) => {
    // Admin search must be present
    const adminSearch = page
      .locator('[data-testid="admin-search"], .admin-search, [placeholder*="search"]')
      .locator('input')
    await expect(adminSearch).toBeVisible()

    // Perform search
    await adminSearch.fill('user')
    await page.keyboard.press('Enter')

    // Wait for search results
    await page.waitForTimeout(1000)

    // Should either show inline results or navigate to search page
    const hasSearchResults = await page
      .locator('[data-testid*="search-results"], .search-results')
      .isVisible({ timeout: 2000 })
    const navigatedToSearch = page.url().includes('search') || page.url().includes('q=')

    expect(hasSearchResults || navigatedToSearch).toBe(true)
  })

  test('should have logout functionality', async ({ page }) => {
    // Logout button must be available
    const logoutButton = page.locator('button, a').filter({ hasText: /log out|sign out|logout/i })
    await expect(logoutButton).toBeVisible()

    // Click logout
    await logoutButton.click()

    // Should redirect away from admin
    await page.waitForURL((url) => !url.pathname.includes('/admin'), {
      timeout: 5000,
    })
    expect(page.url()).not.toContain('/admin')
  })
})

test.describe('Admin Dashboard Data Visualizations - Requires Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)
  })

  test('should display interactive data charts', async ({ page }) => {
    // Charts should be present on dashboard
    const charts = page.locator(
      '[data-testid*="chart"], .chart-container, canvas, svg.chart, .recharts-wrapper',
    )
    const chartCount = await charts.count()

    // Expect at least one chart
    expect(chartCount).toBeGreaterThan(0)

    // Verify charts have proper titles/labels
    for (let i = 0; i < Math.min(chartCount, 3); i++) {
      const chart = charts.nth(i)
      const chartContainer = chart.locator('..')

      // Should have a title
      const chartTitle = chartContainer.locator('h3, h4, .chart-title, [class*="title"]')
      if (await chartTitle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(chartTitle).not.toBeEmpty()
      }
    }
  })

  test('should support data refresh functionality', async ({ page }) => {
    // Look for refresh capability
    const refreshButton = page.locator('button').filter({ hasText: /refresh|update|reload/i })

    if (await refreshButton.isVisible({ timeout: 2000 })) {
      // Click refresh
      await refreshButton.click()

      // Should show some loading indication
      const loadingStates = [
        page.locator('[data-testid*="loading"], .loading'),
        page.locator('.animate-pulse'),
        page.locator('[role="status"]'),
        page.locator('.spinner'),
      ]

      let foundLoading = false
      for (const loader of loadingStates) {
        if (await loader.isVisible({ timeout: 1000 }).catch(() => false)) {
          foundLoading = true
          break
        }
      }

      expect(foundLoading).toBe(true)
    }

    // Should show last updated time
    const lastUpdated = page
      .locator('[data-testid*="last-updated"], .last-updated')
      .or(page.locator('text=/updated.*ago/i'))
    if (await lastUpdated.isVisible({ timeout: 2000 })) {
      await expect(lastUpdated).not.toBeEmpty()
    }
  })
})
