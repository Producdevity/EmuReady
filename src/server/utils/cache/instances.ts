import { LRUCache } from 'lru-cache'
import { CACHE_DURATIONS } from '@/data/constants'
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
import type { NotificationType } from '@orm/client'

export const gameStatsCache = new LRUCache<
  string,
  {
    pending: number
    approved: number
    rejected: number
    total: number
  }
>({
  ttl: CACHE_DURATIONS.MEDIUM,
  max: 100,
})

export const listingStatsCache = new LRUCache<
  string,
  {
    pending: number
    approved: number
    rejected: number
    total: number
  }
>({
  ttl: CACHE_DURATIONS.MEDIUM,
  max: 100,
})

export const notificationAnalyticsCache = new LRUCache<
  string,
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
  ttl: CACHE_DURATIONS.LONG,
  max: 200,
})

export const tgdbGamesCache = new LRUCache<string, TGDBGamesByNameResponse>({
  ttl: CACHE_DURATIONS.LONG,
  max: 200,
})

export const tgdbImagesCache = new LRUCache<string, TGDBGamesImagesResponse>({
  ttl: CACHE_DURATIONS.LONG,
  max: 200,
})

export const tgdbPlatformsCache = new LRUCache<string, TGDBPlatformsResponse>({
  ttl: CACHE_DURATIONS.LONG,
  max: 10,
})

export const tgdbImageUrlsCache = new LRUCache<
  string,
  {
    boxartUrl?: string
    bannerUrl?: string
  }
>({
  ttl: CACHE_DURATIONS.LONG,
  max: 500,
})

export const tgdbGameImagesCache = new LRUCache<string, Record<string, GameImageOption[]>>({
  ttl: CACHE_DURATIONS.LONG,
  max: 100,
})

export const driverVersionsCache = new LRUCache<string, DriverVersionsResponse>({
  ttl: CACHE_DURATIONS.EXTRA_LONG,
  max: 1,
})

export const steamBatchQueryCache = new LRUCache<string, BatchBySteamAppIdsResponse>({
  ttl: CACHE_DURATIONS.LONG,
  max: 100,
})

export const catalogCompatibilityCache = new LRUCache<string, DeviceCompatibilityResponse>({
  ttl: CACHE_DURATIONS.LONG,
  max: 500,
})

export function invalidateCatalogCompatibilityCacheForDevice(deviceId: string): number {
  const prefix = `device:${deviceId}:`
  let deleted = 0

  for (const key of catalogCompatibilityCache.keys()) {
    if (!key.startsWith(prefix)) continue
    if (catalogCompatibilityCache.delete(key)) deleted++
  }

  return deleted
}

export function invalidateCatalogCompatibilityCacheForDevices(deviceIds: Iterable<string>): number {
  let deleted = 0

  for (const deviceId of new Set(deviceIds)) {
    deleted += invalidateCatalogCompatibilityCacheForDevice(deviceId)
  }

  return deleted
}
