import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Unauthenticated User - Auth Buttons', () => {
  test('should show sign in and sign up buttons on homepage', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    const authPage = new AuthPage(page)
    await authPage.verifyUserNotAuthenticated()
    await expect(authPage.signInButton).toBeVisible()
    await expect(authPage.signUpButton).toBeVisible()
  })

  test('should show auth buttons consistently across pages', async ({ page }) => {
    const homePage = new HomePage(page)
    const gamesPage = new GamesPage(page)
    const listingsPage = new ListingsPage(page)
    const authPage = new AuthPage(page)

    await homePage.goto()
    await expect(authPage.signInButton).toBeVisible()
    await expect(authPage.signUpButton).toBeVisible()

    await gamesPage.goto()
    await expect(authPage.signInButton).toBeVisible()
    await expect(authPage.signUpButton).toBeVisible()

    await listingsPage.goto()
    await expect(authPage.signInButton).toBeVisible()
    await expect(authPage.signUpButton).toBeVisible()
  })
})

test.describe('Unauthenticated User - Clerk Redirects', () => {
  // The Navbar's SignInButton/SignUpButton omit `mode`, so Clerk's default
  // redirect mode applies — clicking navigates to the Clerk-hosted Account
  // Portal. setupClerkTestingToken bypasses Clerk's bot protection.
  test('should redirect to Clerk sign-in page when sign in button is clicked', async ({ page }) => {
    await setupClerkTestingToken({ page })
    const homePage = new HomePage(page)
    await homePage.goto()

    await page
      .getByRole('button', { name: /^sign in$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/clerk\.accounts\.dev.*sign-in|\/sign-in/)
  })

  test('should redirect to Clerk sign-up page when sign up button is clicked', async ({ page }) => {
    await setupClerkTestingToken({ page })
    const homePage = new HomePage(page)
    await homePage.goto()

    await page
      .getByRole('button', { name: /^sign up$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/clerk\.accounts\.dev.*sign-up|\/sign-up/)
  })
})

test.describe('Unauthenticated User - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show auth buttons in mobile menu', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.openMobileMenu()

    const authPage = new AuthPage(page)
    await expect(authPage.signInButton).toBeVisible()
    await expect(authPage.signUpButton).toBeVisible()
  })
})

test.describe('Protected Routes', () => {
  test('should require authentication for add game page', async ({ page }) => {
    const authPage = new AuthPage(page)
    await page.goto('/games/new')
    await authPage.verifyAuthRequired()
  })

  test('should require authentication for add listing page', async ({ page }) => {
    const authPage = new AuthPage(page)
    await page.goto('/listings/new')
    await authPage.verifyAuthRequired()
  })

  test('should require authentication for profile page', async ({ page }) => {
    const authPage = new AuthPage(page)
    await page.goto('/profile')
    await authPage.verifyAuthRequired()
  })
})

test.describe('Authenticated User', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('should show user button instead of sign in/up buttons', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    const authPage = new AuthPage(page)
    await expect(authPage.userButton).toBeVisible()
  })
})

test.describe('Navigation with Auth State', () => {
  test('should remain unauthenticated after visiting protected route and navigating back', async ({
    page,
  }) => {
    const homePage = new HomePage(page)
    const gamesPage = new GamesPage(page)
    const authPage = new AuthPage(page)

    await homePage.goto()
    await authPage.verifyUserNotAuthenticated()

    await gamesPage.goto()
    await authPage.verifyUserNotAuthenticated()

    await page.goto('/games/new')
    await page.goBack()
    await expect(page).toHaveURL(/localhost|127\.0\.0\.1/)
    await authPage.verifyUserNotAuthenticated()
  })
})

test.describe('Auth Error Handling', () => {
  test('should show error feedback for invalid credentials', async ({ page }) => {
    await setupClerkTestingToken({ page })
    const homePage = new HomePage(page)
    await homePage.goto()

    await page
      .getByRole('button', { name: /^sign in$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/sign-in/)

    // Clerk's hosted form uses input name="identifier" then "password" — these
    // input names are part of Clerk's public API.
    await page.locator('input[name="identifier"]').fill('invalid-e2e-test@example.com')
    await page.getByRole('button', { name: /continue/i }).click()

    // role="alert" is Clerk's stable error contract; internal classes are not.
    await expect(page.getByRole('alert').first()).toBeVisible()
  })
})
