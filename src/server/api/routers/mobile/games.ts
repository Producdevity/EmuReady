import { AppError } from '@/lib/errors'
import {
  GetGameByIdSchema,
  GetGamesSchema,
  SearchGamesSchema,
  FindSwitchTitleIdMobileSchema,
  GetBestSwitchTitleIdMobileSchema,
  GetSwitchGamesStatsMobileSchema,
  FindThreeDsTitleIdMobileSchema,
  GetBestThreeDsTitleIdMobileSchema,
  GetThreeDsGamesStatsMobileSchema,
  FindSteamAppIdMobileSchema,
  GetBestSteamAppIdMobileSchema,
  GetSteamGamesStatsMobileSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { GamesRepository } from '@/server/repositories/games.repository'
import {
  findSteamAppIdForGameName,
  getBestSteamAppIdMatch,
  getSteamGamesStats,
} from '@/server/utils/steamGameSearch'
import {
  findTitleIdForGameName,
  getBestTitleIdMatch,
  getSwitchGamesStats,
} from '@/server/utils/switchGameSearch'
import {
  findThreeDsTitleIdForGameName,
  getBestThreeDsTitleIdMatch,
  getThreeDsGamesStats,
} from '@/server/utils/threeDsGameSearch'

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

  /**
   * Find Nintendo 3DS title IDs by game name (fuzzy search)
   */
  findThreeDsTitleId: mobilePublicProcedure
    .input(FindThreeDsTitleIdMobileSchema)
    .query(async ({ input }) => {
      const { gameName, maxResults } = input

      try {
        const results = await findThreeDsTitleIdForGameName(gameName, maxResults)
        return {
          success: true,
          results,
          query: gameName,
          totalResults: results.length,
        }
      } catch (error) {
        console.error('Error finding 3DS title ID:', error)
        return AppError.internalError('Failed to search for 3DS title ID')
      }
    }),

  /**
   * Get the best matching Nintendo 3DS title ID for a game name
   */
  getBestThreeDsTitleId: mobilePublicProcedure
    .input(GetBestThreeDsTitleIdMobileSchema)
    .query(async ({ input }) => {
      const { gameName } = input

      try {
        const titleId = await getBestThreeDsTitleIdMatch(gameName)
        return {
          success: true,
          titleId,
          query: gameName,
          found: titleId !== null,
        }
      } catch (error) {
        console.error('Error getting 3DS title ID match:', error)
        return AppError.internalError('Failed to find 3DS title ID match')
      }
    }),

  /**
   * Get Nintendo 3DS games cache statistics
   */
  getThreeDsGamesStats: mobilePublicProcedure
    .input(GetThreeDsGamesStatsMobileSchema)
    .query(async () => {
      try {
        const stats = await getThreeDsGamesStats()
        return {
          success: true,
          ...stats,
        }
      } catch (error) {
        console.error('Error getting 3DS games stats:', error)
        return AppError.internalError('Failed to get 3DS games statistics')
      }
    }),

  /**
   * Find Steam App IDs by game name (fuzzy search)
   */
  findSteamAppId: mobilePublicProcedure
    .input(FindSteamAppIdMobileSchema)
    .query(async ({ input }) => {
      const { gameName, maxResults } = input

      try {
        const results = await findSteamAppIdForGameName(gameName, maxResults)
        return {
          success: true,
          results,
          query: gameName,
          totalResults: results.length,
        }
      } catch (error) {
        console.error('Error finding Steam App ID:', error)
        return AppError.internalError('Failed to search for Steam App ID')
      }
    }),

  /**
   * Get the best matching Steam App ID for a game name
   */
  getBestSteamAppId: mobilePublicProcedure
    .input(GetBestSteamAppIdMobileSchema)
    .query(async ({ input }) => {
      const { gameName } = input

      try {
        const appId = await getBestSteamAppIdMatch(gameName)
        return {
          success: true,
          appId,
          query: gameName,
          found: appId !== null,
        }
      } catch (error) {
        console.error('Error getting Steam App ID match:', error)
        return AppError.internalError('Failed to find Steam App ID match')
      }
    }),

  /**
   * Get Steam games cache statistics
   */
  getSteamGamesStats: mobilePublicProcedure
    .input(GetSteamGamesStatsMobileSchema)
    .query(async () => {
      try {
        const stats = await getSteamGamesStats()
        return {
          success: true,
          ...stats,
        }
      } catch (error) {
        console.error('Error getting Steam games stats:', error)
        return AppError.internalError('Failed to get Steam games statistics')
      }
    }),
})
