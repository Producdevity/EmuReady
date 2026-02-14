import path from 'path'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

/** Read environment variables from file. */
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })

const isCI = !!process.env.CI

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
  retries: isCI ? 1 : 0,
  /* Conservative approach for CI stability - 1 worker ensures each test gets full resources */
  workers: isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Test timeout */
  timeout: isCI ? 60 * 1000 : 30 * 1000, // 60 seconds in CI, 30 locally

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
        command:
          process.env.PWTEST_SERVER_COMMAND ||
          (isCI ? 'npm run start' : 'npm run build && npm run start'),
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        timeout: isCI ? 180 * 1000 : 300 * 1000, // 3 minutes in CI, 5 minutes locally (includes build)
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
