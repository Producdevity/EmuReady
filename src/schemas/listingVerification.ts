import { z } from 'zod'
import { PAGINATION } from '@/data/constants'

export const VerifyListingSchema = z.object({
  listingId: z.string().uuid(),
  notes: z.string().optional(),
})

export const RemoveVerificationSchema = z.object({
  verificationId: z.string().uuid(),
})

export const GetListingVerificationsSchema = z.object({
  listingId: z.string().uuid(),
})

export const GetMyVerificationsSchema = z
  .object({
    limit: z.number().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
    page: z.number().min(1).default(1),
  })
  .optional()
