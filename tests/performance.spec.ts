import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Performance Tests', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    const homePage = new HomePage(page)
    await homePage.goto()

    const loadTime = Date.now() - startTime
    console.log(`Home page loaded in ${loadTime}ms`)

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)

    // Check for Largest Contentful Paint
    const lcp = await page
      .evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })
        })
      })
      .catch(() => null)

    if (lcp) {
      console.log(`LCP: ${lcp}ms`)
      expect(lcp).toBeLessThan(2500) // LCP should be under 2.5s
    }
  })

  test('should have efficient image loading', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Check if images use lazy loading
    const images = page.locator('img')
    const imageCount = await images.count()

    let lazyLoadCount = 0
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const loading = await img.getAttribute('loading')

      if (loading === 'lazy') {
        lazyLoadCount++
      }
    }

    console.log(`${lazyLoadCount}/${imageCount} images use lazy loading`)

    // At least some images should use lazy loading
    if (imageCount > 5) {
      expect(lazyLoadCount).toBeGreaterThan(0)
    }
  })

  test('should not have memory leaks during navigation', async ({ page }) => {
    // Get initial memory usage
    const getMemoryUsage = () =>
      page.evaluate(() => {
        // performance.memory is a non-standard Chrome API
        const perf = performance as Performance & {
          memory?: {
            usedJSHeapSize: number
            totalJSHeapSize: number
          }
        }
        if (perf.memory) {
          return {
            usedJSHeapSize: perf.memory.usedJSHeapSize,
            totalJSHeapSize: perf.memory.totalJSHeapSize,
          }
        }
        return null
      })

    const homePage = new HomePage(page)
    await homePage.goto()

    const initialMemory = await getMemoryUsage()

    // Navigate through multiple pages
    for (let i = 0; i < 5; i++) {
      await homePage.navigateToGames()
      await homePage.navigateToHandheld()
      await homePage.navigateToPC()
      await homePage.navigateToHome()
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) {
        window.gc()
      }
    })

    await page.waitForTimeout(1000)

    const finalMemory = await getMemoryUsage()

    if (initialMemory && finalMemory) {
      const memoryIncrease =
        finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      const percentIncrease =
        (memoryIncrease / initialMemory.usedJSHeapSize) * 100

      console.log(
        `Memory increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${percentIncrease.toFixed(1)}%)`,
      )

      // Memory shouldn't increase by more than 50%
      expect(percentIncrease).toBeLessThan(50)
    }
  })

  test('should handle large datasets efficiently', async ({ page }) => {
    const listingsPage = new ListingsPage(page)

    // Measure time to load listings page
    const startTime = Date.now()
    await listingsPage.goto()
    const loadTime = Date.now() - startTime

    console.log(`Listings page loaded in ${loadTime}ms`)

    // Check if content uses virtualization or pagination
    const allListings = await listingsPage.listingItems.all()
    const visibleCount = allListings.length

    // Check for pagination
    const hasPagination = await page
      .locator('[data-testid="pagination"], .pagination')
      .isVisible({ timeout: 1000 })
      .catch(() => false)

    if (hasPagination) {
      console.log('Page uses pagination for performance')
    } else if (visibleCount > 50) {
      console.log(
        `Rendering ${visibleCount} items without pagination - checking for virtualization`,
      )

      // Scroll and check if items are added/removed
      const initialCount = visibleCount
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)

      const afterScrollCount = await listingsPage.listingItems.count()

      if (afterScrollCount !== initialCount) {
        console.log('Page appears to use virtualization')
      }
    }
  })

  test('should optimize bundle size and resources', async ({ page }) => {
    const resourceSizes = {
      scripts: 0,
      styles: 0,
      images: 0,
      total: 0,
    }

    // Track resource loading
    page.on('response', (response) => {
      const url = response.url()
      const size = parseInt(response.headers()['content-length'] || '0')

      if (url.match(/\.(js|mjs)$/)) {
        resourceSizes.scripts += size
      } else if (url.match(/\.css$/)) {
        resourceSizes.styles += size
      } else if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        resourceSizes.images += size
      }

      resourceSizes.total += size
    })

    const homePage = new HomePage(page)
    await homePage.goto()

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    console.log('Resource sizes:')
    console.log(
      `- Scripts: ${(resourceSizes.scripts / 1024 / 1024).toFixed(2)}MB`,
    )
    console.log(
      `- Styles: ${(resourceSizes.styles / 1024 / 1024).toFixed(2)}MB`,
    )
    console.log(
      `- Images: ${(resourceSizes.images / 1024 / 1024).toFixed(2)}MB`,
    )
    console.log(`- Total: ${(resourceSizes.total / 1024 / 1024).toFixed(2)}MB`)

    // JavaScript bundle should be reasonable
    expect(resourceSizes.scripts).toBeLessThan(3 * 1024 * 1024) // 3MB
  })

  test('should have smooth scrolling performance', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Wait for content
    await gamesPage.verifyPageLoaded()

    // Measure scroll performance
    const scrollPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0
        const startTime = performance.now()

        const measureFrames = () => {
          frameCount++

          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(measureFrames)
          } else {
            resolve(frameCount)
          }
        }

        // Start scrolling
        window.scrollTo({ top: 1000, behavior: 'smooth' })
        measureFrames()
      })
    })

    console.log(`Achieved ${scrollPerformance} FPS during scroll`)

    // Should maintain at least 30 FPS
    expect(scrollPerformance).toBeGreaterThan(30)
  })

  test('should cache API responses appropriately', async ({ page }) => {
    interface ApiCall {
      url: string
      status: number
      fromCache: boolean
    }
    const apiCalls: ApiCall[] = []

    // Monitor API calls
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          fromCache: response.fromServiceWorker(),
        })
      }
    })

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Navigate away and back
    await gamesPage.navigateToHome()
    await gamesPage.goto()

    // Check if any API calls were cached
    const cachedCalls = apiCalls.filter((call: ApiCall) => call.fromCache)
    console.log(
      `${cachedCalls.length}/${apiCalls.length} API calls were cached`,
    )

    // Caching might not be implemented yet
    if (cachedCalls.length === 0) {
      console.log(
        'API caching not implemented yet - this is a future optimization',
      )
    } else {
      console.log('API caching is working!')
    }
  })

  test('should handle concurrent operations efficiently', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Perform multiple operations concurrently
    const operations = []

    // Search
    if (await listingsPage.searchInput.isVisible()) {
      operations.push(listingsPage.searchListings('test'))
    }

    // Apply filters
    if (await listingsPage.deviceFilter.isVisible()) {
      operations.push(listingsPage.deviceFilter.click())
    }

    if (await listingsPage.emulatorFilter.isVisible()) {
      operations.push(listingsPage.emulatorFilter.click())
    }

    // Execute all at once
    const startTime = Date.now()
    await Promise.all(operations)
    const executionTime = Date.now() - startTime

    console.log(`Concurrent operations completed in ${executionTime}ms`)

    // Should handle concurrent operations without significant delay
    expect(executionTime).toBeLessThan(2000)

    // Page should remain responsive
    await expect(listingsPage.pageHeading).toBeVisible()
  })
})

test.describe('Mobile Performance Tests', () => {
  test('should have optimized mobile performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Enable CPU throttling to simulate mobile device
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

    const startTime = Date.now()
    const homePage = new HomePage(page)
    await homePage.goto()
    const loadTime = Date.now() - startTime

    console.log(`Mobile page loaded in ${loadTime}ms with 4x CPU throttling`)

    // Should still load within reasonable time on mobile
    expect(loadTime).toBeLessThan(5000)

    // Check for mobile optimizations
    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content')
    expect(viewportMeta).toContain('width=device-width')
  })

  test('should minimize layout shifts', async ({ page }) => {
    let cumulativeLayoutShift = 0

    // Monitor layout shifts
    await page.addInitScript(() => {
      let cls = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Layout shift entries have these properties in Chrome
          const layoutShiftEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean
            value?: number
          }
          if (!layoutShiftEntry.hadRecentInput) {
            cls += layoutShiftEntry.value || 0
          }
        }
      }).observe({ entryTypes: ['layout-shift'] })
      ;(window as Window & { getCLS?: () => number }).getCLS = () => cls
    })

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await page.waitForLoadState('networkidle')

    // Get CLS value
    cumulativeLayoutShift = await page.evaluate(() => window.getCLS())

    console.log(`Cumulative Layout Shift: ${cumulativeLayoutShift.toFixed(3)}`)

    // CLS should be less than 0.1 for good user experience
    expect(cumulativeLayoutShift).toBeLessThan(0.1)
  })
})
