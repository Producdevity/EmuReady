import { z } from 'zod'
import { getGameImageUrlValidationError } from '@/utils/imageUrls'

const imageUrlSchema = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => !getGameImageUrlValidationError(val), {
    message: 'Must be a valid HTTPS image URL',
  })
  .transform((val) => val || null)
  .optional()

const updateGameSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  systemId: z.string().uuid('Please select a system'),
  imageUrl: imageUrlSchema,
  boxartUrl: imageUrlSchema,
  bannerUrl: imageUrlSchema,
  isErotic: z.boolean().optional(),
})

export default updateGameSchema
