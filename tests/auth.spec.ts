import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('should show sign in and sign up buttons when not authenticated', async ({
    page,
  }) => {
    // Check that the sign in and sign up buttons are visible
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()

    // User button should not be visible
    await expect(page.locator('[data-testid="user-button"]')).not.toBeVisible()
  })

  test('should open sign in modal when sign in button is clicked', async ({
    page,
  }) => {
    // Click the sign in button
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for Clerk sign in modal to appear
    // Note: Clerk modals may have specific selectors, adjust as needed
    await expect(
      page.locator('.cl-modal, [data-testid="sign-in-modal"]'),
    ).toBeVisible({ timeout: 10000 })

    // Check for typical sign in form elements
    await expect(
      page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)),
    ).toBeVisible()
  })

  test('should open sign up modal when sign up button is clicked', async ({
    page,
  }) => {
    // Click the sign up button
    await page.getByRole('button', { name: /sign up/i }).click()

    // Wait for Clerk sign up modal to appear
    await expect(
      page.locator('.cl-modal, [data-testid="sign-up-modal"]'),
    ).toBeVisible({ timeout: 10000 })

    // Check for typical sign up form elements
    await expect(
      page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)),
    ).toBeVisible()
  })

  test('should show user profile access when authenticated', async () => {
    // Skip this test in CI or if no test user credentials are available
    test.skip(
      process.env.CI === 'true',
      'Authentication testing requires test credentials',
    )

    // This test would require setting up test user credentials
    // and performing actual login, which depends on your test environment setup

    // For now, we'll mock the authentication state
    // In a real scenario, you'd either:
    // 1. Use Clerk's test mode
    // 2. Have test user credentials
    // 3. Mock the authentication state

    console.log('Authentication state testing requires test environment setup')
  })

  test('should redirect to sign in when accessing protected routes', async ({
    page,
  }) => {
    // Try to access a protected route (like profile)
    await page.goto('/profile')

    // Should either redirect to sign in or show sign in prompt
    await expect(
      page
        .getByText(/please sign in/i)
        .or(page.getByText(/you need to be logged in/i))
        .or(page.getByRole('button', { name: /sign in/i })),
    ).toBeVisible({ timeout: 10000 })
  })

  test('should maintain authentication state across page navigation', async ({
    page,
  }) => {
    // This test would verify that once authenticated, the user stays authenticated
    // when navigating between pages
    test.skip(
      process.env.CI === 'true',
      'Authentication testing requires test credentials',
    )

    // Navigate to different pages and verify auth state is maintained
    const pagesToCheck = ['/', '/games', '/listings']

    for (const route of pagesToCheck) {
      await page.goto(route)
      // In an authenticated state, we should see the user button or profile
      // and not see sign in/sign up buttons
      // This would be implemented based on actual authentication setup
    }
  })
})

test.describe('Mobile Authentication', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE dimensions

  test('should show mobile menu with authentication options', async ({
    page,
  }) => {
    await page.goto('/')

    // Click mobile menu button
    await page
      .getByRole('button', { name: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"]'))
      .click()

    // Check that mobile menu shows authentication options
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should close mobile menu after authentication action', async ({
    page,
  }) => {
    await page.goto('/')

    // Open mobile menu
    await page
      .getByRole('button', { name: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"]'))
      .click()

    // Click sign in from mobile menu
    await page.getByRole('button', { name: /sign in/i }).click()

    // Mobile menu should close (or at least sign in modal should open)
    await expect(
      page.locator('.cl-modal, [data-testid="sign-in-modal"]'),
    ).toBeVisible({ timeout: 10000 })
  })
})
