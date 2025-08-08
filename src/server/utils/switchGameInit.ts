/**
 * Initialize Switch game services
 */

import { switchGameRefreshService } from './switchGameRefreshService'

let isInitialized = false

export async function initializeSwitchGameService(): Promise<void> {
  if (isInitialized) return
  try {
    // Initialize the refresh service by getting its status
    // This ensures the singleton is created and starts processing
    const status = await switchGameRefreshService.getStatus()

    console.log('Switch game service initialized')
    console.log(
      `Auto-refresh: ${status.autoRefreshEnabled ? 'enabled' : 'disabled'}`,
    )
    console.log(`Games cached: ${status.totalGames}`)

    if (status.nextRefresh) {
      console.log(`Next refresh: ${status.nextRefresh.toISOString()}`)
    }

    isInitialized = true
  } catch (error) {
    console.error('Failed to initialize Switch game service:', error)
    // Don't throw here to prevent breaking the app startup
  }
}
