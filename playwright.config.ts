import path from 'path'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

/** Read environment variables from file. */
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI when test.only is left on. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only - 1 retry helps catch flaky tests without hiding consistent issues */
  retries: process.env.CI ? 1 : 0,
  /* Conservative approach for CI stability - 1 worker ensures each test gets full resources */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Test timeout */
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000, // 60 seconds in CI, 30 locally

  /* Global setup - runs once before all tests */
  globalSetup: require.resolve('./tests/global.setup.ts'),

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Auth setup - run this first to create auth states
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/auth.setup.ts', '**/global.setup.ts'],
      dependencies: ['setup'], // Ensure auth is set up before running tests
    },
  ],

  /* Let Playwright handle starting the server - removed manual handling */
  webServer: process.env.PWTEST_SKIP_WEBSERVER
    ? undefined
    : {
        command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: process.env.CI ? 180 * 1000 : 120 * 1000, // 3 minutes in CI, 2 minutes locally
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
