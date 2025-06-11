import { z } from 'zod'

export const SearchGameImagesSchema = z.object({
  query: z.string().min(2),
  includeScreenshots: z.boolean().optional().default(false),
})

export const SearchGamesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(20).default(10),
})

export const GetGameImagesSchema = z.object({
  gameId: z.number().positive(),
  gameName: z.string(),
})
