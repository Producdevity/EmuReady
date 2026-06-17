import { clerkSetup } from '@clerk/testing/playwright'

async function globalSetup() {
  console.log('🔧 Starting global setup for Playwright tests...')

  if (process.env.PWTEST_SKIP_CLERK_SETUP === '1') {
    console.log('⏭️  Skipping Clerk testing setup')
    return
  }

  await clerkSetup()

  console.log('✅ Global setup completed - Clerk initialized')
}

export default globalSetup
