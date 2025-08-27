import { AppError } from '@/lib/errors'
import {
  GetGameByIdSchema,
  GetGamesSchema,
  SearchGamesSchema,
  FindSwitchTitleIdMobileSchema,
  GetBestSwitchTitleIdMobileSchema,
  GetSwitchGamesStatsMobileSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { GamesRepository } from '@/server/repositories/games.repository'
import {
  findTitleIdForGameName,
  getBestTitleIdMatch,
  getSwitchGamesStats,
} from '@/server/utils/switchGameSearch'

export const mobileGamesRouter = createMobileTRPCRouter({
  /**
   * Get games with search and filtering
   */
  get: mobilePublicProcedure.input(GetGamesSchema).query(async ({ ctx, input }) => {
    const repository = new GamesRepository(ctx.prisma)
    return repository.listMobile({
      ...input,
      showNsfw: ctx.session?.user?.showNsfw ?? false,
    })
  }),

  /**
   * Get popular games
   */
  getPopularGames: mobilePublicProcedure.query(async ({ ctx }) => {
    const repository = new GamesRepository(ctx.prisma)
    return repository.listPopularMobile(ctx.session?.user?.showNsfw ?? false)
  }),

  /**
   * Search games
   */
  searchGames: mobilePublicProcedure.input(SearchGamesSchema).query(async ({ ctx, input }) => {
    const repository = new GamesRepository(ctx.prisma)
    return repository.listSearchMobile(input.query, ctx.session?.user?.showNsfw ?? false)
  }),

  /**
   * Get game by ID
   */
  byId: mobilePublicProcedure.input(GetGameByIdSchema).query(async ({ ctx, input }) => {
    const repository = new GamesRepository(ctx.prisma)
    return repository.byIdMobile(input.id)
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
