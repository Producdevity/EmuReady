import { test, expect } from './fixtures'

const OPTIONAL_SERVICE_REQUEST_PATTERNS = [
  'storage.ko-fi.com',
  'googletagmanager.com',
  'google-analytics.com',
  'ingest.us.sentry.io',
] as const

test.describe('Optional browser services', () => {
  test('does not request disabled analytics, Ko-fi, or Sentry scripts in test builds', async ({
    page,
  }) => {
    const optionalServiceRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (OPTIONAL_SERVICE_REQUEST_PATTERNS.some((pattern) => url.includes(pattern))) {
        optionalServiceRequests.push(url)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    expect(optionalServiceRequests).toEqual([])
  })
})
