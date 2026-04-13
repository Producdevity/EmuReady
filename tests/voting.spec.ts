import { test, expect } from '@playwright/test'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Voting Functionality Tests', () => {
  test('should display vote section on listing detail page', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const verificationHeading = page.getByRole('heading', {
      name: /community verification/i,
    })
    await expect(verificationHeading).toBeVisible()
  })

  test('should display confirm and inaccurate vote buttons', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })

    await expect(confirmButton).toBeVisible()
    await expect(inaccurateButton).toBeVisible()
  })

  test('should display success rate percentage and voter count', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const successRate = page.getByText(/\d+%/)
    await expect(successRate.first()).toBeVisible()

    const verifiedByText = page.getByText(/verified by \d+ users/i)
    await expect(verifiedByText).toBeVisible()
  })

  test('should show help button for voting explanation', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const helpButton = page.getByTitle('How does verification work?')
    await expect(helpButton).toBeVisible()
  })

  test('should show sign-in prompt for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const signInToVerify = page
      .getByText(/sign in/i)
      .locator('..')
      .filter({ hasText: /to verify/i })
    await expect(signInToVerify).toBeVisible()
  })

  test('should have vote buttons disabled for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    await expect(confirmButton).toBeVisible()
    await expect(confirmButton).toBeDisabled()

    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })
    await expect(inaccurateButton).toBeDisabled()
  })

  test('should display progress bar for success rate', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const verificationHeading = page.getByRole('heading', {
      name: /community verification/i,
    })
    await expect(verificationHeading).toBeVisible()

    await expect(page.getByText(/\d+%/)).toBeVisible()
    await expect(page.getByText(/verified by \d+ users/i)).toBeVisible()
  })
})
