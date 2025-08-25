import {
  SearchGameImagesSchema,
  SearchGamesSchema,
  GetGameImagesSchema,
  GetGameImageUrlsSchema,
} from '@/schemas/tgdb'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import * as tgdb from '@/server/tgdb'
import { type GameImageOption } from '@/types/tgdb'

export const mobileTgdbRouter = createMobileTRPCRouter({
  /**
   * Search for game images in TGDB database
   */
  searchGameImages: mobilePublicProcedure.input(SearchGameImagesSchema).query(async ({ input }) => {
    const result = await tgdb.searchGameImages(input.query, input.systemKey)

    // Convert Map to a plain object for serialization
    const serializedResult: Record<string, GameImageOption[]> = {}
    result.forEach((images, gameId) => {
      serializedResult[gameId.toString()] = images
    })

    return serializedResult
  }),

  /**
   * Search for games in TGDB database
   */
  searchGames: mobilePublicProcedure.input(SearchGamesSchema).query(async ({ input }) => {
    // Just return the search results with boxart included - no additional API calls
    return tgdb.searchGames(input.query, input.systemKey, input.page)
  }),

  /**
   * Get game image URLs for a specific game
   */
  getGameImageUrls: mobilePublicProcedure
    .input(GetGameImageUrlsSchema)
    .query(async ({ input }) => tgdb.getGameImageUrls(input.gameId)),

  /**
   * Get game images by game IDs
   */
  getGameImages: mobilePublicProcedure
    .input(GetGameImagesSchema)
    .query(async (opts) => tgdb.getGameImages(opts.input.gameIds)),

  /**
   * Get available platforms from TGDB
   */
  getPlatforms: mobilePublicProcedure.query(async () => tgdb.getPlatforms()),
})
