import storageKeys from '@/data/storageKeys'
import type { BrowserContext, Page } from '@playwright/test'

function applyConsent(keys: typeof storageKeys.cookies) {
  localStorage.setItem(keys.consent, JSON.stringify(true))
  localStorage.setItem(
    keys.preferences,
    JSON.stringify({ necessary: true, analytics: false, performance: false }),
  )
  localStorage.setItem(keys.consentDate, JSON.stringify(new Date().toISOString()))
  localStorage.setItem(keys.analyticsEnabled, JSON.stringify(false))
  localStorage.setItem(keys.performanceEnabled, JSON.stringify(false))

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
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true })
    }
  }
}

export async function registerCookieConsent(target: BrowserContext | Page) {
  await target.addInitScript(applyConsent, storageKeys.cookies)
}
