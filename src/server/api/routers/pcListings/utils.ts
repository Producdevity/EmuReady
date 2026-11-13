import { listingStatsCache } from '@/server/utils/cache'

export const PC_LISTING_STATS_CACHE_KEY = 'pc-listing-stats'

export function invalidatePcListingStatsCache(): void {
  listingStatsCache.delete(PC_LISTING_STATS_CACHE_KEY)
}
