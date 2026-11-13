import { z } from 'zod'
import { PAGINATION } from '@/data/constants'
import { refinePaginationOffset } from '@/schemas/pagination'

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
    limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
    page: z.number().int().safe().min(1).default(1),
  })
  .superRefine(refinePaginationOffset)
  .optional()
