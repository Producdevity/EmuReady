import { cache, getCacheMetrics } from '@/lib/cache/seo-cache'
import { AppError } from '@/lib/errors'
import { seoMetrics, exportMetrics } from '@/lib/monitoring/seo-metrics'
import { GetCacheEntrySchema, DeleteCacheEntrySchema } from '@/schemas/cache'
import { createTRPCRouter, superAdminProcedure } from '@/server/api/trpc'
import {
  createQueryCacheKey,
  QueryPerformanceMonitor,
  suggestIndexes,
  analyzeQueryComplexity,
} from '@/server/utils/query-performance'
import { gameTitleSelect } from '@/server/utils/selects'
import { ApprovalStatus } from '@orm'

export const cacheRouter = createTRPCRouter({
  /**
   * Get cache metrics and statistics
   */
  getMetrics: superAdminProcedure.query(async () => {
    const cacheMetrics = getCacheMetrics()
    const seoData = seoMetrics.getAggregatedMetrics()
    const exportData = exportMetrics()
    const queryMetrics = QueryPerformanceMonitor.getMetrics()

    return {
      cache: cacheMetrics,
      seo: seoData,
      export: exportData,
      query: queryMetrics,
      timestamp: new Date().toISOString(),
    }
  }),

  /**
   * Clear all cache entries
   */
  clear: superAdminProcedure.mutation(async () => {
    try {
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
        select: gameTitleSelect,
      })

      // Warm game metadata
      for (const game of popularGames) {
        const cacheKey = createQueryCacheKey('seo', 'game', { id: game.id })
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
          game: { select: gameTitleSelect },
          device: { include: { brand: true } },
          emulator: true,
        },
      })

      // Warm listing metadata
      for (const listing of popularListings) {
        const cacheKey = createQueryCacheKey('seo', 'listing', {
          id: listing.id,
        })
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
  get: superAdminProcedure.input(GetCacheEntrySchema).query(async ({ input }) => {
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
  delete: superAdminProcedure.input(DeleteCacheEntrySchema).mutation(async ({ input }) => {
    const existed = cache.has(input.key)
    cache.delete(input.key)

    return {
      success: true,
      existed,
      message: existed ? 'Cache entry deleted' : 'Entry did not exist',
      timestamp: new Date().toISOString(),
    }
  }),

  /**
   * Analyze query patterns and suggest database indexes
   */
  analyzeQueries: superAdminProcedure.query(async () => {
    // Common query patterns in the application
    const queryPatterns = [
      {
        name: 'Listings by status and author',
        model: 'listing',
        where: { status: ApprovalStatus.APPROVED, authorId: 'user_id' },
        orderBy: { createdAt: 'desc' },
      },
      {
        name: 'Listings by game and device',
        model: 'listing',
        where: { gameId: 'game_id', deviceId: 'device_id' },
        orderBy: { createdAt: 'desc' },
      },
      {
        name: 'Games by system with approval',
        model: 'game',
        where: { systemId: 'system_id', status: ApprovalStatus.APPROVED },
        orderBy: { title: 'asc' },
      },
      {
        name: 'PC Listings by CPU and GPU',
        model: 'pcListing',
        where: {
          cpuId: 'cpu_id',
          gpuId: 'gpu_id',
          status: ApprovalStatus.APPROVED,
        },
        orderBy: { createdAt: 'desc' },
      },
      {
        name: 'Users with listings count',
        model: 'user',
        where: { listings: { some: { status: ApprovalStatus.APPROVED } } },
      },
      {
        name: 'Reports by status',
        model: 'listingReport',
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      },
    ]

    const suggestions = queryPatterns.map((pattern) => ({
      pattern: pattern.name,
      model: pattern.model,
      complexity: analyzeQueryComplexity(
        pattern.model === 'user' ? { listings: true } : undefined,
        pattern.where,
      ),
      indexSuggestions: suggestIndexes(pattern.model, pattern.where, pattern.orderBy),
    }))

    // Get actual query performance metrics
    const performanceMetrics = QueryPerformanceMonitor.getMetrics()

    return {
      suggestions,
      performanceMetrics,
      timestamp: new Date().toISOString(),
    }
  }),
})
