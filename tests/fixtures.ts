import { test as base } from '@playwright/test'
import { registerCookieConsent } from './helpers/cookie-consent'

export const test = base.extend({
  page: async ({ page }, run) => {
    await registerCookieConsent(page.context())
    await run(page)
  },
})

export { expect } from '@playwright/test'
