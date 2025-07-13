import { AppError } from '@/lib/errors'
import {
  GetGameByIdSchema,
  GetGamesSchema,
  SearchGamesSchema,
  FindSwitchTitleIdMobileSchema,
  GetBestSwitchTitleIdMobileSchema,
  GetSwitchGamesStatsMobileSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import {
  findTitleIdForGameName,
  getBestTitleIdMatch,
  getSwitchGamesStats,
} from '@/server/utils/switchGameSearch'
import { ApprovalStatus } from '@orm'

export const mobileGamesRouter = createMobileTRPCRouter({
  /**
   * Get games with search and filtering
   */
  getGames: mobilePublicProcedure
    .input(GetGamesSchema)
    .query(async ({ ctx, input }) => {
      const { search, systemId, limit = 20 } = input || {}

      const whereClause: Record<string, unknown> = {
        status: ApprovalStatus.APPROVED,
      }

      if (systemId) {
        whereClause.systemId = systemId
      }

      if (search) {
        whereClause.title = {
          contains: search,
          mode: 'insensitive',
        }
      }

      return await ctx.prisma.game.findMany({
        where: whereClause,
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { title: 'asc' }],
        take: limit,
      })
    }),

  /**
   * Get popular games
   */
  getPopularGames: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.game.findMany({
      where: { status: ApprovalStatus.APPROVED },
      include: {
        system: { select: { id: true, name: true, key: true } },
        _count: {
          select: { listings: { where: { status: ApprovalStatus.APPROVED } } },
        },
      },
      orderBy: { listings: { _count: 'desc' } },
      take: 20,
    })
  }),

  /**
   * Search games
   */
  searchGames: mobilePublicProcedure
    .input(SearchGamesSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.game.findMany({
        where: {
          status: ApprovalStatus.APPROVED,
          title: {
            contains: input.query,
            mode: 'insensitive',
          },
        },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { title: 'asc' }],
        take: 20,
      })
    }),

  /**
   * Get game by ID
   */
  getGameById: mobilePublicProcedure
    .input(GetGameByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.game.findUnique({
        where: { id: input.id },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
      })
    }),

  /**
   * Find Nintendo Switch title IDs by game name (fuzzy search)
   */
  findSwitchTitleId: mobilePublicProcedure
    .input(FindSwitchTitleIdMobileSchema)
    .query(async ({ input }) => {
      const { gameName, maxResults } = input

      try {
        const results = await findTitleIdForGameName(gameName, maxResults)
        return {
          success: true,
          results,
          query: gameName,
          totalResults: results.length,
        }
      } catch (error) {
        console.error('Error finding Switch title ID:', error)
        return AppError.internalError('Failed to search for Switch title ID')
      }
    }),

  /**
   * Get the best matching Nintendo Switch title ID for a game name
   */
  getBestSwitchTitleId: mobilePublicProcedure
    .input(GetBestSwitchTitleIdMobileSchema)
    .query(async ({ input }) => {
      const { gameName } = input

      try {
        const titleId = await getBestTitleIdMatch(gameName)
        return {
          success: true,
          titleId,
          query: gameName,
          found: titleId !== null,
        }
      } catch (error) {
        console.error('Error getting Switch title ID match:', error)
        return AppError.internalError('Failed to find Switch title ID match')
      }
    }),

  /**
   * Get Nintendo Switch games cache statistics
   */
  getSwitchGamesStats: mobilePublicProcedure
    .input(GetSwitchGamesStatsMobileSchema)
    .query(async () => {
      try {
        const stats = await getSwitchGamesStats()
        return {
          success: true,
          ...stats,
        }
      } catch (error) {
        console.error('Error getting Switch games stats:', error)
        return AppError.internalError('Failed to get Switch games statistics')
      }
    }),
})
