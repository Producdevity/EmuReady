import * as Sentry from '@sentry/nextjs'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export async function register() {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
    const { initializeServerOnce } = await import('./src/server/init')
    await initializeServerOnce()
  }
}

export const onRequestError = Sentry.captureRequestError
