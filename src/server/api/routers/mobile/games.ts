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
  BatchBySteamAppIdsSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { GamesRepository } from '@/server/repositories/games.repository'
import { steamBatchQueryCache } from '@/server/utils/cache'
import { matchSteamAppIdsToNames, validateSteamAppIds } from '@/server/utils/steamGameBatcher'
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

// Type definitions for batch Steam App ID responses
export type BatchGameResult = {
  steamAppId: string
  game: {
    id: string
    title: string
    systemId: string
    imageUrl: string | null
    boxartUrl: string | null
    bannerUrl: string | null
    tgdbGameId: number | null
    metadata: unknown
    isErotic: boolean
    status: string
    createdAt: Date
    system: {
      id: string
      name: string
      key: string | null
    }
    _count: {
      listings: number
    }
    listings: {
      id: string
      deviceId: string
      gameId: string
      emulatorId: string
      performanceId: number
      notes: string | null
      upvoteCount: number
      downvoteCount: number
      voteCount: number
      successRate: number | null
      device: {
        id: string
        modelName: string
        soc: {
          id: string
          name: string
          manufacturer: string | null
          architecture: string | null
          processNode: string | null
          cpuCores: number | null
          gpuModel: string | null
        } | null
      }
      emulator: {
        id: string
        name: string
        logo: string | null
      }
      performance: {
        id: number
        label: string
        rank: number
        description: string | null
      }
      customFieldValues: {
        id: string
        listingId: string
        customFieldDefinitionId: string
        value: unknown
        customFieldDefinition: {
          id: string
          type: string
          label: string
          name: string
        }
      }[]
    }[]
  } | null
  matchStrategy: 'metadata' | 'exact' | 'normalized' | 'not_found'
}

export type MinimalGameResult = {
  game_id: string | null
  steam_app_id: string
  title: string | null
  performance: {
    id: number
    label: string
    rank: number
    description: string | null
  } | null
  emulator: {
    id: string
    name: string
    logo: string | null
  } | null
  device: {
    id: string
    modelName: string
    soc: {
      id: string
      name: string
      manufacturer: string | null
      architecture: string | null
      processNode: string | null
      cpuCores: number | null
      gpuModel: string | null
    } | null
  } | null
  listing: {
    id: string
    notes: string | null
    upvoteCount: number
    downvoteCount: number
    voteCount: number
    successRate: number | null
  } | null
}

export type BatchBySteamAppIdsResponse = {
  success: true
  results: BatchGameResult[] | MinimalGameResult[]
  totalRequested: number
  totalFound: number
  totalNotFound: number
}

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

  /**
   * Batch lookup games by Steam App IDs
   * Optimized for large batches (up to 1000 Steam App IDs)
   * Returns games with their listings filtered by emulator if specified
   * Results cached for 5 minutes to optimize repeated queries
   */
  batchBySteamAppIds: mobilePublicProcedure
    .input(BatchBySteamAppIdsSchema)
    .query(async ({ ctx, input }) => {
      const {
        steamAppIds,
        emulatorName,
        maxListingsPerGame,
        showNsfw = false,
        minimal = true,
      } = input

      try {
        // Validate Steam App IDs
        const validation = validateSteamAppIds(steamAppIds)
        if (!validation.valid) {
          return AppError.badRequest(validation.errors.join(', '))
        }

        // Create cache key from sorted IDs and options
        const sortedIds = [...steamAppIds].sort().join(',')
        const cacheKey = `batch:${sortedIds}:${emulatorName ?? 'all'}:${maxListingsPerGame}:${showNsfw ?? false}:${minimal ?? false}`

        // Check cache first
        const cachedResult = steamBatchQueryCache.get(cacheKey)
        if (cachedResult) return cachedResult

        // Match Steam App IDs to game names
        const matchResults = await matchSteamAppIdsToNames(steamAppIds)

        // Create Map of Steam App ID → Game Name
        const steamAppIdToName = new Map<string, string>()
        for (const match of matchResults) {
          if (match.gameName) {
            steamAppIdToName.set(match.steamAppId, match.gameName)
          }
        }

        // Batch lookup games from database
        const repository = new GamesRepository(ctx.prisma)
        const results = await repository.batchBySteamAppIds(steamAppIdToName, {
          emulatorName,
          maxListingsPerGame,
          showNsfw: showNsfw ?? ctx.session?.user?.showNsfw ?? false,
        })

        // Transform to minimal format if requested
        const finalResults = minimal
          ? results.map((result) => {
              if (!result.game || result.game.listings.length === 0) {
                return {
                  game_id: result.game?.id ?? null,
                  steam_app_id: result.steamAppId,
                  title: result.game?.title ?? null,
                  performance: null,
                  emulator: null,
                  device: null,
                  listing: null,
                }
              }

              const firstListing = result.game.listings[0]
              return {
                game_id: result.game.id,
                steam_app_id: result.steamAppId,
                title: result.game.title,
                performance: firstListing?.performance ?? null,
                emulator: firstListing?.emulator ?? null,
                device: firstListing?.device ?? null,
                listing: {
                  id: firstListing?.id ?? null,
                  notes: firstListing?.notes ?? null,
                  upvoteCount: firstListing?.upvoteCount ?? 0,
                  downvoteCount: firstListing?.downvoteCount ?? 0,
                  voteCount: firstListing?.voteCount ?? 0,
                  successRate: firstListing?.successRate ?? null,
                },
              }
            })
          : results

        const response = {
          success: true as const,
          results: finalResults,
          totalRequested: steamAppIds.length,
          totalFound: results.filter((r) => r.game !== null).length,
          totalNotFound: results.filter((r) => r.game === null).length,
        }

        // Cache the result
        steamBatchQueryCache.set(cacheKey, response)

        return response
      } catch (error) {
        console.error('Error in batch Steam App ID lookup:', error)
        return AppError.internalError('Failed to lookup games by Steam App IDs')
      }
    }),
})
