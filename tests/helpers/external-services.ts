import type { Page } from '@playwright/test'

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)

export async function registerExternalServiceMocks(page: Page) {
  await page.route(/\/api\/proxy-image(?:\?.*)?$/u, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: transparentPng,
    })
  })

  await page.route(
    /^https:\/\/(?:cdn\.thegamesdb\.net|media\.rawg\.io|images\.igdb\.com|assets\.nintendo\.com)\/.*/u,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: transparentPng,
      })
    },
  )

  await page.route('**/api/retrocatalog/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    })
  })
}
