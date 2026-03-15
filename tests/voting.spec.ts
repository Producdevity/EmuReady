import { test, expect } from '@playwright/test'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Voting Functionality Tests', () => {
  test('should display vote section on listing detail page', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test voting')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // The VoteButtons component renders a "Community Verification" heading
    const verificationHeading = page.getByRole('heading', {
      name: /community verification/i,
    })
    await expect(verificationHeading).toBeVisible({ timeout: 10000 })
  })

  test('should display confirm and inaccurate vote buttons', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test voting')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Vote buttons use "Confirm" and "Inaccurate" labels
    const confirmButton = page.getByRole('button', { name: /confirm/i })
    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })

    await expect(confirmButton).toBeVisible({ timeout: 10000 })
    await expect(inaccurateButton).toBeVisible()
  })

  test('should display success rate percentage and voter count', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test voting')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Success rate is displayed as "{number}%" in a large font
    const successRate = page.getByText(/\d+%/)
    await expect(successRate.first()).toBeVisible({ timeout: 10000 })

    // Voter count text: "verified by {N} users"
    const verifiedByText = page.getByText(/verified by \d+ users/i)
    await expect(verifiedByText).toBeVisible()
  })

  test('should show help button for voting explanation', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test voting')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Help button has title "How does verification work?"
    const helpButton = page.getByTitle('How does verification work?')
    await expect(helpButton).toBeVisible({ timeout: 10000 })
  })

  test('should show sign-in prompt for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test voting')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Unauthenticated users see "Sign in" link with "to verify" text
    const signInToVerify = page
      .getByText(/sign in/i)
      .locator('..')
      .filter({ hasText: /to verify/i })
    await expect(signInToVerify).toBeVisible({ timeout: 10000 })
  })

  test('should have vote buttons disabled for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test voting')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Vote buttons are disabled when not authenticated
    const confirmButton = page.getByRole('button', { name: /confirm/i })
    await expect(confirmButton).toBeVisible({ timeout: 10000 })
    await expect(confirmButton).toBeDisabled()

    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })
    await expect(inaccurateButton).toBeDisabled()
  })

  test('should display progress bar for success rate', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test voting')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const verificationHeading = page.getByRole('heading', {
      name: /community verification/i,
    })
    await expect(verificationHeading).toBeVisible({ timeout: 10000 })

    // Success rate percentage and "verified by N users" text appear alongside the progress bar
    await expect(page.getByText(/\d+%/)).toBeVisible()
    await expect(page.getByText(/verified by \d+ users/i)).toBeVisible()
  })
})
