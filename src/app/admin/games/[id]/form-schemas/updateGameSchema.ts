import { z } from 'zod'

const imageUrlSchema = z
  .string()
  .transform((val) => val.trim()) // Trim whitespace
  .refine(
    (val) =>
      val === '' || val.startsWith('http://') || val.startsWith('https://'),
    {
      message: 'Must be a valid URL starting with http:// or https://',
    },
  )
  .transform((val) => val || undefined) // Convert empty string to undefined
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
