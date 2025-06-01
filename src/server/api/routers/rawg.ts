import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { searchGameImages, searchGames, getGameImages, RawgError } from '@/server/rawg'
import { AppError } from '@/lib/errors'
import type { GameImageOption } from '@/types/rawg'
import { SearchGameImagesSchema, SearchGamesSchema, GetGameImagesSchema } from '@/schemas/rawg'

export const rawgRouter = createTRPCRouter({
  searchGameImages: publicProcedure
    .input(SearchGameImagesSchema)
    .query(async ({ input }) => {
      try {
        const imageMap = await searchGameImages(input.query)
        
        // Convert Map to a plain object for JSON serialization
        const result: Record<string, GameImageOption[]> = {}
        for (const [gameId, images] of imageMap.entries()) {
          result[gameId.toString()] = images
        }
        
        return result
      } catch (error) {
        if (error instanceof RawgError) {
          AppError.internalError(`RAWG API error: ${error.message}`)
        }
        
        AppError.internalError('Failed to search game images')
      }
    }),

  searchGames: publicProcedure
    .input(SearchGamesSchema)
    .query(async ({ input }) => {
      try {
        return await searchGames(input.query, input.page, input.pageSize)
      } catch (error) {
        if (error instanceof RawgError) {
          AppError.internalError(`RAWG API error: ${error.message}`)
        }
        
        AppError.internalError('Failed to search games')
      }
    }),

  getGameImages: publicProcedure
    .input(GetGameImagesSchema)
    .query(async ({ input }) => {
      try {
        return await getGameImages(input.gameId, input.gameName)
      } catch (error) {
        if (error instanceof RawgError) {
          AppError.internalError(`RAWG API error: ${error.message}`)
        }
        
        AppError.internalError('Failed to get game images')
      }
    }),
}) 