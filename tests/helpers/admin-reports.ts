import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

export const HANDHELD_REPORT_DESCRIPTION = 'E2E test report for admin-reports testing'
export const PC_REPORT_DESCRIPTION = 'E2E test PC report for admin-reports testing'

export async function selectAdminReportType(page: Page, label: 'Handheld Reports' | 'PC Reports') {
  const reportTypeButton = page
    .locator('button')
    .filter({ hasText: /handheld reports|pc reports/i })
    .first()
  await expect(reportTypeButton).toBeVisible()

  if ((await reportTypeButton.textContent())?.includes(label)) return

  await reportTypeButton.click()
  await page
    .locator('div')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .last()
    .click()
  await expect(reportTypeButton).toContainText(label)
}

export async function searchAdminReports(page: Page, query: string, routeName: string) {
  const searchInput = page.getByPlaceholder(/search reports by compatibility report/i)
  await expect(searchInput).toBeVisible()

  const searchResponse = page.waitForResponse(
    (response) => response.url().includes(routeName) && response.ok(),
  )

  await searchInput.fill(query)
  await searchResponse

  await expect(page.locator('table tbody tr').first()).toBeVisible()
}

export async function openFirstAdminReportDetails(page: Page): Promise<Locator> {
  const viewButtons = page.locator('button[title="View Report Details"]')
  await expect(viewButtons.first()).toBeVisible()
  await viewButtons.first().click()

  const reportModal = page.locator('[role="dialog"]')
  await expect(reportModal).toBeVisible()
  return reportModal
}
