import { z } from 'zod'

export const SearchGameImagesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  tgdbPlatformId: z.number().optional(),
})

export const SearchGamesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  tgdbPlatformId: z.number().optional(),
  page: z.number().min(1).default(1),
})

export const GetGameImagesSchema = z.object({
  gameIds: z.array(z.number()).min(1, 'At least one game ID is required'),
})

export const GetGameImageUrlsSchema = z.object({
  gameId: z.number().positive(),
})
