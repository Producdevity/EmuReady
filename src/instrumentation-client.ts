// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://85ca585e45005d8786e361c3456518bf@o74828.ingest.us.sentry.io/4509717207318529',

    integrations: [Sentry.replayIntegration()],

    tracesSampleRate: 1,
    enableLogs: true,

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    debug: false,

    beforeSend(event, hint) {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return null

      const error = hint?.originalException
      const errorMessage = error?.toString() || event.exception?.values?.[0]?.value || ''
      const errorUrl = event.request?.url || ''

      const ignoredPatterns = [
        'productfruits',
        'my.productfruits.com',
        'pf - starting script',
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'ResizeObserver loop',
      ]

      const shouldIgnore = ignoredPatterns.some(
        (pattern) =>
          errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
          errorUrl.toLowerCase().includes(pattern.toLowerCase()),
      )

      return shouldIgnore ? null : event
    },
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
