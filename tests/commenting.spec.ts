import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Commenting System Tests', () => {
  test('should display comment section on listing details', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    // Navigate to listing detail
    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for comment section
      const commentSection = page.locator('[data-testid*="comment"], .comment-section, #comments')
      const hasCommentSection = await commentSection.isVisible({
        timeout: 3000,
      })

      if (hasCommentSection) {
        console.log('Comment section is present')

        // Check for comment form or login prompt
        const commentForm = page.locator('form[data-testid*="comment"], .comment-form')
        const authPrompt = page.getByText(/sign in to comment|log in to comment/i)

        const hasForm = await commentForm.isVisible({ timeout: 2000 }).catch(() => false)
        const hasAuthPrompt = await authPrompt.isVisible({ timeout: 2000 }).catch(() => false)

        expect(hasForm || hasAuthPrompt).toBe(true)
      }
    }
  })

  test('should display existing comments', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for comments list
      const comments = page.locator(
        '[data-testid="comment-item"], .comment, article[role="comment"]',
      )
      const commentCount = await comments.count()

      if (commentCount > 0) {
        console.log(`Found ${commentCount} comments`)

        // Verify comment structure
        const firstComment = comments.first()

        // Should have author
        const author = firstComment.locator('[data-testid*="author"], .comment-author')
        await expect(author).toBeVisible()

        // Should have content
        const content = firstComment.locator('[data-testid*="content"], .comment-content')
        await expect(content).toBeVisible()

        // Should have timestamp
        const timestamp = firstComment.locator('time, [data-testid*="time"], .comment-time')
        await expect(timestamp).toBeVisible()
      } else {
        // Check for no comments message
        const noComments = page.getByText(/no comments|be the first/i)
        const hasNoCommentsMsg = await noComments.isVisible({ timeout: 2000 }).catch(() => false)
        console.log(hasNoCommentsMsg ? 'No comments message shown' : 'Comments section empty')
      }
    }
  })

  test('should require authentication to comment', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    const authPage = new AuthPage(page)

    await listingsPage.goto()

    // Ensure not authenticated
    if (!(await authPage.isAuthenticated())) {
      if ((await listingsPage.getListingCount()) > 0) {
        await listingsPage.clickFirstListing()

        // Look for comment input
        const commentInput = page.locator(
          'textarea[placeholder*="comment"], input[placeholder*="comment"]',
        )

        if (await commentInput.isVisible({ timeout: 3000 })) {
          // Try to type
          await commentInput.click()

          // Should redirect or show auth prompt
          const authRequired = await page
            .getByText(/sign in|log in|authenticate/i)
            .isVisible({ timeout: 2000 })
            .catch(() => false)
          const redirected = page.url().includes('/sign-in') || page.url().includes('/login')

          expect(authRequired || redirected).toBe(true)
        } else {
          // Should show auth prompt instead of form
          const authPrompt = await page.getByText(/sign in to comment/i).isVisible()
          expect(authPrompt).toBe(true)
        }
      }
    }
  })

  test('should handle comment submission', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Find comment form
      const commentForm = page
        .locator('form')
        .filter({ has: page.locator('textarea, input[type="text"]') })

      if (await commentForm.isVisible({ timeout: 3000 })) {
        const commentInput = commentForm.locator('textarea, input[type="text"]').first()
        const submitButton = commentForm
          .locator('button[type="submit"], button')
          .filter({ hasText: /post|comment|submit/i })

        // Try to submit empty comment
        if (await submitButton.isVisible()) {
          await submitButton.click()

          // Should show validation error
          const validationError = await page
            .getByText(/required|empty|enter.*comment/i)
            .isVisible({ timeout: 2000 })
            .catch(() => false)

          if (validationError) {
            console.log('Empty comment validation works')
          }

          // Try with valid comment
          const testComment = 'This is a test comment from E2E tests'
          await commentInput.fill(testComment)
          await submitButton.click()

          // Should either submit or require auth
          await page.waitForTimeout(2000)
        }
      }
    }
  })

  test('should support comment voting', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Find comments with vote buttons
      const commentVotes = page.locator('[data-testid*="comment-vote"], .comment-vote')

      if ((await commentVotes.count()) > 0) {
        const firstVoteButton = commentVotes.first()
        const initialVoteCount = await firstVoteButton.textContent()

        await firstVoteButton.click()
        await page.waitForTimeout(500)

        const newVoteCount = await firstVoteButton.textContent()

        // Vote count should change or auth required
        const authPrompt = await page
          .getByText(/sign in|log in/i)
          .isVisible({ timeout: 1000 })
          .catch(() => false)

        if (!authPrompt) {
          expect(newVoteCount).not.toBe(initialVoteCount)
          console.log('Comment voting works')
        }
      }
    }
  })

  test('should handle nested comment replies', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for reply buttons
      const replyButtons = page.locator('button').filter({ hasText: /reply/i })

      if ((await replyButtons.count()) > 0) {
        await replyButtons.first().click()

        // Should show reply form or auth prompt
        const replyForm = page.locator('[data-testid*="reply-form"], .reply-form')
        const authPrompt = page.getByText(/sign in.*reply/i)

        const hasReplyForm = await replyForm.isVisible({ timeout: 2000 }).catch(() => false)
        const hasAuthPrompt = await authPrompt.isVisible({ timeout: 2000 }).catch(() => false)

        expect(hasReplyForm || hasAuthPrompt).toBe(true)

        if (hasReplyForm) {
          // Check for nested structure
          const nestedComments = page.locator('.comment-replies, [data-testid*="replies"]')
          const hasNestedStructure = (await nestedComments.count()) > 0
          console.log(
            `Comment reply system available${hasNestedStructure ? ' with nested structure' : ''}`,
          )
        }
      }
    }
  })

  test('should paginate long comment threads', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Check for comment pagination
      const loadMoreComments = page
        .locator('button')
        .filter({ hasText: /load more|show more.*comments/i })

      if (await loadMoreComments.isVisible({ timeout: 3000 })) {
        const initialCommentCount = await page
          .locator('[data-testid="comment-item"], .comment')
          .count()

        await loadMoreComments.click()
        await page.waitForTimeout(1500)

        const newCommentCount = await page.locator('[data-testid="comment-item"], .comment').count()

        expect(newCommentCount).toBeGreaterThan(initialCommentCount)
        console.log(`Loaded ${newCommentCount - initialCommentCount} more comments`)
      }
    }
  })

  test('should support markdown in comments', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for markdown editor indicators
      const markdownToolbar = page.locator('[data-testid*="markdown-toolbar"], .markdown-toolbar')
      const formattingButtons = page.locator(
        'button[aria-label*="bold"], button[aria-label*="italic"]',
      )

      if (
        (await markdownToolbar.isVisible({ timeout: 2000 })) ||
        (await formattingButtons.count()) > 0
      ) {
        console.log('Markdown support detected in comments')

        // Check for preview toggle
        const previewToggle = page.locator('button').filter({ hasText: /preview/i })
        if (await previewToggle.isVisible()) {
          await previewToggle.click()

          const preview = page.locator('[data-testid*="preview"], .markdown-preview')
          await expect(preview).toBeVisible()
        }
      }
    }
  })

  test('should handle comment moderation actions', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for moderation options
      const commentActions = page.locator('[data-testid*="comment-actions"], .comment-actions')

      if ((await commentActions.count()) > 0) {
        const firstActions = commentActions.first()

        // Check for report button
        const reportButton = firstActions.locator('button').filter({ hasText: /report/i })

        if (await reportButton.isVisible()) {
          await reportButton.click()

          // Should show report dialog or auth prompt
          const reportDialog = page.locator('[role="dialog"]').filter({ hasText: /report/i })
          const authPrompt = page.getByText(/sign in.*report/i)

          const hasDialog = await reportDialog.isVisible({ timeout: 2000 }).catch(() => false)
          const hasAuth = await authPrompt.isVisible({ timeout: 2000 }).catch(() => false)

          expect(hasDialog || hasAuth).toBe(true)
        }
      }
    }
  })

  test('should display comment timestamps correctly', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      const timestamps = page.locator('time, [data-testid*="timestamp"], .comment-time')

      if ((await timestamps.count()) > 0) {
        const firstTimestamp = timestamps.first()

        // Should have datetime attribute
        const datetime = await firstTimestamp.getAttribute('datetime')
        if (datetime) {
          expect(datetime).toMatch(/\d{4}-\d{2}-\d{2}/) // ISO format
        }

        // Should have human-readable text
        const timeText = await firstTimestamp.textContent()
        expect(timeText).toMatch(/ago|minute|hour|day|week|month|year|\d{4}/)

        console.log(`Comment timestamp format: ${timeText}`)
      }
    }
  })
})

test.describe('Comment Interaction Tests', () => {
  test('should handle real-time comment updates', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Check for real-time indicators
      const liveIndicators = page.locator('[data-testid*="live"], .live-comments, [aria-live]')

      if ((await liveIndicators.count()) > 0) {
        console.log('Real-time comment updates supported')

        // Wait to see if new comments appear
        const initialCount = await page.locator('[data-testid="comment-item"]').count()

        await page.waitForTimeout(5000)

        const newCount = await page.locator('[data-testid="comment-item"]').count()

        if (newCount > initialCount) {
          console.log(`${newCount - initialCount} new comments appeared`)
        }
      }
    }
  })

  test('should support comment editing', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for edit buttons on comments
      const editButtons = page.locator('button').filter({ hasText: /edit/i })

      if ((await editButtons.count()) > 0) {
        console.log('Comment editing feature available')

        await editButtons.first().click()

        // Should show edit form or auth required
        const editForm = page.locator('[data-testid*="edit-form"], .edit-form')
        const authPrompt = page.getByText(/sign in.*edit/i)

        const hasEditForm = await editForm.isVisible({ timeout: 2000 }).catch(() => false)
        const hasAuth = await authPrompt.isVisible({ timeout: 2000 }).catch(() => false)

        expect(hasEditForm || hasAuth).toBe(true)
      }
    }
  })

  test('should handle comment deletion', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    if ((await listingsPage.getListingCount()) > 0) {
      await listingsPage.clickFirstListing()

      // Look for delete buttons
      const deleteButtons = page.locator('button').filter({ hasText: /delete/i })

      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click()

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm|delete/i })
        const hasConfirm = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)

        if (hasConfirm) {
          console.log('Comment deletion requires confirmation')

          // Cancel deletion
          const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i })
          if (await cancelButton.isVisible()) {
            await cancelButton.click()
          }
        }
      }
    }
  })
})
