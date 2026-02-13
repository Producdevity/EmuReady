import { test, expect } from '@playwright/test'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Commenting System Tests', () => {
  test('should display comment section heading on listing detail', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test comments')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // GenericCommentThread renders "Comments ({count})" as an h3 heading
    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible({ timeout: 10000 })
  })

  test('should show comment count in heading', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test comments')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Heading includes comment count in parentheses: "Comments (N)"
    const commentsHeading = page.getByRole('heading', { name: /comments\s*\(\d+\)/i })
    await expect(commentsHeading).toBeVisible({ timeout: 10000 })
  })

  test('should show sign-in prompt for unauthenticated users instead of comment form', async ({
    page,
  }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test comments')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Unauthenticated users see "Please sign in to leave a comment."
    // The text is split across elements (sign in is inside a button), so match the container
    const signInPrompt = page
      .locator('p, div')
      .filter({
        hasText: /sign in/i,
      })
      .filter({
        hasText: /to leave a comment/i,
      })
      .first()
    await expect(signInPrompt).toBeVisible({ timeout: 10000 })
  })

  test('should not show comment textarea for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test comments')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    // Wait for comments section to load
    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible({ timeout: 10000 })

    // Comment textarea with placeholder "Write your comment..." should not be visible
    const commentTextarea = page.getByPlaceholder(/write your comment/i)
    await expect(commentTextarea).not.toBeVisible()
  })

  test('should display existing comments or empty state', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test comments')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible({ timeout: 10000 })

    // Either comments exist (rendered as cards with bg-white rounded-lg)
    // or the empty state shows "No comments yet. Be the first to share your thoughts!"
    const commentCards = page.locator('[id^="comment-"]')
    const emptyState = page.getByText(/no comments yet/i)

    const hasComments = (await commentCards.count()) > 0
    const hasEmptyState = await emptyState.isVisible().catch(() => false)

    expect(hasComments || hasEmptyState).toBe(true)
  })

  test('should not show reply button for unauthenticated users', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const listingCount = await listingsPage.getListingCount()
    test.skip(listingCount === 0, 'No listings available to test comments')

    await listingsPage.clickFirstListing()
    await page.waitForLoadState('domcontentloaded')

    const commentsHeading = page.getByRole('heading', { name: /comments/i })
    await expect(commentsHeading).toBeVisible({ timeout: 10000 })

    // Reply buttons are only rendered when user is authenticated
    const replyButtons = page.getByRole('button', { name: /reply/i })
    await expect(replyButtons).toHaveCount(0)
  })
})
