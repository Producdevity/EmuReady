/**
 * Periodic refresh service for Nintendo 3DS game data
 * Keeps the cached lookup dataset current without blocking requests
 */

import { logger } from '@/lib/logger'
import { ms } from '@/utils/time'
import { refreshThreeDsGamesData, getThreeDsGamesStats } from './threeDsGameSearch'

export interface ThreeDsRefreshConfig {
  refreshIntervalMs: number
  autoRefreshEnabled: boolean
  refreshOnStartup: boolean
}

export interface ThreeDsRefreshStatus {
  lastRefresh: Date | null
  nextRefresh: Date | null
  isRefreshing: boolean
  totalGames: number
  autoRefreshEnabled: boolean
}

export class ThreeDsGameRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null
  private isRefreshing = false
  private lastRefresh: Date | null = null
  private readonly config: ThreeDsRefreshConfig
  private initialized = false

  constructor(config: Partial<ThreeDsRefreshConfig> = {}) {
    this.config = {
      refreshIntervalMs: ms.hours(24),
      autoRefreshEnabled: true,
      refreshOnStartup: true,
      ...config,
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    try {
      await this.bootstrap()
      logger.log('3DS game refresh service initialized with config:', this.config)
    } catch (error) {
      logger.error('Failed to initialize 3DS game refresh service:', error)
      this.initialized = false
      throw error
    }
  }

  private async bootstrap(): Promise<void> {
    try {
      if (this.config.refreshOnStartup) {
        console.log('3DS game refresh service: Initial data refresh...')
        await this.performRefresh()
      }

      if (this.config.autoRefreshEnabled) {
        this.startTimer()
        console.log(
          `3DS game refresh service: Auto-refresh every ${this.config.refreshIntervalMs / 1000 / 60 / 60} hours`,
        )
      }
    } catch (error) {
      console.error('Failed to bootstrap 3DS game refresh service:', error)
    }
  }

  private startTimer(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer)

    this.refreshTimer = setInterval(() => {
      this.performRefresh().catch((error) => {
        console.error('Scheduled 3DS game data refresh failed:', error)
      })
    }, this.config.refreshIntervalMs)

    this.refreshTimer.unref?.()
  }

  private async performRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('3DS game data refresh already running; skipping new run')
      return false
    }

    this.isRefreshing = true
    const startedAt = Date.now()

    try {
      console.log('Starting 3DS game data refresh...')
      await refreshThreeDsGamesData()
      this.lastRefresh = new Date()
      const duration = Date.now() - startedAt

      const stats = await getThreeDsGamesStats()
      console.log(
        `3DS game data refresh finished in ${duration}ms (${stats.totalGames} titles cached)`,
      )

      return true
    } catch (error) {
      console.error('3DS game data refresh failed:', error)
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  async getStatus(): Promise<ThreeDsRefreshStatus> {
    const stats = await getThreeDsGamesStats().catch(() => ({ totalGames: 0 }))

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
}

const isTestEnvironment =
  process.env.NODE_ENV === 'test' ||
  process.env.CI === 'true' ||
  process.env.PWTEST_SKIP_WEBSERVER === '1' ||
  process.env.PLAYWRIGHT_TEST === 'true'

export const threeDsGameRefreshService = new ThreeDsGameRefreshService({
  refreshIntervalMs: ms.hours(24),
  autoRefreshEnabled: !isTestEnvironment,
  refreshOnStartup: !isTestEnvironment,
})
