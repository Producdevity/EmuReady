import path from 'path'
import { test as setup, type Page } from '@playwright/test'

// Define auth files for different roles
const authFiles = {
  user: path.join(__dirname, '.auth/user.json'),
  author: path.join(__dirname, '.auth/author.json'),
  moderator: path.join(__dirname, '.auth/moderator.json'),
  developer: path.join(__dirname, '.auth/developer.json'),
  admin: path.join(__dirname, '.auth/admin.json'),
}

// Helper function to login with specific credentials
async function authenticateUser(page: Page, email: string, password: string, role: string) {
  console.log(`🔐 Setting up authentication for ${role}: ${email}`)

  try {
    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check if already authenticated by looking for user menu
    const userMenuButton = page
      .locator('.cl-userButtonTrigger, .cl-userButton, [data-clerk-user-button]')
      .first()
    const isAlreadySignedIn = await userMenuButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (isAlreadySignedIn) {
      console.log(`🔄 Already signed in, signing out first...`)
      await userMenuButton.click()

      // Look for sign out option
      const signOutButton = page
        .getByRole('menuitem', { name: /sign out/i })
        .or(page.getByText(/sign out/i))
      await signOutButton.click()

      // Wait for sign out to complete
      await page.waitForTimeout(2000)
      await page.goto('/')
    }

    // Click sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i }).first()
    await signInButton.waitFor({ state: 'visible', timeout: 10000 })
    await signInButton.click()

    // Wait for Clerk sign-in modal to load
    await page.waitForSelector(
      'input[name="identifier"], input[name="emailAddress"], input[type="email"]',
      {
        timeout: 10000,
        state: 'visible',
      },
    )

    // Fill email
    const emailField = page
      .locator('input[name="identifier"], input[name="emailAddress"], input[type="email"]')
      .first()
    await emailField.fill(email)

    // Continue to password step
    const continueBtn = page.getByRole('button', { name: /continue/i })
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click()
      await page.waitForTimeout(1000)
    }

    // Fill password
    const passwordField = page.locator('input[name="password"], input[type="password"]').first()
    await passwordField.waitFor({ state: 'visible', timeout: 5000 })
    await passwordField.fill(password)

    // Submit
    const submitButton = page.getByRole('button', { name: /sign in|continue/i }).first()
    await submitButton.click()

    // Wait for authentication to complete
    await page.waitForURL('/', { timeout: 15000 })

    // Verify authentication by checking for profile button or admin button
    const profileButton = page
      .getByRole('link', { name: /profile/i })
      .or(page.getByRole('button', { name: /profile/i }))
    const adminButton = page
      .getByRole('link', { name: /admin/i })
      .or(page.getByRole('button', { name: /admin/i }))
    const userMenu = page
      .locator('.cl-userButtonTrigger, .cl-userButton, [data-clerk-user-button]')
      .first()

    // Check multiple indicators of being logged in
    const authenticated = await Promise.race([
      profileButton.isVisible({ timeout: 5000 }).catch(() => false),
      adminButton.isVisible({ timeout: 5000 }).catch(() => false),
      userMenu.isVisible({ timeout: 5000 }).catch(() => false),
    ])

    if (!authenticated) {
      throw new Error(`Authentication verification failed for ${email}`)
    }

    console.log(`✅ Successfully authenticated ${role}: ${email}`)
    return true
  } catch (error) {
    console.error(`❌ Authentication failed for ${role} (${email}):`, error)
    // Take screenshot for debugging
    await page.screenshot({
      path: `test-results/auth-failed-${role}.png`,
    })
    throw error
  }
}

// Clean up any previous auth states on startup
setup.beforeAll(async () => {
  const fs = await import('fs')
  const authDir = path.join(__dirname, '.auth')

  // Create .auth directory if it doesn't exist
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  console.log('🧹 Auth setup initialized')
})

// Auth setup tests - only run the ones we have credentials for
const authConfigs = [
  {
    role: 'user',
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    file: authFiles.user,
  },
  {
    role: 'author',
    email: process.env.TEST_AUTHOR_EMAIL,
    password: process.env.TEST_AUTHOR_PASSWORD,
    file: authFiles.author,
  },
  {
    role: 'moderator',
    email: process.env.TEST_MODERATOR_EMAIL,
    password: process.env.TEST_MODERATOR_PASSWORD,
    file: authFiles.moderator,
  },
  {
    role: 'developer',
    email: process.env.TEST_DEVELOPER_EMAIL,
    password: process.env.TEST_DEVELOPER_PASSWORD,
    file: authFiles.developer,
  },
  {
    role: 'admin',
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
    file: authFiles.admin,
  },
]

// Generate setup tests for each role that has credentials
for (const config of authConfigs) {
  if (config.email && config.password) {
    setup(`authenticate as ${config.role}`, async ({ page }) => {
      await authenticateUser(page, config.email!, config.password!, config.role)
      await page.context().storageState({ path: config.file })
    })
  } else {
    setup.skip(`authenticate as ${config.role}`, async () => {
      console.log(`⚠️  Skipping ${config.role} auth - credentials not provided`)
    })
  }
}
