import { z } from 'zod'

export const SearchGamesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  platformId: z.number().nullable().optional(),
  limit: z.number().min(1).max(50).default(20),
  includeAllCategories: z.boolean().optional().default(false),
})

export const GetGameByIdSchema = z.object({
  gameId: z.number(),
})

export const GetGameImagesSchema = z.object({
  gameId: z.number(),
})

export const SearchPlatformsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.number().optional(),
})
