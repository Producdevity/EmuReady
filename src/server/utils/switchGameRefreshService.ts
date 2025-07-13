/**
 * Periodic refresh service for Nintendo Switch game data
 * Automatically updates cached game data on a schedule
 */

import { refreshSwitchGamesData, getSwitchGamesStats } from './switchGameSearch'

export interface RefreshConfig {
  refreshIntervalMs: number // How often to check for refresh (default: 1 hour)
  autoRefreshEnabled: boolean // Whether auto-refresh is enabled
  refreshOnStartup: boolean // Whether to refresh data on service startup
}

export interface RefreshStatus {
  lastRefresh: Date | null
  nextRefresh: Date | null
  isRefreshing: boolean
  totalGames: number
  autoRefreshEnabled: boolean
}

export class SwitchGameRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null
  private isRefreshing = false
  private lastRefresh: Date | null = null
  private config: RefreshConfig

  constructor(config: Partial<RefreshConfig> = {}) {
    this.config = {
      refreshIntervalMs: 60 * 60 * 1000, // 1 hour default
      autoRefreshEnabled: true,
      refreshOnStartup: true,
      ...config,
    }

    this.initializeService()
      .then(() => {
        console.log(
          'Switch game refresh service initialized with config:',
          this.config,
        )
      })
      .catch((error) => {
        console.error(
          'Failed to initialize Switch game refresh service:',
          error,
        )
      })
  }

  private async initializeService(): Promise<void> {
    try {
      // Refresh on startup if enabled
      if (this.config.refreshOnStartup) {
        console.log('Switch game refresh service: Initial data refresh...')
        await this.performRefresh()
      }

      // Start periodic refresh timer if enabled
      if (this.config.autoRefreshEnabled) {
        this.startRefreshTimer()
        console.log(
          `Switch game refresh service: Auto-refresh enabled (every ${this.config.refreshIntervalMs / 1000 / 60} minutes)`,
        )
      }
    } catch (error) {
      console.error('Failed to initialize Switch game refresh service:', error)
    }
  }

  private startRefreshTimer(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer)

    this.refreshTimer = setInterval(() => {
      this.performRefresh().catch((error) => {
        console.error('Scheduled Switch game data refresh failed:', error)
      })
    }, this.config.refreshIntervalMs)

    // Allow process to exit if no other tasks are queued
    this.refreshTimer.unref?.()
  }

  private async performRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('Switch game data refresh already in progress, skipping...')
      return false
    }

    this.isRefreshing = true
    const startTime = Date.now()

    try {
      console.log('Starting Switch game data refresh...')

      await refreshSwitchGamesData()

      this.lastRefresh = new Date()
      const duration = Date.now() - startTime

      const stats = await getSwitchGamesStats()
      console.log(
        `Switch game data refresh completed successfully in ${duration}ms (${stats.totalGames} games)`,
      )

      return true
    } catch (error) {
      console.error('Switch game data refresh failed:', error)
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Manually trigger a refresh of Switch game data
   */
  async manualRefresh(): Promise<boolean> {
    console.log('Manual Switch game data refresh triggered')
    return this.performRefresh()
  }

  /**
   * Enable or disable auto-refresh
   */
  setAutoRefresh(enabled: boolean): void {
    if (enabled === this.config.autoRefreshEnabled) {
      return // No change
    }

    this.config.autoRefreshEnabled = enabled

    if (enabled) {
      this.startRefreshTimer()
      console.log('Switch game auto-refresh enabled')
    } else {
      this.stopRefreshTimer()
      console.log('Switch game auto-refresh disabled')
    }
  }

  /**
   * Update the refresh interval
   */
  setRefreshInterval(intervalMs: number): void {
    this.config.refreshIntervalMs = intervalMs

    if (this.config.autoRefreshEnabled) {
      this.startRefreshTimer() // Restart with new interval
      console.log(
        `Switch game refresh interval updated to ${intervalMs / 1000 / 60} minutes`,
      )
    }
  }

  /**
   * Get current refresh status
   */
  async getStatus(): Promise<RefreshStatus> {
    const stats = await getSwitchGamesStats().catch(() => ({ totalGames: 0 }))

    const nextRefresh =
      this.config.autoRefreshEnabled && this.lastRefresh
        ? new Date(this.lastRefresh.getTime() + this.config.refreshIntervalMs)
        : null

    return {
      lastRefresh: this.lastRefresh,
      nextRefresh,
      isRefreshing: this.isRefreshing,
      totalGames: stats.totalGames,
      autoRefreshEnabled: this.config.autoRefreshEnabled,
    }
  }

  private stopRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * Cleanup and stop the service
   */
  destroy(): void {
    this.stopRefreshTimer()
    console.log('Switch game refresh service stopped')
  }
}

// Singleton instance - configure for production use
// Refresh every 12 hours since the data updates weekly
export const switchGameRefreshService = new SwitchGameRefreshService({
  refreshIntervalMs: 12 * 60 * 60 * 1000, // 12 hours
  autoRefreshEnabled: true,
  refreshOnStartup: true,
})
