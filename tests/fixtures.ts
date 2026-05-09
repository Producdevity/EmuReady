import { test as base } from '@playwright/test'
import { registerCookieConsent } from './helpers/cookie-consent'

export const test = base.extend({
  // Renamed `use` → `run` so Next.js's react-hooks/rules-of-hooks lint rule
  // does not misclassify `use(page)` as a React Hook call.
  page: async ({ page }, run) => {
    await registerCookieConsent(page.context())
    await run(page)
  },
})

export { expect } from '@playwright/test'
