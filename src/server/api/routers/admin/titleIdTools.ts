import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { BatchBySteamAppIdsResponseSchema, BatchBySteamAppIdsSchema } from '@/schemas/mobile'
import {
  TitleIdSearchInputSchema,
  TitleIdStatsInputSchema,
  TitleIdSearchResponseSchema,
  TitleIdStatsSchema,
} from '@/schemas/titleId'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { lookupGamesBySteamAppIds } from '@/server/services/steam-batch-lookup.service'
import {
  getBestTitleIdResult,
  getTitleIdProvider,
  getTitleIdProviders,
  getTitleIdStats,
  searchTitleIds,
} from '@/server/utils/titleIdProviders'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm/client'

const titleIdAccessProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.session.user

  return roleIncludesRole(user.role, Role.DEVELOPER)
    ? next({ ctx: { ...ctx, session: { ...ctx.session, user } } })
    : AppError.insufficientRole(Role.DEVELOPER)
})

export const titleIdToolsRouter = createTRPCRouter({
  providers: titleIdAccessProcedure.query(() => ({ providers: getTitleIdProviders() })),

  search: titleIdAccessProcedure
    .input(TitleIdSearchInputSchema)
    .output(TitleIdSearchResponseSchema)
    .mutation(async ({ input }) => {
      const provider = getTitleIdProvider(input.platformId)
      if (!provider) return AppError.badRequest('Unsupported title ID platform')

      try {
        const results = await searchTitleIds(input.platformId, input.gameName, input.maxResults)
        const bestMatch = await getBestTitleIdResult(input.platformId, input.gameName)

        return {
          results,
          bestMatch,
        }
      } catch (error) {
        const diagnosticError = new Error('Title ID search failed', { cause: error })
        logger.error('Title ID search failed', diagnosticError)
        return AppError.internalError('Failed to search for title IDs', diagnosticError)
      }
    }),

  stats: titleIdAccessProcedure
    .input(TitleIdStatsInputSchema)
    .output(TitleIdStatsSchema)
    .query(async ({ input }) => {
      const provider = getTitleIdProvider(input.platformId)
      if (!provider) return AppError.badRequest('Unsupported title ID platform')

      if (!provider.supportsStats || !provider.stats) {
        return AppError.badRequest('Statistics are not available for this platform')
      }

      try {
        return await getTitleIdStats(input.platformId)
      } catch (error) {
        console.error('Title ID stats fetch failed', error)
        return AppError.internalError(
          'Failed to fetch title ID statistics',
          new Error('Title ID statistics failed', { cause: error }),
        )
      }
    }),

  batchSteamAppIds: titleIdAccessProcedure
    .input(BatchBySteamAppIdsSchema)
    .output(BatchBySteamAppIdsResponseSchema)
    .query(async ({ ctx, input }) => {
      return lookupGamesBySteamAppIds(input, {
        prisma: ctx.prisma,
        showNsfw: ctx.session.user.showNsfw,
      })
    }),
})
