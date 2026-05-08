import type { Page } from '@playwright/test'

export async function waitForPageStability(page: Page, timeout = 5000) {
  await page.waitForLoadState('domcontentloaded', { timeout })
}
