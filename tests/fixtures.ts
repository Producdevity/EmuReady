import { test as base } from '@playwright/test'
import { registerCookieConsent } from './helpers/cookie-consent'

export const test = base.extend({
  // The fixture-API callback is `use` by convention. Renamed to `run`
  // so Next.js's `react-hooks/rules-of-hooks` ESLint rule does not
  // misclassify `use(page)` as a React Hook call.
  page: async ({ page }, run) => {
    await registerCookieConsent(page.context())
    await run(page)
  },
})

export { expect } from '@playwright/test'
export type { Page, Locator } from '@playwright/test'
