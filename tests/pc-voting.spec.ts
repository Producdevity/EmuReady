import { test, expect } from './fixtures'
import { createApprovedPcListing } from './helpers/data-factory'

test.describe('PC Listing Voting Functionality Tests', () => {
  let pcListingUrl = ''

  test.beforeAll(async ({ browser }) => {
    pcListingUrl = await createApprovedPcListing(browser)
  })

  test('should display vote section on PC listing detail page', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const verificationHeading = page.getByRole('heading', {
      name: /community verification/i,
    })
    await expect(verificationHeading).toBeVisible()
  })

  test('should display confirm and inaccurate vote buttons', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })

    await expect(confirmButton).toBeVisible()
    await expect(inaccurateButton).toBeVisible()
  })

  test('should display success rate percentage and voter count', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const successRate = page.getByText(/\d+%/)
    await expect(successRate.first()).toBeVisible()

    const verifiedByText = page.getByText(/verified by \d+ users/i)
    await expect(verifiedByText).toBeVisible()
  })

  test('should show help button for voting explanation', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const helpButton = page.getByTitle('How does verification work?')
    await expect(helpButton).toBeVisible()
  })

  test('should show sign-in prompt for unauthenticated users', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const signInToVerify = page
      .getByText(/sign in/i)
      .locator('..')
      .filter({ hasText: /to verify/i })
    await expect(signInToVerify).toBeVisible()
  })

  test('should have vote buttons disabled for unauthenticated users', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    await expect(confirmButton).toBeVisible()
    await expect(confirmButton).toBeDisabled()

    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })
    await expect(inaccurateButton).toBeDisabled()
  })

  test('should display progress bar for success rate', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const progressBar = page.getByRole('progressbar', { name: /success rate/i })
    await expect(progressBar).toBeVisible()

    const valueNow = await progressBar.getAttribute('aria-valuenow')
    expect(valueNow).toMatch(/^\d+$/)
    const numericValue = Number(valueNow)
    expect(numericValue).toBeGreaterThanOrEqual(0)
    expect(numericValue).toBeLessThanOrEqual(100)
  })
})

test.describe('PC Listing Vote — Toggle and Change Flows (Authenticated)', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  let pcListingUrl = ''

  test.beforeAll(async ({ browser }) => {
    pcListingUrl = await createApprovedPcListing(browser)
  })

  test('toggling the same vote twice returns the button to its unpressed state', async ({
    page,
  }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    await expect(confirmButton).toBeVisible()

    const initial = await confirmButton.getAttribute('aria-pressed')

    await confirmButton.click()
    await expect(confirmButton).toHaveAttribute(
      'aria-pressed',
      initial === 'true' ? 'false' : 'true',
    )

    await confirmButton.click()
    await expect(confirmButton).toHaveAttribute('aria-pressed', initial ?? 'false')
  })

  test('changing from upvote to downvote flips aria-pressed on both buttons', async ({ page }) => {
    await page.goto(pcListingUrl)
    await page.waitForLoadState('domcontentloaded')

    const confirmButton = page.getByRole('button', { name: /confirm/i })
    const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })

    const confirmPressed = await confirmButton.getAttribute('aria-pressed')
    if (confirmPressed !== 'true') {
      await confirmButton.click()
      await expect(confirmButton).toHaveAttribute('aria-pressed', 'true')
    }

    await inaccurateButton.click()
    await expect(inaccurateButton).toHaveAttribute('aria-pressed', 'true')
    await expect(confirmButton).toHaveAttribute('aria-pressed', 'false')
  })
})
