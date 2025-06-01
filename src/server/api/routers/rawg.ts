import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import {
  searchGameImages,
  searchGames,
  getGameImages,
  RawgError,
} from '@/server/rawg'
import { AppError } from '@/lib/errors'
import { z } from 'zod'
import { SearchGamesSchema, GetGameImagesSchema } from '@/schemas/rawg'
import type { GameImageOption } from '@/types/rawg'

export const rawgRouter = createTRPCRouter({
  searchGameImages: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        includeScreenshots: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { query, includeScreenshots } = input

      try {
        const rawgImagesMap = await searchGameImages(query)

        // If includeScreenshots is false, filter out screenshots
        if (!includeScreenshots) {
          const filteredMap = new Map<number, GameImageOption[]>()

          for (const [gameId, images] of rawgImagesMap.entries()) {
            const coverImages = images.filter(
              (img) => img.type === 'background',
            )

            if (coverImages.length > 0) {
              filteredMap.set(gameId, coverImages)
            }
          }

          // Convert Map to a plain object for JSON serialization
          const result: Record<string, GameImageOption[]> = {}
          for (const [gameId, images] of filteredMap.entries()) {
            result[gameId.toString()] = images
          }

          return result
        }

        // Convert Map to a plain object for JSON serialization
        const result: Record<string, GameImageOption[]> = {}
        for (const [gameId, images] of rawgImagesMap.entries()) {
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
