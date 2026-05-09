import { test } from '@playwright/test'
import {
  ensureApprovedPcListing,
  createHandheldListing,
  createReport,
  withContext,
} from './helpers/data-factory'

test.describe.serial('Test Data Setup', () => {
  test.setTimeout(120000)

  test('ensure approved handheld listing exists', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await createHandheldListing(page)
    })
  })

  test('ensure approved PC listing exists', async ({ browser }) => {
    // Seed user has trust score 0 and creates pending PC listings, so the
    // listing is created as a regular user and then approved as super_admin.
    await ensureApprovedPcListing(browser)
  })

  test('ensure report exists for admin-reports tests', async ({ browser }) => {
    // Reporter must differ from the listing author — the Report button is
    // hidden on listings you authored.
    await withContext(browser, 'tests/.auth/author.json', async (page) => {
      await createReport(page)
    })
  })
})
