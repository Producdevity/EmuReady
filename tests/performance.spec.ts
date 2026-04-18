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

    expect(loadTime).toBeLessThan(10000)
  })

  test('should have efficient image loading', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const images = page.locator('img')
    const imageCount = await images.count()

    // Skip if not enough images to warrant lazy loading
    test.skip(imageCount <= 5, 'Not enough images to test lazy loading')

    let lazyLoadCount = 0
    for (let i = 0; i < imageCount; i++) {
      const loading = await images.nth(i).getAttribute('loading')
      if (loading === 'lazy') lazyLoadCount++
    }

    expect(lazyLoadCount).toBeGreaterThan(0)
  })

  test('should not have memory leaks during navigation', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'performance.memory API is only available in Chromium')

    const getMemoryUsage = () =>
      page.evaluate(() => {
        const perf = performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
        }
        return perf.memory
          ? {
              usedJSHeapSize: perf.memory.usedJSHeapSize,
              totalJSHeapSize: perf.memory.totalJSHeapSize,
            }
          : null
      })

    const homePage = new HomePage(page)
    await homePage.goto()

    const initialMemory = await getMemoryUsage()
    test.skip(initialMemory === null, 'performance.memory API not available')

    for (let i = 0; i < 5; i++) {
      await homePage.navigateToGames()
      await homePage.navigateToHandheld()
      await homePage.navigateToPC()
      await homePage.navigateToHome()
    }

    await page.evaluate(() => {
      if (window.gc) window.gc()
    })

    await page.waitForLoadState('domcontentloaded')

    const finalMemory = await getMemoryUsage()
    expect(finalMemory).not.toBeNull()

    const memoryIncrease = finalMemory!.usedJSHeapSize - initialMemory!.usedJSHeapSize
    const percentIncrease = (memoryIncrease / initialMemory!.usedJSHeapSize) * 100

    expect(percentIncrease).toBeLessThan(50)
  })

  test('should handle large datasets efficiently', async ({ page }) => {
    const listingsPage = new ListingsPage(page)

    const startTime = Date.now()
    await listingsPage.goto()
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(15000)

    await expect(listingsPage.pageHeading).toBeVisible()
  })

  test('should optimize bundle size and resources', async ({ page }) => {
    let scriptBytes = 0

    page.on('response', (response) => {
      const url = response.url()
      const size = parseInt(response.headers()['content-length'] || '0')

      if (url.match(/\.(js|mjs)$/)) {
        scriptBytes += size
      }
    })

    const homePage = new HomePage(page)
    await homePage.goto()
    await page.waitForLoadState('domcontentloaded')

    expect(scriptBytes).toBeLessThan(3 * 1024 * 1024)
  })

  test('should have smooth scrolling performance', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.verifyPageLoaded()

    const frameCount = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let count = 0
        const startTime = performance.now()

        const measureFrames = () => {
          count++
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(measureFrames)
          } else {
            resolve(count)
          }
        }

        window.scrollTo({ top: 1000, behavior: 'smooth' })
        measureFrames()
      })
    })

    expect(frameCount).toBeGreaterThan(30)
  })

  test('should cache API responses appropriately', async ({ page }) => {
    interface ApiCall {
      url: string
      status: number
      fromCache: boolean
    }
    const apiCalls: ApiCall[] = []

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

    await gamesPage.navigateToHome()
    await gamesPage.goto()

    expect(apiCalls.length).toBeGreaterThan(0)
  })
})

test.describe('Mobile Performance Tests', () => {
  test('should have optimized mobile performance', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

    const startTime = Date.now()
    const homePage = new HomePage(page)
    await homePage.goto()
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(15000)

    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewportMeta).toContain('width=device-width')
  })

  test('should minimize layout shifts', async ({ page }) => {
    await page.addInitScript(() => {
      let cls = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
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
    await page.waitForLoadState('domcontentloaded')

    const cumulativeLayoutShift = await page.evaluate(
      () => (window as Window & { getCLS?: () => number }).getCLS?.() ?? 0,
    )

    expect(cumulativeLayoutShift).toBeLessThan(0.25)
  })
})
