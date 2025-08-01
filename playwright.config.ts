import path from 'path'
import { defineConfig, devices } from '@playwright/test'
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv'

// Load test environment variables when running tests
if (process.env.NODE_ENV === 'test' || process.argv.includes('test')) {
  dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })
} else {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') })
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI when test.only is left on. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global timeout for the entire test run */
  globalTimeout: 30 * 60 * 1000, // 30 minutes
  /* Test timeout - increased for production build */
  timeout: process.env.USE_DEV_SERVER ? 60 * 1000 : 30 * 1000, // 60s for dev, 30s for prod
  /* Global setup handled by setup dependency in projects */
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Action timeout - how long to wait for element actions */
    actionTimeout: 10 * 1000, // 10 seconds

    /* Navigation timeout - how long to wait for page loads */
    navigationTimeout: 30 * 1000, // 30 seconds

    /* Set cookie consent for all tests */
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: [
            {
              name: 'emuready-cookie-consent',
              value: 'true',
            },
            {
              name: 'emuready-cookie-preferences',
              value: JSON.stringify({
                necessary: true,
                analytics: false,
                performance: false,
              }),
            },
            {
              name: 'emuready-cookie-consent-date',
              value: new Date().toISOString(),
            },
          ],
        },
      ],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - runs first to initialize Clerk
    {
      name: 'setup',
      testMatch: '**/global.setup.ts',
    },

    // Auth setup project - generates auth state for all roles
    {
      name: 'auth-setup',
      testMatch: '**/auth.setup.ts',
      dependencies: ['setup'],
    },

    // Unauthenticated tests - run on all browsers
    {
      name: 'chromium-unauth',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    {
      name: 'firefox-unauth',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    // {
    //   name: 'webkit-unauth',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },

    // Authenticated tests for different roles
    {
      name: 'chromium-auth-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'chromium-auth-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['auth-setup'],
    },

    // Mobile browser tests
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },

    // Additional desktop browsers (optional - may slow down tests)
    // {
    //   name: 'edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    //   dependencies: ['setup'],
    // },
  ],

  webServer: {
    command: process.env.USE_DEV_SERVER
      ? 'npm run dev'
      : 'NODE_ENV=production npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.USE_DEV_SERVER ? 120 * 1000 : 60 * 1000, // Increased production timeout
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
