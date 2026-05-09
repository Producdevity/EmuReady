import { test as base } from '@playwright/test'
import { registerCookieConsent } from './helpers/cookie-consent'
import { registerExternalServiceMocks } from './helpers/external-services'

export const test = base.extend({
  page: async ({ page }, run) => {
    await registerCookieConsent(page.context())
    await registerExternalServiceMocks(page)
    await run(page)
  },
})

export { expect } from '@playwright/test'
