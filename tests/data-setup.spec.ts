import { test } from '@playwright/test'
import {
  createHandheldListing,
  createPcListing,
  createReport,
  withContext,
} from './helpers/data-factory'

// Runs after auth setup, before all specs. Creates baseline data other tests
// depend on. The test user has enough trust score that their listings are
// auto-approved on creation — no explicit approve step needed. Pending
// listings for approval tests come from the seeder. If any step fails, the
// Playwright project-dependency system cascades skips to downstream specs.

test.describe.serial('Test Data Setup', () => {
  test.setTimeout(120000)

  test('ensure approved handheld listing exists', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await createHandheldListing(page)
    })
  })

  test('ensure approved PC listing exists', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await createPcListing(page)
    })
  })

  test('ensure report exists for admin-reports tests', async ({ browser }) => {
    // Use a different user than the listing author — the Report button is
    // hidden when viewing your own listings.
    await withContext(browser, 'tests/.auth/author.json', async (page) => {
      await createReport(page)
    })
  })
})
