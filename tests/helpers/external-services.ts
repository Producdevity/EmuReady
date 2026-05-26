import type { Page } from '@playwright/test'

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)

export async function registerExternalServiceMocks(page: Page) {
  await page.route('**/_vercel/speed-insights/script.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '',
    })
  })

  await page.route(
    'https://storage.ko-fi.com/cdn/scripts/floating-chat-wrapper.css',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/css',
        body: '',
      })
    },
  )

  await page.route('https://storage.ko-fi.com/cdn/scripts/overlay-widget.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.kofiWidgetOverlay={draw:function(){}};',
    })
  })

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
