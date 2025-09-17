/**
 * Initialize Nintendo 3DS game services on server startup
 */

import { logger } from '@/lib/logger'
import { threeDsGameRefreshService } from './threeDsGameRefreshService'

let initPromise: Promise<void> | null = null

export async function initializeThreeDsGameService(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      await threeDsGameRefreshService.initialize()

      const status = await threeDsGameRefreshService.getStatus()
      logger.log('3DS game service initialized')
      logger.log(`Auto-refresh: ${status.autoRefreshEnabled ? 'enabled' : 'disabled'}`)
      logger.log(`Titles cached: ${status.totalGames}`)

      if (status.nextRefresh) {
        logger.log(`Next refresh: ${status.nextRefresh.toISOString()}`)
      }
    } catch (error) {
      console.error('Failed to initialize 3DS game service:', error)
      initPromise = null
    }
  })()

  return initPromise
}
