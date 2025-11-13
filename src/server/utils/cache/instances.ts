/**
 * Cache instances for different parts of the application
 * Each cache is typed for its specific use case
 */

import { TIME_CONSTANTS } from '@/utils/time'
import MemoryCache from './MemoryCache'
import type { DeviceCompatibilityResponse } from '@/schemas/mobile'
import type { BatchBySteamAppIdsResponse } from '@/server/api/routers/mobile/games'
import type {
  NotificationMetrics,
  ChannelMetrics,
  TypeMetrics,
  UserEngagementMetrics,
  TimeSeriesData,
} from '@/server/notifications/analyticsService'
import type { DriverVersionsResponse } from '@/types/driver-versions'
import type {
  TGDBGamesByNameResponse,
  TGDBGamesImagesResponse,
  TGDBPlatformsResponse,
  GameImageOption,
} from '@/types/tgdb'
import type { NotificationType } from '@orm'

// Game statistics cache
export const gameStatsCache = new MemoryCache<{
  pending: number
  approved: number
  rejected: number
  total: number
}>({
  ttl: TIME_CONSTANTS.FIVE_MINUTES,
  maxSize: 100, // Small cache for stats
})

// Listing statistics cache
export const listingStatsCache = new MemoryCache<{
  pending: number
  approved: number
  rejected: number
  total: number
}>({
  ttl: TIME_CONSTANTS.FIVE_MINUTES,
  maxSize: 100, // Small cache for stats
})

// Notification analytics cache - for expensive analytics queries
export const notificationAnalyticsCache = new MemoryCache<
  | NotificationMetrics
  | ChannelMetrics
  | TypeMetrics
  | UserEngagementMetrics[]
  | TimeSeriesData[]
  | {
      type: NotificationType
      totalSent: number
      openRate: number
      clickRate: number
    }[]
>({
  ttl: TIME_CONSTANTS.TEN_MINUTES, // analytics can be slightly stale
  maxSize: 200, // Analytics queries with different date ranges and params
})

// TGDB-specific caches with proper typing
export const tgdbGamesCache = new MemoryCache<TGDBGamesByNameResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  maxSize: 200,
})

export const tgdbImagesCache = new MemoryCache<TGDBGamesImagesResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  maxSize: 200,
})

export const tgdbPlatformsCache = new MemoryCache<TGDBPlatformsResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES, // rarely change
  maxSize: 10,
})

export const tgdbImageUrlsCache = new MemoryCache<{
  boxartUrl?: string
  bannerUrl?: string
}>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  maxSize: 500,
})

export const tgdbGameImagesCache = new MemoryCache<Record<string, GameImageOption[]>>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  maxSize: 100,
})

// Driver version cache to avoid hitting GitHub rate limits
export const driverVersionsCache = new MemoryCache<DriverVersionsResponse>({
  ttl: TIME_CONSTANTS.THIRTY_MINUTES,
  maxSize: 1,
})

// Batch Steam App ID lookup cache - for GameHub Lite integration
export const steamBatchQueryCache = new MemoryCache<BatchBySteamAppIdsResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES, // listings data changes frequently
  maxSize: 100, // Cache up to 100 different batch queries
})

// Catalog compatibility cache - for RetroCatalog integration
export const catalogCompatibilityCache = new MemoryCache<DeviceCompatibilityResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES, // balance freshness with server load
  maxSize: 500, // cache popular device queries
})
