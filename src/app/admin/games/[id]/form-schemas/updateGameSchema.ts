import { z } from 'zod'

const imageUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal(''))

const updateGameSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  systemId: z.string().uuid('Please select a system'),
  imageUrl: imageUrlSchema,
  boxartUrl: imageUrlSchema,
  bannerUrl: imageUrlSchema,
  isErotic: z.boolean().optional(),
})

export default updateGameSchema
