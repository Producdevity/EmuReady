import { randomUUID } from 'node:crypto'
import { test, expect } from './fixtures'
import {
  openFirstAdminReportDetails,
  searchAdminReports,
  selectAdminReportType,
} from './helpers/admin-reports'
import { createPcReport, createReport, withContext } from './helpers/data-factory'

test.describe('Report submission and admin review', () => {
  test('submits a handheld report and shows it in admin report details', async ({ browser }) => {
    const description = `E2E handheld report admin review ${randomUUID()}`

    await withContext(browser, 'tests/.auth/author.json', async (page) => {
      await createReport(page, description)
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await page.goto('/admin/reports', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('table').first()).toBeVisible()

      await selectAdminReportType(page, 'Handheld Reports')
      await searchAdminReports(page, description, 'listingReports.get')

      const reportModal = await openFirstAdminReportDetails(page)

      await expect(reportModal).toContainText(description)
      await expect(reportModal).toContainText('Handheld Report')
      await expect(reportModal.getByText('Device', { exact: true })).toBeVisible()
      await expect(reportModal.getByRole('button', { name: /view report/i })).toBeVisible()
    })
  })

  test('submits a PC report and shows it in admin report details', async ({ browser }) => {
    const description = `E2E PC report admin review ${randomUUID()}`

    await withContext(browser, 'tests/.auth/author.json', async (page) => {
      await createPcReport(page, description)
    })

    await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
      await page.goto('/admin/reports', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('table').first()).toBeVisible()

      await selectAdminReportType(page, 'PC Reports')
      await searchAdminReports(page, description, 'pcListingReports.get')

      const reportModal = await openFirstAdminReportDetails(page)

      await expect(reportModal).toContainText(description)
      await expect(reportModal).toContainText('PC Report')
      await expect(reportModal.getByText('Hardware', { exact: true })).toBeVisible()
      await expect(reportModal.getByRole('button', { name: /view report/i })).toBeVisible()
    })
  })
})
