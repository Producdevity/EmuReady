import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

// Setup must be run serially, this is necessary if Playwright is configured to run fully parallel
setup.describe.configure({ mode: 'serial' })

setup('global setup', async () => {
  console.log('🔧 Starting global setup for Playwright tests...')

  // Official Clerk setup - handles authentication initialization
  await clerkSetup()

  console.log('✅ Global setup completed - Clerk initialized')
})
