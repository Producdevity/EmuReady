import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup, chromium } from '@playwright/test'

// Setup must be run serially, this is necessary if Playwright is configured to run fully parallel
setup.describe.configure({ mode: 'serial' })

setup('global setup', async () => {
  console.log('🔧 Starting global setup for Playwright tests...')

  // Official Clerk setup - handles authentication initialization
  await clerkSetup()

  // Set up cookie consent to avoid banner interference
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:3000')

    // Set cookie consent in localStorage with correct prefix for test environment
    await page.evaluate(() => {
      const PREFIX = '@TestEmuReady_'
      localStorage.setItem(`${PREFIX}cookie_consent`, 'true')
      localStorage.setItem(
        `${PREFIX}cookie_preferences`,
        JSON.stringify({
          necessary: true,
          analytics: false,
          performance: false,
        }),
      )
      localStorage.setItem(
        `${PREFIX}cookie_consent_date`,
        new Date().toISOString(),
      )
      localStorage.setItem(`${PREFIX}analytics_enabled`, 'false')
      localStorage.setItem(`${PREFIX}performance_enabled`, 'false')
    })

    console.log('✅ Cookie consent configured')
  } catch (error) {
    console.log('⚠️ Could not set cookie consent:', error)
  } finally {
    await browser.close()
  }

  console.log('✅ Global setup completed - Clerk initialized')
})
