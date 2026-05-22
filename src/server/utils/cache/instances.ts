import { LRUCache } from 'lru-cache'
import { TIME_CONSTANTS } from '@/utils/time'
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
  ttl: TIME_CONSTANTS.FIVE_MINUTES,
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
  ttl: TIME_CONSTANTS.FIVE_MINUTES,
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
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  max: 200,
})

export const tgdbGamesCache = new LRUCache<string, TGDBGamesByNameResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  max: 200,
})

export const tgdbImagesCache = new LRUCache<string, TGDBGamesImagesResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  max: 200,
})

export const tgdbPlatformsCache = new LRUCache<string, TGDBPlatformsResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  max: 10,
})

export const tgdbImageUrlsCache = new LRUCache<
  string,
  {
    boxartUrl?: string
    bannerUrl?: string
  }
>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  max: 500,
})

export const tgdbGameImagesCache = new LRUCache<string, Record<string, GameImageOption[]>>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  max: 100,
})

export const driverVersionsCache = new LRUCache<string, DriverVersionsResponse>({
  ttl: TIME_CONSTANTS.THIRTY_MINUTES,
  max: 1,
})

export const steamBatchQueryCache = new LRUCache<string, BatchBySteamAppIdsResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
  max: 100,
})

export const catalogCompatibilityCache = new LRUCache<string, DeviceCompatibilityResponse>({
  ttl: TIME_CONSTANTS.TEN_MINUTES,
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
