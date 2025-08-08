import { AppError } from '@/lib/errors'
import {
  GetGameByIdSchema,
  GetGamesSchema,
  type GetGamesInput,
  SearchGamesSchema,
  FindSwitchTitleIdMobileSchema,
  GetBestSwitchTitleIdMobileSchema,
  GetSwitchGamesStatsMobileSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import {
  findTitleIdForGameName,
  getBestTitleIdMatch,
  getSwitchGamesStats,
} from '@/server/utils/switchGameSearch'
import { ApprovalStatus } from '@orm'
import type { PrismaClient } from '@orm'

// Shared function for getting games
async function getGamesQuery(
  ctx: {
    prisma: PrismaClient
    session?: { user?: { showNsfw?: boolean } } | null
  },
  input: GetGamesInput,
) {
  const search = input?.search
  const systemId = input?.systemId
  const page = input?.page ?? 1
  const limit = input?.limit ?? 20
  const skip = (page - 1) * limit

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

  // Filter NSFW content based on user preferences (default to hiding NSFW if no user session)
  const showNsfw = ctx.session?.user?.showNsfw ?? false
  if (!showNsfw) whereClause.isErotic = false

  const [games, total] = await Promise.all([
    ctx.prisma.game.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        systemId: true,
        imageUrl: true,
        boxartUrl: true,
        bannerUrl: true,
        tgdbGameId: true,
        isErotic: true,
        status: true,
        createdAt: true,
        system: { select: { id: true, name: true, key: true } },
        _count: {
          select: {
            listings: { where: { status: ApprovalStatus.APPROVED } },
          },
        },
      },
      orderBy: [{ listings: { _count: 'desc' } }, { createdAt: 'desc' }, { title: 'asc' }],
      skip,
      take: limit,
    }),
    ctx.prisma.game.count({ where: whereClause }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    games,
    pagination: {
      total,
      pages: totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export const mobileGamesRouter = createMobileTRPCRouter({
  /**
   * Get games with search and filtering
   */
  get: mobilePublicProcedure
    .input(GetGamesSchema)
    .query(async ({ ctx, input }) => getGamesQuery(ctx, input)),

  /**
   * Get popular games
   */
  getPopularGames: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.game.findMany({
      where: { status: ApprovalStatus.APPROVED },
      select: {
        id: true,
        title: true,
        systemId: true,
        imageUrl: true,
        boxartUrl: true,
        bannerUrl: true,
        tgdbGameId: true,
        isErotic: true,
        status: true,
        createdAt: true,
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
  searchGames: mobilePublicProcedure.input(SearchGamesSchema).query(async ({ ctx, input }) => {
    return await ctx.prisma.game.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        title: { contains: input.query, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        systemId: true,
        imageUrl: true,
        boxartUrl: true,
        bannerUrl: true,
        tgdbGameId: true,
        isErotic: true,
        status: true,
        createdAt: true,
        system: { select: { id: true, name: true, key: true } },
        _count: {
          select: {
            listings: { where: { status: ApprovalStatus.APPROVED } },
          },
        },
      },
      orderBy: [{ listings: { _count: 'desc' } }, { createdAt: 'desc' }, { title: 'asc' }],
      take: 20,
    })
  }),

  /**
   * Get game by ID
   */
  getGameById: mobilePublicProcedure.input(GetGameByIdSchema).query(async ({ ctx, input }) => {
    return await ctx.prisma.game.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        title: true,
        systemId: true,
        imageUrl: true,
        boxartUrl: true,
        bannerUrl: true,
        tgdbGameId: true,
        isErotic: true,
        status: true,
        createdAt: true,
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
