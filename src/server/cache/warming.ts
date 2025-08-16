import { warmCache } from '@/lib/cache/seo-cache'
import { prisma } from '@/server/db'
import {
  getGameForSEO,
  getListingForSEO,
  getPcListingForSEO,
  getApprovedGamesForSitemap,
  getApprovedListingsForSitemap,
  getApprovedPcListingsForSitemap,
} from '@/server/db/seo-queries'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { ms } from '@/utils/time'
import { ApprovalStatus } from '@orm'

/**
 * Cache warming strategies for popular content
 * Runs periodically to pre-populate cache with frequently accessed data
 */

interface WarmingResult {
  warmedItems: number
  duration: number
  errors: string[]
}

export async function warmPopularGames(limit = 50): Promise<WarmingResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let warmedItems = 0

  try {
    // Get most popular games (those with most listings)
    const popularGames = await prisma.game.findMany({
      where: { status: ApprovalStatus.APPROVED },
      select: {
        id: true,
        _count: { select: { listings: true, pcListings: true } },
      },
      orderBy: [{ listings: { _count: 'desc' } }],
      take: limit,
    })

    // Warm cache for popular games
    const gameWarmingTasks = popularGames.map((game) => ({
      key: `seo:game:${game.id}`,
      fetchFn: () => getGameForSEO(game.id),
    }))

    await warmCache(gameWarmingTasks, {
      ttl: ms.hours(1),
      staleWhileRevalidate: ms.days(1),
    })

    warmedItems += gameWarmingTasks.length
  } catch (error) {
    errors.push(`Failed to warm popular games: ${error}`)
  }

  return {
    warmedItems,
    duration: Date.now() - startTime,
    errors,
  }
}

export async function warmRecentListings(limit = 100): Promise<WarmingResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let warmedItems = 0

  try {
    const repository = new ListingsRepository(prisma)

    // Get recent approved listings using repository
    const recentListingsResult = await repository.getRecentListings(limit)
    const recentListings = recentListingsResult.listings.map((listing) => ({ id: listing.id }))

    // Get recent approved PC listings
    const recentPcListings = await prisma.pcListing.findMany({
      where: { status: ApprovalStatus.APPROVED },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Warm cache for listings separately
    const listingTasks = recentListings.map((listing) => ({
      key: `seo:listing:${listing.id}`,
      fetchFn: () => getListingForSEO(listing.id),
    }))

    const pcListingTasks = recentPcListings.map((listing) => ({
      key: `seo:pclisting:${listing.id}`,
      fetchFn: () => getPcListingForSEO(listing.id),
    }))

    await warmCache(listingTasks, {
      ttl: ms.minutes(30),
      staleWhileRevalidate: ms.hours(12),
    })

    await warmCache(pcListingTasks, {
      ttl: ms.minutes(30),
      staleWhileRevalidate: ms.hours(12),
    })

    warmedItems += listingTasks.length + pcListingTasks.length
  } catch (error) {
    errors.push(`Failed to warm recent listings: ${error}`)
  }

  return {
    warmedItems,
    duration: Date.now() - startTime,
    errors,
  }
}

export async function warmSitemapData(): Promise<WarmingResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let warmedItems = 0

  try {
    // Warm sitemap data
    const sitemapTasks = [
      {
        key: 'seo:sitemap:games:1000',
        fetchFn: () => getApprovedGamesForSitemap(1000),
      },
      {
        key: 'seo:sitemap:listings:500',
        fetchFn: () => getApprovedListingsForSitemap(500),
      },
      {
        key: 'seo:sitemap:pclistings:500',
        fetchFn: () => getApprovedPcListingsForSitemap(500),
      },
    ]

    await warmCache(sitemapTasks, {
      ttl: ms.hours(6),
      staleWhileRevalidate: ms.days(2),
    })

    warmedItems += sitemapTasks.length
  } catch (error) {
    errors.push(`Failed to warm sitemap data: ${error}`)
  }

  return {
    warmedItems,
    duration: Date.now() - startTime,
    errors,
  }
}

export async function warmAllCaches(): Promise<WarmingResult> {
  console.log('[Cache Warming] Starting comprehensive cache warming...')

  const results = await Promise.all([
    warmPopularGames(50),
    warmRecentListings(100),
    warmSitemapData(),
  ])

  const totalWarmed = results.reduce((sum, r) => sum + r.warmedItems, 0)
  const totalDuration = Math.max(...results.map((r) => r.duration))
  const allErrors = results.flatMap((r) => r.errors)

  console.info(`[Cache Warming] Completed: ${totalWarmed} items warmed in ${totalDuration}ms`)

  if (allErrors.length > 0) {
    console.error('[Cache Warming] Errors encountered:', allErrors)
  }

  return {
    warmedItems: totalWarmed,
    duration: totalDuration,
    errors: allErrors,
  }
}

/**
 * Schedule cache warming
 * This should be called from a cron job or similar scheduler
 */
export function scheduleCacheWarming() {
  // Initial warming on startup
  setTimeout(() => {
    warmAllCaches().catch(console.error)
  }, ms.seconds(5))

  // Warm popular content every hour
  setInterval(() => {
    warmPopularGames(30).catch(console.error)
  }, ms.hours(1))

  // Warm recent listings every 30 minutes
  setInterval(() => {
    warmRecentListings(50).catch(console.error)
  }, ms.minutes(30))

  // Warm sitemap data every 6 hours
  setInterval(() => {
    warmSitemapData().catch(console.error)
  }, ms.hours(6))
}
