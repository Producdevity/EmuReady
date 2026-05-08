import { test } from '@playwright/test'
import { createHandheldListing, createReport, withContext } from './helpers/data-factory'

test.describe.serial('Test Data Setup', () => {
  test.setTimeout(120000)

  test('ensure approved handheld listing exists', async ({ browser }) => {
    await withContext(browser, 'tests/.auth/user.json', async (page) => {
      await createHandheldListing(page)
    })
  })

  test('ensure report exists for admin-reports tests', async ({ browser }) => {
    // Reporter must differ from the listing author — the Report button is
    // hidden on listings you authored.
    await withContext(browser, 'tests/.auth/author.json', async (page) => {
      await createReport(page)
    })
  })
})
