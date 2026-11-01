import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

if (process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true') {
  Sentry.init({
    dsn: 'https://85ca585e45005d8786e361c3456518bf@o74828.ingest.us.sentry.io/4509717207318529',
    environment: env.APP_ENV,
    ...(process.env.APP_VERSION ? { release: process.env.APP_VERSION } : {}),
    sampleRate: 1,
    tracesSampleRate: 0.1,
    enableLogs: true,
    sendDefaultPii: false,
  })
}
