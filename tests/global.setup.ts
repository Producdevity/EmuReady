import { clerkSetup } from '@clerk/testing/playwright'

async function globalSetup() {
  console.log('🔧 Starting global setup for Playwright tests...')

  // Official Clerk setup - handles authentication initialization
  await clerkSetup()

  console.log('✅ Global setup completed - Clerk initialized')
}

export default globalSetup
