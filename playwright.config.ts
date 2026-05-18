import path from 'path'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const isCI = !!process.env.CI
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'

function createWebServerEnv(): { [key: string]: string } {
  const env: { [key: string]: string } = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') env[key] = value
  }
  env.NODE_ENV ||= 'test'
  return env
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
    video: isCI ? 'on-first-retry' : 'retain-on-failure',
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

  /* Let Playwright handle starting the server */
  webServer: process.env.PWTEST_SKIP_WEBSERVER
    ? undefined
    : {
        command:
          process.env.PWTEST_SERVER_COMMAND ||
          (isGitHubActions ? 'pnpm start' : 'pnpm build && pnpm start'),
        url: 'http://localhost:3000',
        env: createWebServerEnv(),
        reuseExistingServer: !isCI,
        timeout: isGitHubActions ? 180 * 1000 : 300 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
