import {
  SearchGameImagesSchema,
  SearchGamesSchema,
  GetGameImagesSchema,
  GetGameImageUrlsSchema,
} from '@/schemas/tgdb'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import * as tgdb from '@/server/tgdb'
import { type GameImageOption } from '@/types/tgdb'

export const tgdbRouter = createTRPCRouter({
  searchGameImages: publicProcedure.input(SearchGameImagesSchema).query(async ({ input }) => {
    const result = await tgdb.searchGameImages(input.query, input.tgdbPlatformId)

    // Convert Map to a plain object for serialization
    const serializedResult: Record<string, GameImageOption[]> = {}
    result.forEach((images, gameId) => {
      serializedResult[gameId.toString()] = images
    })

    return serializedResult
  }),

  searchGames: publicProcedure.input(SearchGamesSchema).query(async ({ input }) => {
    // Just return the search results with boxart included - no additional API calls
    return tgdb.searchGames(input.query, input.tgdbPlatformId, input.page)
  }),

  // New endpoint for getting banner images when a game is selected
  getGameImageUrls: publicProcedure
    .input(GetGameImageUrlsSchema)
    .query(async ({ input }) => tgdb.getGameImageUrls(input.gameId)),

  getGameImages: publicProcedure
    .input(GetGameImagesSchema)
    .query(async (opts) => tgdb.getGameImages(opts.input.gameIds)),

  getPlatforms: publicProcedure.query(async () => {
    return tgdb.getPlatforms()
  }),
})
