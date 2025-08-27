/**
 * Next.js Instrumentation
 * This file runs once when the Next.js server starts
 * for one-time initialization of services
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run server initialization in Node.js runtime (not edge)
    await import('./src/server/init')
  }
}
