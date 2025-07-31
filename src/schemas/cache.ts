import { z } from 'zod'

export const GetCacheEntrySchema = z.object({
  key: z.string(),
})

export const DeleteCacheEntrySchema = z.object({
  key: z.string(),
})
