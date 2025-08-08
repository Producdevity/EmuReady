import path from 'path'
import { test as setup, type Page } from '@playwright/test'
import { AuthHelpers } from './helpers/auth'

// Define auth files for different roles
const authFiles = {
  user: path.join(__dirname, '.auth/user.json'),
  author: path.join(__dirname, '.auth/author.json'),
  moderator: path.join(__dirname, '.auth/moderator.json'),
  developer: path.join(__dirname, '.auth/developer.json'),
  admin: path.join(__dirname, '.auth/admin.json'),
}

// Helper function to login with specific credentials
async function authenticateUser(page: Page, email: string, password: string) {
  const auth = new AuthHelpers(page)

  // Set cookie consent before navigation to prevent banner
  await page.addInitScript(() => {
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
    localStorage.setItem(`${PREFIX}cookie_consent_date`, new Date().toISOString())
    localStorage.setItem(`${PREFIX}analytics_enabled`, 'false')
    localStorage.setItem(`${PREFIX}performance_enabled`, 'false')
  })

  // Go to the app
  await page.goto('/')

  // Check if cookie banner is still present (shouldn't be)
  const cookieBanner = page
    .locator('.fixed.inset-0.z-\\[70\\]')
    .filter({ hasText: /Cookie Preferences/i })
  const isBannerVisible = await cookieBanner.isVisible({ timeout: 1000 }).catch(() => false)

  if (isBannerVisible) {
    console.log('Cookie banner detected, attempting to dismiss...')

    // Try clicking Accept All button first
    const acceptButton = page.getByRole('button', { name: /accept all/i })
    if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptButton.click()
      await page.waitForTimeout(1000)
    } else {
      // Try clicking the backdrop to dismiss
      const backdrop = page.locator('.absolute.inset-0.bg-black\\/30')
      if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
        await backdrop.click({ force: true, position: { x: 10, y: 10 } })
        await page.waitForTimeout(1000)
      }
    }

    // Wait for banner to disappear
    await cookieBanner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  }

  // Check if already authenticated
  const isAuthenticated = await auth.isAuthenticated()
  if (isAuthenticated) {
    console.log(`Already authenticated - signing out first`)

    // Find and click the user button
    const userButton = page
      .locator('button')
      .filter({ hasText: /open user button/i })
      .or(page.locator('[data-testid="user-button"]'))
    await userButton.click()

    // Wait for menu and click sign out
    await page.waitForTimeout(1000)
    const signOutButton = page.getByRole('button', { name: /sign out/i })
    await signOutButton.click()

    // Wait for sign out to complete
    await page.waitForTimeout(2000)
  }

  // Wait for auth components to load
  await auth.waitForAuthComponents()

  // Click sign in button
  await auth.clickSignInButton()

  // Wait for Clerk modal
  await auth.waitForClerkModal('sign-in')

  // Fill in email - Clerk uses "identifier" field
  const emailInput = page
    .locator('input[name="identifier"], input[type="email"], input[name="email"]')
    .first()
  await emailInput.waitFor({ state: 'visible' })
  await emailInput.fill(email)

  // Click continue/next button
  const continueButton = page.getByRole('button', { name: /continue|next/i })
  await continueButton.click()

  // Wait for password field to appear
  await page.waitForTimeout(1000)

  // Check if password field is visible or if we need to handle different flow
  const passwordField = page.locator('input[type="password"]')
  const passwordVisible = await passwordField.isVisible({ timeout: 5000 }).catch(() => false)

  if (!passwordVisible) {
    // Might be a one-step login form, try filling both fields
    const emailFieldAgain = page
      .locator('input[name="identifier"], input[type="email"], input[name="email"]')
      .first()
    await emailFieldAgain.fill(email)

    const passwordFieldAlt = page.locator('input[name="password"], input[type="password"]').first()
    await passwordFieldAlt.fill(password)

    // Submit the form
    const submitButton = page.getByRole('button', {
      name: /sign in|log in|submit/i,
    })
    await submitButton.click()
  } else {
    // Fill in password
    await passwordField.fill(password)

    // Submit the form
    const signInButton = page.getByRole('button', { name: /continue|sign in/i })
    await signInButton.click()
  }

  // Wait for navigation or URL change after login
  await page.waitForLoadState('domcontentloaded')
  // Give auth time to settle
  await page.waitForTimeout(2000)

  // Wait for successful login - look for user button or profile link
  const successIndicators = [
    page.locator('[data-testid="user-button"]'),
    page.locator('button').filter({ hasText: /open user button/i }),
    page.getByRole('link', { name: /profile/i }),
    // Also check for navigation menu items that appear when logged in
    page.getByRole('link', { name: /my listings/i }),
    page.getByRole('link', { name: /new listing/i }),
    // Check for clerk user button
    page.locator('.cl-userButton'),
    page.locator('[data-clerk-element="userButton"]'),
  ]

  let loginSuccess = false
  // Try multiple times as auth can be slow
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        loginSuccess = true
        break
      }
    }
    if (loginSuccess) break
    await page.waitForTimeout(2000)
  }

  if (!loginSuccess) {
    // Check if we're still on the login page - might indicate wrong credentials
    const stillOnLogin = await page
      .locator('input[name="identifier"], input[type="email"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false)
    if (stillOnLogin) {
      throw new Error('Login failed - still on login page. Check credentials.')
    }

    // Try to take a screenshot for debugging
    await page.screenshot({
      path: `tests/screenshots/auth-failed-${email.replace('@', '-')}.png`,
    })
    throw new Error(`Login failed - no success indicators found for ${email}`)
  }

  console.log(`✅ Successfully authenticated as ${email}`)
}

// Setup for regular user
setup('authenticate as user', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    console.log('⚠️  Skipping user auth - TEST_USER_EMAIL or TEST_USER_PASSWORD not set')
    return
  }

  await authenticateUser(page, email, password)
  await page.context().storageState({ path: authFiles.user })
})

// Setup for author
setup('authenticate as author', async ({ page }) => {
  const email = process.env.TEST_AUTHOR_EMAIL
  const password = process.env.TEST_AUTHOR_PASSWORD

  if (!email || !password) {
    console.log('⚠️  Skipping author auth - TEST_AUTHOR_EMAIL or TEST_AUTHOR_PASSWORD not set')
    return
  }

  await authenticateUser(page, email, password)
  await page.context().storageState({ path: authFiles.author })
})

// Setup for moderator
setup('authenticate as moderator', async ({ page }) => {
  const email = process.env.TEST_MODERATOR_EMAIL
  const password = process.env.TEST_MODERATOR_PASSWORD

  if (!email || !password) {
    console.log(
      '⚠️  Skipping moderator auth - TEST_MODERATOR_EMAIL or TEST_MODERATOR_PASSWORD not set',
    )
    return
  }

  await authenticateUser(page, email, password)
  await page.context().storageState({ path: authFiles.moderator })
})

// Setup for developer
setup('authenticate as developer', async ({ page }) => {
  const email = process.env.TEST_DEVELOPER_EMAIL
  const password = process.env.TEST_DEVELOPER_PASSWORD

  if (!email || !password) {
    console.log(
      '⚠️  Skipping developer auth - TEST_DEVELOPER_EMAIL or TEST_DEVELOPER_PASSWORD not set',
    )
    return
  }

  await authenticateUser(page, email, password)
  await page.context().storageState({ path: authFiles.developer })
})

// Setup for admin
setup('authenticate as admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD

  if (!email || !password) {
    console.log('⚠️  Skipping admin auth - TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD not set')
    return
  }

  await authenticateUser(page, email, password)
  await page.context().storageState({ path: authFiles.admin })
})
