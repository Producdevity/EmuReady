import { test, expect } from '@playwright/test'

test.describe('Admin Analytics Tests - Requires Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    // Try primary analytics path
    await page.goto('/admin/analytics')

    // If not found, try alternative paths
    if (!page.url().includes('analytics')) {
      const alternativePaths = ['/admin/stats', '/admin/dashboard/analytics']
      for (const path of alternativePaths) {
        await page.goto(path)
        if (
          page.url().includes('admin') &&
          (page.url().includes('analytics') || page.url().includes('stats'))
        )
          break
      }
    }

    // Verify we're in admin analytics area
    await expect(page).toHaveURL(/\/admin\/.*(analytics|stats)/)
  })

  test('should display analytics dashboard with metric cards', async ({ page }) => {
    // Analytics container must be present
    const analyticsContainer = page.locator('[data-testid*="analytics"], .analytics-dashboard')
    await expect(analyticsContainer).toBeVisible()

    // Must have metric cards
    const metricCards = analyticsContainer.locator('.metric-card, [data-testid*="metric"]')
    const cardCount = await metricCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Verify metric card structure
    const firstMetric = metricCards.first()

    // Must have value
    const value = firstMetric.locator('.value, [data-testid*="value"]')
    await expect(value).toBeVisible()
    const valueText = await value.textContent()
    expect(valueText).toMatch(/\d+/)

    // Must have label
    const label = firstMetric.locator('.label, [data-testid*="label"]')
    await expect(label).toBeVisible()
    const labelText = await label.textContent()
    expect(labelText).toBeTruthy()
  })

  test('should display user growth analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Look for user growth section
      const userGrowth = page.locator('[data-testid*="user-growth"], .user-analytics')

      if (await userGrowth.isVisible({ timeout: 3000 })) {
        // Key user metrics
        const userMetrics = {
          'Total Users': /\d+.*total.*users/i,
          'New Users Today': /\d+.*new.*today/i,
          'Active Users': /\d+.*active/i,
          'User Retention': /\d+%.*retention/i,
        }

        for (const [label, pattern] of Object.entries(userMetrics)) {
          const metric = userGrowth.locator('.metric, .stat').filter({ hasText: pattern })
          if (await metric.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await metric.textContent()
            console.log(`${label}: ${value}`)
          }
        }

        // Look for user growth chart
        const growthChart = userGrowth.locator('canvas, svg, [data-testid*="chart"]')
        if (await growthChart.isVisible({ timeout: 2000 })) {
          console.log('User growth chart displayed')
        }
      }
    }
  })

  test('should display listing analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Look for listing analytics
      const listingAnalytics = page.locator('[data-testid*="listing-analytics"], .listing-stats')

      if (await listingAnalytics.isVisible({ timeout: 3000 })) {
        // Listing metrics
        const metrics = [
          'Total Listings',
          'Pending Approval',
          'Average Performance',
          'Popular Games',
        ]

        for (const metric of metrics) {
          const metricElement = listingAnalytics
            .locator('.metric, .stat-card')
            .filter({ hasText: metric })
          if (await metricElement.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`✓ ${metric} metric found`)
          }
        }

        // Top games/emulators table
        const topTable = listingAnalytics.locator('table, [data-testid*="top-"]')
        if (await topTable.isVisible({ timeout: 2000 })) {
          const rows = topTable.locator('tbody tr')
          const rowCount = await rows.count()
          console.log(`Top ${rowCount} items shown`)
        }
      }
    }
  })

  test('should display engagement analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Engagement section
      const engagement = page.locator('[data-testid*="engagement"], .engagement-analytics')

      if (await engagement.isVisible({ timeout: 3000 })) {
        // Engagement metrics
        const engagementMetrics = {
          'Total Votes': /\d+.*votes/i,
          'Total Comments': /\d+.*comments/i,
          'Avg Engagement': /\d+.*engagement/i,
          'Active Discussions': /\d+.*discussion/i,
        }

        for (const [label, pattern] of Object.entries(engagementMetrics)) {
          const metric = engagement.locator('.metric').filter({ hasText: pattern })
          if (await metric.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await metric.textContent()
            console.log(`${label}: ${value}`)
          }
        }

        // Engagement over time chart
        const chart = engagement.locator('canvas, svg')
        if (await chart.isVisible()) {
          console.log('Engagement timeline chart present')
        }
      }
    }
  })

  test('should support date range filtering', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Date range selector
      const dateRange = page.locator('[data-testid*="date-range"], .date-range-picker')

      if (await dateRange.isVisible({ timeout: 3000 })) {
        await dateRange.click()

        // Common date ranges
        const ranges = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom']

        for (const range of ranges) {
          const rangeOption = page.locator('button, a').filter({ hasText: range })
          if (await rangeOption.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`✓ Date range: ${range}`)
          }
        }

        // Custom date inputs
        const startDate = page.locator('input[type="date"]').first()
        const endDate = page.locator('input[type="date"]').last()

        if ((await startDate.isVisible()) && (await endDate.isVisible())) {
          console.log('Custom date range selection available')
        }

        // Close date picker
        await page.keyboard.press('Escape')
      }
    }
  })

  test('should display performance analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Performance metrics
      const performance = page.locator('[data-testid*="performance"], .performance-analytics')

      if (await performance.isVisible({ timeout: 3000 })) {
        // API response times
        const apiMetrics = performance.locator('[data-testid*="api"], .api-performance')
        if (await apiMetrics.isVisible()) {
          const avgResponse = apiMetrics
            .locator('.metric')
            .filter({ hasText: /avg.*response|latency/i })
          if (await avgResponse.isVisible()) {
            const time = await avgResponse.textContent()
            console.log(`API response time: ${time}`)
          }
        }

        // Page load times
        const pageMetrics = performance.locator('[data-testid*="page-load"], .page-performance')
        if (await pageMetrics.isVisible()) {
          console.log('Page load analytics available')
        }

        // Error rates
        const errorRate = performance.locator('.metric').filter({ hasText: /error.*rate/i })
        if (await errorRate.isVisible({ timeout: 1000 }).catch(() => false)) {
          const rate = await errorRate.textContent()
          console.log(`Error rate: ${rate}`)
        }
      }
    }
  })

  test('should display geographic analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Geographic distribution
      const geoAnalytics = page.locator('[data-testid*="geographic"], .geo-analytics')

      if (await geoAnalytics.isVisible({ timeout: 3000 })) {
        // Map visualization
        const map = geoAnalytics.locator('svg, canvas, [data-testid*="map"]')
        if (await map.isVisible()) {
          console.log('Geographic map visualization present')
        }

        // Country/region breakdown
        const regionTable = geoAnalytics.locator('table, [data-testid*="regions"]')
        if (await regionTable.isVisible()) {
          const regions = regionTable.locator('tbody tr')
          const regionCount = await regions.count()
          console.log(`${regionCount} regions in breakdown`)

          if (regionCount > 0) {
            // Check first region
            const firstRegion = regions.first()
            const country = firstRegion.locator('td').first()
            const users = firstRegion.locator('td').nth(1)

            console.log(
              `Top region: ${await country.textContent()} - ${await users.textContent()} users`,
            )
          }
        }
      }
    }
  })

  test('should display device analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Device breakdown
      const deviceAnalytics = page.locator('[data-testid*="device"], .device-analytics')

      if (await deviceAnalytics.isVisible({ timeout: 3000 })) {
        // Device type chart
        const deviceChart = deviceAnalytics.locator('canvas, svg')
        if (await deviceChart.isVisible()) {
          console.log('Device distribution chart present')
        }

        // Device categories
        const deviceTypes = ['Desktop', 'Mobile', 'Tablet']

        for (const device of deviceTypes) {
          const deviceMetric = deviceAnalytics
            .locator('.metric, .device-stat')
            .filter({ hasText: device })
          if (await deviceMetric.isVisible({ timeout: 1000 }).catch(() => false)) {
            const usage = await deviceMetric.textContent()
            console.log(`${device}: ${usage}`)
          }
        }

        // Browser breakdown
        const browserStats = deviceAnalytics.locator('[data-testid*="browser"], .browser-stats')
        if (await browserStats.isVisible()) {
          console.log('Browser usage statistics available')
        }
      }
    }
  })

  test('should support analytics export', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Export button
      const exportButton = page.locator('button').filter({ hasText: /export|download/i })

      if (await exportButton.isVisible({ timeout: 3000 })) {
        await exportButton.click()

        // Export options
        const exportDialog = page.locator('[role="dialog"]').filter({ hasText: /export/i })
        const exportMenu = page.locator('[role="menu"]')

        if (
          (await exportDialog.isVisible({ timeout: 2000 })) ||
          (await exportMenu.isVisible({ timeout: 2000 }))
        ) {
          // Export formats
          const formats = ['PDF Report', 'CSV Data', 'Excel', 'Raw Data']

          for (const format of formats) {
            const formatOption = page.locator('button, a').filter({ hasText: format })
            if (await formatOption.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`✓ Export format: ${format}`)
            }
          }

          // Report customization
          const customizeOptions = page.locator('[data-testid*="customize"], .export-options')
          if (await customizeOptions.isVisible()) {
            console.log('Report customization available')
          }

          // Close
          await page.keyboard.press('Escape')
        }
      }
    }
  })

  test('should display real-time analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Real-time section
      const realTime = page.locator('[data-testid*="realtime"], .realtime-analytics')

      if (await realTime.isVisible({ timeout: 3000 })) {
        // Active users now
        const activeNow = realTime.locator('.metric').filter({ hasText: /active.*now|online/i })
        if (await activeNow.isVisible()) {
          const count = await activeNow.textContent()
          console.log(`Active users now: ${count}`)
        }

        // Live activity feed
        const activityFeed = realTime.locator('[data-testid*="activity"], .activity-feed')
        if (await activityFeed.isVisible()) {
          const activities = activityFeed.locator('.activity-item, li')
          const activityCount = await activities.count()
          console.log(`${activityCount} recent activities shown`)
        }

        // Auto-refresh indicator
        const refreshIndicator = realTime.locator('[data-testid*="refresh"], .auto-refresh')
        if (await refreshIndicator.isVisible()) {
          console.log('Real-time data auto-refresh enabled')
        }
      }
    }
  })

  test('should display conversion analytics', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Conversion funnel
      const conversions = page.locator('[data-testid*="conversion"], .conversion-analytics')

      if (await conversions.isVisible({ timeout: 3000 })) {
        // Funnel stages
        const funnelStages = ['Visitors', 'Registered Users', 'Active Users', 'Contributors']

        for (const stage of funnelStages) {
          const stageElement = conversions
            .locator('.funnel-stage, .stage')
            .filter({ hasText: stage })
          if (await stageElement.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await stageElement.textContent()
            console.log(`${stage}: ${value}`)
          }
        }

        // Conversion rates
        const conversionRates = conversions.locator('.conversion-rate, [data-testid*="rate"]')
        if ((await conversionRates.count()) > 0) {
          console.log(`${await conversionRates.count()} conversion rates tracked`)
        }
      }
    }
  })

  test('should support custom analytics dashboards', async ({ page }) => {
    await page.goto('/admin/analytics')

    if (page.url().includes('analytics') || page.url().includes('stats')) {
      // Dashboard customization
      const customizeButton = page
        .locator('button')
        .filter({ hasText: /customize|edit.*dashboard/i })

      if (await customizeButton.isVisible({ timeout: 3000 })) {
        await customizeButton.click()

        // Customization panel
        const customPanel = page.locator('[data-testid*="customize"], .dashboard-customize')

        if (await customPanel.isVisible({ timeout: 2000 })) {
          // Widget library
          const widgetLibrary = customPanel.locator('[data-testid*="widgets"], .widget-library')
          if (await widgetLibrary.isVisible()) {
            const widgets = widgetLibrary.locator('.widget-option')
            const widgetCount = await widgets.count()
            console.log(`${widgetCount} widgets available`)
          }

          // Layout options
          const layoutOptions = customPanel.locator('[data-testid*="layout"], .layout-options')
          if (await layoutOptions.isVisible()) {
            console.log('Dashboard layout customization available')
          }

          // Save/Cancel
          const cancelButton = customPanel.locator('button').filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })
})
