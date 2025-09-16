import { AppError } from '@/lib/errors'
import {
  SearchGamesSchema,
  GetGameByIdSchema,
  GetGameImagesSchema,
  SearchPlatformsSchema,
} from '@/schemas/igdb'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import * as igdb from '@/server/igdb'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

export const igdbRouter = createTRPCRouter({
  searchGames: publicProcedure.input(SearchGamesSchema).query(async ({ input }) => {
    const result = await igdb.searchGames(
      input.query,
      input.platformId,
      input.limit,
      input.includeAllCategories,
    )

    // Helper function to ensure URL has protocol
    const ensureAbsoluteUrl = (url: string): string => {
      return url && url.startsWith('//') ? `https:${url}` : url
    }

    // Map the results to include our processed image URLs and NSFW detection
    const processedGames = result.games.map((game) => {
      const images = igdb.extractGameImages(game)
      const isErotic = igdb.isAdultContent(game)

      // Fix protocol-relative URLs in artworks and screenshots
      const artworks = game.artworks?.map((artwork) => ({
        ...artwork,
        url: ensureAbsoluteUrl(artwork.url),
      }))

      const screenshots = game.screenshots?.map((screenshot) => ({
        ...screenshot,
        url: ensureAbsoluteUrl(screenshot.url),
      }))

      const cover = game.cover
        ? { ...game.cover, url: ensureAbsoluteUrl(game.cover.url) }
        : undefined

      return {
        id: game.id,
        name: game.name,
        summary: game.summary,
        storyline: game.storyline,
        releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : null,
        platforms: game.platforms,
        genres: game.genres,
        themes: game.themes,
        cover,
        artworks,
        screenshots,
        imageUrl: images.imageUrl,
        boxartUrl: images.boxartUrl,
        bannerUrl: images.bannerUrl,
        isErotic,
      }
    })

    return {
      games: processedGames,
      count: result.count,
    }
  }),

  getGameById: publicProcedure.input(GetGameByIdSchema).query(async ({ input }) => {
    const game = await igdb.getGameById(input.gameId)

    if (!game) return null

    const images = igdb.extractGameImages(game)
    const isErotic = igdb.isAdultContent(game)

    return {
      id: game.id,
      name: game.name,
      summary: game.summary,
      storyline: game.storyline,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : null,
      platforms: game.platforms,
      genres: game.genres,
      themes: game.themes,
      cover: game.cover,
      artworks: game.artworks,
      screenshots: game.screenshots,
      imageUrl: images.imageUrl,
      boxartUrl: images.boxartUrl,
      bannerUrl: images.bannerUrl,
      isErotic,
    }
  }),

  // For moderator image selector
  getGameImages: protectedProcedure.input(GetGameImagesSchema).query(async ({ ctx, input }) => {
    // Check if user is a moderator
    if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      return AppError.insufficientRole(Role.MODERATOR)
    }

    const images = await igdb.getGameImages(input.gameId)

    // Format for the image selector component
    return images.map((img) => ({
      url: img.url,
      type: img.type,
      width: img.width,
      height: img.height,
      label: `${img.type.charAt(0).toUpperCase() + img.type.slice(1)}${img.width && img.height ? ` (${img.width}x${img.height})` : ''}`,
    }))
  }),

  // Search for platforms (useful for admin platform mapping)
  searchPlatforms: protectedProcedure.input(SearchPlatformsSchema).query(async ({ ctx, input }) => {
    // Check if user is an admin
    if (!hasRolePermission(ctx.session.user.role, Role.ADMIN)) {
      return AppError.insufficientRole(Role.ADMIN)
    }

    const platforms = await igdb.searchPlatforms(input.query, input.category)

    return platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
      abbreviation: platform.abbreviation,
      category: platform.category,
    }))
  }),
})
