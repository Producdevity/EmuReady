/**
 * Cache instances for different parts of the application
 * Each cache is typed for its specific use case
 */

import MemoryCache from './MemoryCache'
import type {
  TGDBGamesByNameResponse,
  TGDBGamesImagesResponse,
  TGDBPlatformsResponse,
  GameImageOption,
} from '@/types/tgdb'

// Game statistics cache
export const gameStatsCache = new MemoryCache<{
  pending: number
  approved: number
  rejected: number
  total: number
}>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Small cache for stats
})

// TGDB-specific caches with proper typing
export const tgdbGamesCache = new MemoryCache<TGDBGamesByNameResponse>({
  ttl: 10 * 60 * 1000, // 10 minutes for TGDB responses
  maxSize: 200,
})

export const tgdbImagesCache = new MemoryCache<TGDBGamesImagesResponse>({
  ttl: 10 * 60 * 1000, // 10 minutes for TGDB responses
  maxSize: 200,
})

export const tgdbPlatformsCache = new MemoryCache<TGDBPlatformsResponse>({
  ttl: 60 * 60 * 1000, // 1 hour for platforms (rarely change)
  maxSize: 10,
})

export const tgdbImageUrlsCache = new MemoryCache<{
  boxartUrl?: string
  bannerUrl?: string
}>({
  ttl: 10 * 60 * 1000, // 10 minutes for image URLs
  maxSize: 500,
})

export const tgdbGameImagesCache = new MemoryCache<
  Record<string, GameImageOption[]>
>({
  ttl: 10 * 60 * 1000, // 10 minutes for game images
  maxSize: 100,
})

// Generic cache for backwards compatibility during transition periods
export const legacyCache = new MemoryCache<unknown>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
})
