import { AppError } from '@/lib/errors'
import { SearchGameImagesSchema, SearchGamesSchema, GetGameImagesSchema } from '@/schemas/rawg'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { searchGameImages, searchGames, getGameImages, RawgError } from '@/server/rawg'
import type { GameImageOption } from '@/types/rawg'

export const mobileRawgRouter = createMobileTRPCRouter({
  /**
   * Search for game images in RAWG database
   */
  searchGameImages: mobilePublicProcedure.input(SearchGameImagesSchema).query(async ({ input }) => {
    const { query, includeScreenshots } = input

    try {
      const rawgImagesMap = await searchGameImages(query)

      // If includeScreenshots is false, filter out screenshots
      if (!includeScreenshots) {
        const filteredEntries = Array.from(rawgImagesMap.entries())
          .map(([gameId, images]) => {
            const coverImages = images.filter((img) => img.type === 'background')
            return coverImages.length > 0 ? ([gameId.toString(), coverImages] as const) : null
          })
          .filter((entry): entry is [string, GameImageOption[]] => entry !== null)

        return Object.fromEntries(filteredEntries)
      }

      // Convert Map to a plain object for JSON serialization using functional approach
      return Object.fromEntries(
        Array.from(rawgImagesMap.entries()).map(([gameId, images]) => [gameId.toString(), images]),
      )
    } catch (error) {
      throw error instanceof RawgError
        ? AppError.internalError(`RAWG API error: ${error.message}`)
        : AppError.internalError('Failed to search game images')
    }
  }),

  /**
   * Search for games in RAWG database
   */
  searchGames: mobilePublicProcedure.input(SearchGamesSchema).query(async ({ input }) => {
    try {
      return await searchGames(input.query, input.page)
    } catch (error) {
      throw error instanceof RawgError
        ? AppError.internalError(`RAWG API error: ${error.message}`)
        : AppError.internalError('Failed to search games')
    }
  }),

  /**
   * Get game images by ID
   */
  getGameImages: mobilePublicProcedure.input(GetGameImagesSchema).query(async ({ input }) => {
    try {
      return await getGameImages(input.gameId, input.gameName)
    } catch (error) {
      throw error instanceof RawgError
        ? AppError.internalError(`RAWG API error: ${error.message}`)
        : AppError.internalError('Failed to get game images')
    }
  }),
})
