import { type Page, test, expect } from '@playwright/test'

// Mirrors voting.spec.ts for handheld listings — PcVoteButtons wraps the
// shared VoteButtons component, so both should behave identically.

async function navigateToFirstPcListing(page: Page) {
  await page.goto('/pc-listings')
  await page.waitForLoadState('domcontentloaded')

  const rows = page.locator('tbody tr')
  await expect(rows.first()).toBeVisible()

  await rows.first().locator('a').first().click()
  await page.waitForLoadState('domcontentloaded')
}

test.describe('PC Listing Voting Functionality Tests', () => {
  test('should display vote section on PC listing detail page', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const verificationHeading = page.getByRole('heading', {
      name: /community verification/i,
    })
    await expect(verificationHeading).toBeVisible()
  })

  test('should display confirm and inaccurate vote buttons', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })

    await expect(confirmButton).toBeVisible()
    await expect(inaccurateButton).toBeVisible()
  })

  test('should display success rate percentage and voter count', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const successRate = page.getByText(/\d+%/)
    await expect(successRate.first()).toBeVisible()

    const verifiedByText = page.getByText(/verified by \d+ users/i)
    await expect(verifiedByText).toBeVisible()
  })

  test('should show help button for voting explanation', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const helpButton = page.getByTitle('How does verification work?')
    await expect(helpButton).toBeVisible()
  })

  test('should show sign-in prompt for unauthenticated users', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const signInToVerify = page
      .getByText(/sign in/i)
      .locator('..')
      .filter({ hasText: /to verify/i })
    await expect(signInToVerify).toBeVisible()
  })

  test('should have vote buttons disabled for unauthenticated users', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    await expect(confirmButton).toBeVisible()
    await expect(confirmButton).toBeDisabled()

    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })
    await expect(inaccurateButton).toBeDisabled()
  })

  test('should display progress bar for success rate', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const verificationHeading = page.getByRole('heading', {
      name: /community verification/i,
    })
    await expect(verificationHeading).toBeVisible()

    await expect(page.getByText(/\d+%/)).toBeVisible()
    await expect(page.getByText(/verified by \d+ users/i)).toBeVisible()
  })
})

test.describe('PC Listing Vote — Toggle and Change Flows (Authenticated)', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('toggling the same vote twice returns the button to its unpressed state', async ({
    page,
  }) => {
    await navigateToFirstPcListing(page)

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    await expect(confirmButton).toBeVisible()

    const initial = await confirmButton.getAttribute('aria-pressed')

    // Click once → flip
    await confirmButton.click()
    await expect(confirmButton).toHaveAttribute(
      'aria-pressed',
      initial === 'true' ? 'false' : 'true',
    )

    // Click again → flip back
    await confirmButton.click()
    await expect(confirmButton).toHaveAttribute('aria-pressed', initial ?? 'false')
  })

  test('changing from upvote to downvote flips aria-pressed on both buttons', async ({ page }) => {
    await navigateToFirstPcListing(page)

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })

    // Ensure upvote is active
    const confirmPressed = await confirmButton.getAttribute('aria-pressed')
    if (confirmPressed !== 'true') {
      await confirmButton.click()
      await expect(confirmButton).toHaveAttribute('aria-pressed', 'true')
    }

    // Change to downvote
    await inaccurateButton.click()
    await expect(inaccurateButton).toHaveAttribute('aria-pressed', 'true')
    await expect(confirmButton).toHaveAttribute('aria-pressed', 'false')
  })
})
