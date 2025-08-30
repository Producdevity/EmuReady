// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://85ca585e45005d8786e361c3456518bf@o74828.ingest.us.sentry.io/4509717207318529',

  // Only enable Sentry in production
  enabled: process.env.NODE_ENV === 'production',

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out localhost and third-party errors
  beforeSend(event, hint) {
    // Don't send events from localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return null

    // Filter out third-party script errors
    const error = hint?.originalException
    const errorMessage = error?.toString() || event.exception?.values?.[0]?.value || ''
    const errorUrl = event.request?.url || ''

    // List of third-party domains and patterns to ignore
    const ignoredPatterns = [
      'productfruits',
      'my.productfruits.com',
      'pf - starting script',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ResizeObserver loop',
    ]

    // Check if error matches any ignored pattern
    const shouldIgnore = ignoredPatterns.some(
      (pattern) =>
        errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
        errorUrl.toLowerCase().includes(pattern.toLowerCase()),
    )

    return shouldIgnore ? null : event
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
