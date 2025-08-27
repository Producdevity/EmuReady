/**
 * Initialize Switch game services
 * This should only be called once during app startup
 */

import { switchGameRefreshService } from './switchGameRefreshService'

let initPromise: Promise<void> | null = null

export async function initializeSwitchGameService(): Promise<void> {
  // Return existing initialization promise if already in progress
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      // Initialize the service (handles its own duplicate check)
      await switchGameRefreshService.initialize()

      const status = await switchGameRefreshService.getStatus()
      console.log('Switch game service initialized')
      console.log(`Auto-refresh: ${status.autoRefreshEnabled ? 'enabled' : 'disabled'}`)
      console.log(`Games cached: ${status.totalGames}`)

      if (status.nextRefresh) {
        console.log(`Next refresh: ${status.nextRefresh.toISOString()}`)
      }
    } catch (error) {
      console.error('Failed to initialize Switch game service:', error)
      // Reset promise on failure to allow retry
      initPromise = null
      // Don't throw here to prevent breaking the app startup
    }
  })()

  return initPromise
}
