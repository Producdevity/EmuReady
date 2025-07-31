import { cache, getCacheMetrics } from '@/lib/cache/seo-cache'
import { AppError } from '@/lib/errors'
import { seoMetrics, exportMetrics } from '@/lib/monitoring/seo-metrics'
import { GetCacheEntrySchema, DeleteCacheEntrySchema } from '@/schemas/cache'
import { createTRPCRouter, superAdminProcedure } from '@/server/api/trpc'
import { ApprovalStatus } from '@orm'

export const cacheRouter = createTRPCRouter({
  /**
   * Get cache metrics and statistics
   */
  getMetrics: superAdminProcedure.query(async () => {
    const cacheMetrics = getCacheMetrics()
    const seoData = seoMetrics.getAggregatedMetrics()
    const exportData = exportMetrics()

    return {
      cache: cacheMetrics,
      seo: seoData,
      export: exportData,
      timestamp: new Date().toISOString(),
    }
  }),

  /**
   * Clear all cache entries
   */
  clear: superAdminProcedure.mutation(async () => {
    try {
      // Clear the cache (clear method doesn't take arguments)
      // Use cache.clear() method from LRUCache
      cache.clear()
      seoMetrics.reset()

      return {
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      }
    } catch {
      AppError.internalError('Failed to clear cache')
    }
  }),

  /**
   * Warm the cache with critical data
   */
  warm: superAdminProcedure.mutation(async ({ ctx }) => {
    try {
      // Warm critical paths
      const warmedPaths = []

      // Fetch popular games for cache warming
      const popularGames = await ctx.prisma.game.findMany({
        take: 10,
        orderBy: { listings: { _count: 'desc' } },
        select: { id: true, title: true },
      })

      // Warm game metadata
      for (const game of popularGames) {
        const cacheKey = `seo:game:${game.id}`
        const cacheData = {
          title: game.title,
          description: `${game.title} compatibility information`,
        }
        cache.set(cacheKey, {
          data: cacheData,
          timestamp: Date.now(),
          ttl: 3600 * 1000, // Convert to milliseconds
          staleWhileRevalidate: 7200 * 1000,
        })
        warmedPaths.push(cacheKey)
      }

      // Fetch popular listings
      const popularListings = await ctx.prisma.listing.findMany({
        take: 10,
        where: { status: ApprovalStatus.APPROVED },
        orderBy: { votes: { _count: 'desc' } },
        include: {
          game: { select: { title: true } },
          device: { include: { brand: true } },
          emulator: true,
        },
      })

      // Warm listing metadata
      for (const listing of popularListings) {
        const cacheKey = `seo:listing:${listing.id}`
        const cacheData = {
          title: `${listing.game.title} on ${listing.device.brand.name} ${listing.device.modelName}`,
          description: `${listing.game.title} running on ${listing.emulator.name}`,
        }
        cache.set(cacheKey, {
          data: cacheData,
          timestamp: Date.now(),
          ttl: 3600 * 1000, // Convert to milliseconds
          staleWhileRevalidate: 7200 * 1000,
        })
        warmedPaths.push(cacheKey)
      }

      return {
        success: true,
        message: `Cache warmed with ${warmedPaths.length} entries`,
        warmedPaths,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Cache warming error:', error)
      AppError.internalError('Failed to warm cache')
    }
  }),

  /**
   * Get specific cache entry
   */
  get: superAdminProcedure
    .input(GetCacheEntrySchema)
    .query(async ({ input }) => {
      const value = cache.get(input.key)
      return {
        key: input.key,
        value,
        exists: value !== undefined,
        timestamp: new Date().toISOString(),
      }
    }),

  /**
   * Delete specific cache entry
   */
  delete: superAdminProcedure
    .input(DeleteCacheEntrySchema)
    .mutation(async ({ input }) => {
      const existed = cache.has(input.key)
      cache.delete(input.key)

      return {
        success: true,
        existed,
        message: existed ? 'Cache entry deleted' : 'Entry did not exist',
        timestamp: new Date().toISOString(),
      }
    }),
})
