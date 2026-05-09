import type { BrowserContext, Page } from '@playwright/test'

const STORAGE_PREFIX = process.env.NEXT_PUBLIC_LOCAL_STORAGE_PREFIX
if (!STORAGE_PREFIX) {
  throw new Error(
    'NEXT_PUBLIC_LOCAL_STORAGE_PREFIX is not set in the test environment. ' +
      'playwright.config.ts loads .env.local and .env.test.local — ensure one of them defines it.',
  )
}

function applyConsent(prefix: string) {
  localStorage.setItem(`${prefix}cookie_consent`, JSON.stringify(true))
  localStorage.setItem(
    `${prefix}cookie_preferences`,
    JSON.stringify({ necessary: true, analytics: false, performance: false }),
  )
  localStorage.setItem(`${prefix}cookie_consent_date`, JSON.stringify(new Date().toISOString()))
  localStorage.setItem(`${prefix}analytics_enabled`, JSON.stringify(false))
  localStorage.setItem(`${prefix}performance_enabled`, JSON.stringify(false))

  const styleId = '__e2e_cookie_consent_hidden__'
  const css = '[data-testid="cookie-consent"]{display:none !important;}'
  let observer: MutationObserver | null = null
  function injectStyle() {
    if (document.getElementById(styleId)) {
      observer?.disconnect()
      return
    }
    const target = document.head ?? document.documentElement
    if (!target) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = css
    target.appendChild(style)
    observer?.disconnect()
  }
  injectStyle()
  if (!document.getElementById(styleId)) {
    document.addEventListener('readystatechange', injectStyle, { once: true })
    document.addEventListener('DOMContentLoaded', injectStyle, { once: true })
    observer = new MutationObserver(injectStyle)
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }
}

export async function registerCookieConsent(target: BrowserContext | Page) {
  await target.addInitScript(applyConsent, STORAGE_PREFIX)
}
