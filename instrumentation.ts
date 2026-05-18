/**
 * Next.js Instrumentation
 * This file runs once when the Next.js server starts
 * for one-time initialization of services
 */

import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return

  const { initializeServerOnce } = await import('./src/server/init')
  await initializeServerOnce()
}
