import { test } from '@playwright/test'
import {
  ensureApprovedPcListing,
  createHandheldListing,
  createReport,
  withContext,
} from './helpers/data-factory'

test.describe.serial('Test Data Setup', () => {
  test.setTimeout(120000)

  test('ensure handheld listing creation works', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await createHandheldListing(page)
    })
  })

  test('ensure approved PC listing exists for list and voting tests', async ({ browser }) => {
    await ensureApprovedPcListing(browser)
  })

  test('ensure report exists from a non-author account', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/author.json', async (page) => {
      await createReport(page)
    })
  })
})
