import { z } from 'zod'

export const TITLE_ID_PLATFORM_IDS = ['nintendo_switch', 'nintendo_3ds', 'steam'] as const

export const TitleIdPlatformIdSchema = z.enum(TITLE_ID_PLATFORM_IDS)

export const TitleIdSearchInputSchema = z.object({
  platformId: TitleIdPlatformIdSchema,
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
  maxResults: z.number().min(1).max(20).default(5),
})

export const TitleIdStatsInputSchema = z.object({
  platformId: TitleIdPlatformIdSchema,
})

export const TitleIdSearchResultSchema = z.object({
  titleId: z.string(),
  name: z.string(),
  normalizedTitle: z.string(),
  score: z.number().min(0).max(100),
  region: z.string().optional(),
  productCode: z.string().nullable().optional(),
  providerId: TitleIdPlatformIdSchema,
  raw: z.unknown().optional(),
})

export const TitleIdSearchResponseSchema = z.object({
  results: z.array(TitleIdSearchResultSchema),
  bestMatch: TitleIdSearchResultSchema.nullable(),
})

export const TitleIdStatsSchema = z.object({
  totalGames: z.number().nonnegative(),
  cacheStatus: z.enum(['hit', 'miss', 'empty']),
  lastUpdated: z.date().optional(),
})

export const TitleIdProviderSchema = z.object({
  id: TitleIdPlatformIdSchema,
  label: z.string(),
  description: z.string(),
  supportsStats: z.boolean(),
})

export type TitleIdPlatformId = z.infer<typeof TitleIdPlatformIdSchema>
export type TitleIdSearchInput = z.input<typeof TitleIdSearchInputSchema>
export type TitleIdStatsInput = z.input<typeof TitleIdStatsInputSchema>
export type TitleIdSearchResult = z.infer<typeof TitleIdSearchResultSchema>
export type TitleIdSearchResponse = z.infer<typeof TitleIdSearchResponseSchema>
export type TitleIdStats = z.infer<typeof TitleIdStatsSchema>
export type TitleIdProviderInfo = z.infer<typeof TitleIdProviderSchema>
