import { test, expect } from '@playwright/test'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Commenting System Tests', () => {
  test('should display comment section heading on listing detail', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible()
  })

  test('should show comment count in heading', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments\s*\(\d+\)/i })
    await expect(commentsHeading).toBeVisible()
  })

  test('should show sign-in prompt for unauthenticated users instead of comment form', async ({
    page,
  }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible()

    const signInPrompt = page
      .locator('p, div')
      .filter({ hasText: /sign in/i })
      .filter({ hasText: /to leave a comment/i })
      .first()
    await expect(signInPrompt).toBeVisible()
  })

  test('should not show comment textarea for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible()

    const commentTextarea = page.getByPlaceholder(/write your comment/i)
    await expect(commentTextarea).not.toBeVisible()
  })

  test('should display existing comments or empty state', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible()

    const commentCards = page.locator('[id^="comment-"]')
    const emptyState = page.getByText(/no comments yet/i)

    // Either comments or empty state must be visible
    await expect(commentCards.first().or(emptyState)).toBeVisible()
  })

  test('should not show reply button for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await expect(listingsPage.listingItems.first()).toBeVisible()

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible()

    const replyButtons = page.getByRole('button', { name: /reply/i })
    await expect(replyButtons).toHaveCount(0)
  })
})
