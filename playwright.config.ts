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
  /* 1 retry catches timing-sensitive tests without hiding consistent issues */
  retries: 1,
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  timeout: 60 * 1000,

  expect: {
    timeout: 10 * 1000,
  },

  globalSetup: require.resolve('./tests/global.setup.ts'),

  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Auth setup - run this first to create auth states
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Data setup - creates listings, reports, etc. that other tests depend on
    {
      name: 'data-setup',
      testMatch: /data-setup\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/auth.setup.ts', '**/global.setup.ts', '**/data-setup.spec.ts'],
      dependencies: ['data-setup'],
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
