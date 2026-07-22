import { TRPCError } from '@trpc/server'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { GamesRepository } from '@/server/repositories/games.repository'
import { steamBatchQueryCache } from '@/server/utils/cache'
import { matchSteamAppIdsToNames, validateSteamAppIds } from '@/server/utils/steamGameBatcher'
import type { BatchBySteamAppIdsResponse } from '@/schemas/mobile'
import type { PrismaClient } from '@orm/client'

interface LookupGamesBySteamAppIdsInput {
  steamAppIds: string[]
  emulatorName?: string
  maxListingsPerGame: number
  showNsfw?: boolean
  minimal?: boolean
}

interface LookupGamesBySteamAppIdsContext {
  prisma: PrismaClient
  showNsfw?: boolean
}

export async function lookupGamesBySteamAppIds(
  input: LookupGamesBySteamAppIdsInput,
  ctx: LookupGamesBySteamAppIdsContext,
): Promise<BatchBySteamAppIdsResponse> {
  const validation = validateSteamAppIds(input.steamAppIds)
  if (!validation.valid) AppError.badRequest(validation.errors.join(', '))

  try {
    const showNsfw = input.showNsfw ?? ctx.showNsfw ?? false
    const minimal = input.minimal ?? false
    const requestedIds = input.steamAppIds.join(',')
    const cacheKey = `batch:${requestedIds}:${input.emulatorName ?? 'all'}:${input.maxListingsPerGame}:${showNsfw}:${minimal}`

    const cachedResult = steamBatchQueryCache.get(cacheKey)
    if (cachedResult) return cachedResult

    const matchResults = await matchSteamAppIdsToNames(input.steamAppIds)
    const steamAppIdToName = new Map<string, string>()
    for (const match of matchResults) {
      if (match.gameName) steamAppIdToName.set(match.steamAppId, match.gameName)
    }

    const repositoryResults =
      steamAppIdToName.size > 0
        ? await new GamesRepository(ctx.prisma).batchBySteamAppIds(steamAppIdToName, {
            emulatorName: input.emulatorName,
            maxListingsPerGame: input.maxListingsPerGame,
            showNsfw,
          })
        : []

    const resultsBySteamAppId = new Map(
      repositoryResults.map((result) => [result.steamAppId, result]),
    )
    const orderedResults = input.steamAppIds.map((steamAppId) => {
      const result = resultsBySteamAppId.get(steamAppId)
      if (result) return result

      return {
        steamAppId,
        game: null,
        matchStrategy: 'not_found' as const,
      }
    })

    const finalResults = minimal
      ? orderedResults.map((result) => {
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
      : orderedResults

    const response = {
      success: true as const,
      results: finalResults,
      totalRequested: input.steamAppIds.length,
      totalFound: orderedResults.filter((result) => result.game !== null).length,
      totalNotFound: orderedResults.filter((result) => result.game === null).length,
    }

    steamBatchQueryCache.set(cacheKey, response)
    return response
  } catch (error) {
    if (error instanceof TRPCError) throw error

    logger.error('Error in batch Steam App ID lookup', error)
    return AppError.internalError('Failed to lookup games by Steam App IDs')
  }
}
