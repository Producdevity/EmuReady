import type { Page } from '@playwright/test'

export async function registerExternalServiceMocks(page: Page) {
  await page.route('**/api/retrocatalog/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    })
  })
}
