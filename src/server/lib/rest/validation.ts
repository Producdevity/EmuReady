import { z } from 'zod'

/**
 * Common query parameter schemas
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const SearchSchema = z.object({
  search: z.string().optional(),
})

/**
 * Listings query parameters
 */
export const GetListingsQuerySchema = PaginationSchema.merge(
  SearchSchema,
).extend({
  gameId: z.string().uuid().optional(),
  systemId: z.string().uuid().optional(),
  emulatorId: z.string().uuid().optional(),
  emulatorIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      if (typeof val === 'string') return val.split(',')
      return val
    }),
  deviceId: z.string().uuid().optional(),
  deviceIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      if (typeof val === 'string') return val.split(',')
      return val
    }),
  socId: z.string().uuid().optional(),
  socIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      if (typeof val === 'string') return val.split(',')
      return val
    }),
  performanceId: z.coerce.number().optional(),
})

/**
 * Listings request body schemas
 */
export const CreateListingBodySchema = z.object({
  gameId: z.string().uuid(),
  deviceId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: z.coerce.number(),
  notes: z.string().optional(),
  customFieldValues: z.record(z.string(), z.unknown()).optional(),
})

export const UpdateListingBodySchema = z.object({
  performanceId: z.coerce.number().optional(),
  notes: z.string().optional(),
  customFieldValues: z.record(z.string(), z.unknown()).optional(),
})

export const VoteListingBodySchema = z.object({
  value: z.boolean(),
})

/**
 * Comments schemas
 */
export const GetCommentsQuerySchema = PaginationSchema.extend({
  listingId: z.string().uuid(),
})

export const CreateCommentBodySchema = z.object({
  content: z.string().min(1).max(1000),
})

export const UpdateCommentBodySchema = z.object({
  content: z.string().min(1).max(1000),
})

/**
 * Parse and validate query parameters
 */
export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): T {
  const params: Record<string, string | string[]> = {}

  searchParams.forEach((value, key) => {
    // Handle array parameters (e.g., emulatorIds=1,2,3 or emulatorIds[]=1&emulatorIds[]=2)
    if (key.endsWith('[]')) {
      const normalizedKey = key.slice(0, -2)
      if (!params[normalizedKey]) {
        params[normalizedKey] = []
      }
      ;(params[normalizedKey] as string[]).push(value)
    } else if (params[key]) {
      // Convert to array if multiple values
      if (Array.isArray(params[key])) {
        ;(params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  })

  return schema.parse(params)
}

/**
 * Parse and validate request body
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const body = await request.json()
  return schema.parse(body)
}
