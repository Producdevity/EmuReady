import { test, expect } from '@playwright/test'
import {
  approveFirstPendingListing,
  createPcListing,
  rejectFirstPendingListing,
  resetUserTrustScore,
  withContext,
} from './helpers/data-factory'
import type { Page } from '@playwright/test'

async function verifyTrustLogContains(page: Page, actionText: string) {
  await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/loading/i)).toBeHidden()

  const table = page.locator('table')
  await expect(table).toBeVisible()

  const rows = page.locator('table tbody tr').filter({ hasText: new RegExp(actionText, 'i') })
  expect(await rows.count()).toBeGreaterThan(0)
}

test.describe('Trust Effects E2E — Self-Contained', () => {
  test.setTimeout(60000)

  test('listing creation records LISTING_CREATED trust action', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await createPcListing(page)
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'created a listing')
    })
  })

  test('approving a listing records LISTING_APPROVED trust action', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await approveFirstPendingListing(page, '/admin/approvals')
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'approved')
    })
  })

  test('admin trust adjustment resets score, user listing stays pending, admin approval triggers LISTING_APPROVED', async ({
    browser,
  }) => {
    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await resetUserTrustScore(page, 'user@emuready')
    })

    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await createPcListing(page)
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await approveFirstPendingListing(page, '/admin/approvals')
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'approved')
    })
  })

  test('rejecting a listing records LISTING_REJECTED trust action', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await rejectFirstPendingListing(page, '/admin/approvals')
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'rejected')
    })
  })

  test('voting on a PC listing records UPVOTE trust action', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await page.goto('/pc-listings')

      const rows = page.locator('tbody tr')
      await expect(rows.first()).toBeVisible()

      await rows.first().locator('a').first().click()
      await page.waitForLoadState('domcontentloaded')

      const confirmButton = page.getByRole('button', { name: /confirm/i })
      await expect(confirmButton).toBeVisible()

      const wasPressed = await confirmButton.getAttribute('aria-pressed')
      await confirmButton.click()

      await expect(confirmButton).toHaveAttribute(
        'aria-pressed',
        wasPressed === 'true' ? 'false' : 'true',
      )
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'upvoted a listing')
    })
  })

  test('voting on a handheld listing records UPVOTE trust action', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await page.goto('/listings')

      const rows = page.locator('table tbody tr')
      await expect(rows.first()).toBeVisible()

      const link = rows.first().locator('a[href*="/listings/"]').first()
      await link.click()
      await page.waitForLoadState('domcontentloaded')

      const confirmButton = page.getByRole('button', { name: /confirm/i })
      await expect(confirmButton).toBeVisible()

      const wasPressed = await confirmButton.getAttribute('aria-pressed')
      await confirmButton.click()

      await expect(confirmButton).toHaveAttribute(
        'aria-pressed',
        wasPressed === 'true' ? 'false' : 'true',
      )
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'upvoted a listing')
    })
  })

  test('changing a vote (upvote → downvote) reverses previous then applies new trust', async ({
    browser,
  }) => {
    // User upvotes a listing, then changes to downvote
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await page.goto('/listings')
      const rows = page.locator('table tbody tr')
      await expect(rows.first()).toBeVisible()

      const link = rows.first().locator('a[href*="/listings/"]').first()
      await link.click()
      await page.waitForLoadState('domcontentloaded')

      const confirmButton = page.getByRole('button', { name: /confirm/i })
      const inaccurateButton = page.getByRole('button', { name: /inaccurate/i })
      await expect(confirmButton).toBeVisible()
      await expect(inaccurateButton).toBeVisible()

      // Ensure upvote is active
      const wasConfirmed = await confirmButton.getAttribute('aria-pressed')
      if (wasConfirmed !== 'true') {
        await confirmButton.click()
        await expect(confirmButton).toHaveAttribute('aria-pressed', 'true')
      }

      // Change to downvote — click the "Inaccurate" button
      await inaccurateButton.click()
      await expect(inaccurateButton).toHaveAttribute('aria-pressed', 'true')
      await expect(confirmButton).toHaveAttribute('aria-pressed', 'false')
    })

    // Admin verifies trust log has the reversal description
    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'Trust reversal due to vote change or removal')
    })
  })

  test('toggling off an upvote reverses the trust award', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await page.goto('/listings')
      const rows = page.locator('table tbody tr')
      await expect(rows.first()).toBeVisible()

      const link = rows.first().locator('a[href*="/listings/"]').first()
      await link.click()
      await page.waitForLoadState('domcontentloaded')

      const confirmButton = page.getByRole('button', { name: /confirm/i })
      await expect(confirmButton).toBeVisible()

      // Ensure upvote is active
      const wasPressed = await confirmButton.getAttribute('aria-pressed')
      if (wasPressed !== 'true') {
        await confirmButton.click()
        await expect(confirmButton).toHaveAttribute('aria-pressed', 'true')
      }

      // Toggle off
      await confirmButton.click()
      await expect(confirmButton).toHaveAttribute('aria-pressed', 'false')
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await verifyTrustLogContains(page, 'Trust reversal due to vote change or removal')
    })
  })

  test('trust logs table shows action data with weights', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await page.goto('/admin/trust-logs', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText(/loading/i)).toBeHidden()

      const table = page.locator('table')
      await expect(table).toBeVisible()

      const headerText = await page.locator('thead').textContent()
      expect(headerText?.toLowerCase()).toContain('action')
      expect(headerText?.toLowerCase()).toContain('weight')

      const rows = page.locator('table tbody tr')
      expect(await rows.count()).toBeGreaterThan(0)

      await expect(rows.first()).toContainText(/[+-]?\d+/)
    })
  })
})
