import { z } from 'zod'

export const VerifyListingSchema = z.object({
  listingId: z.string(),
  notes: z.string().optional(),
})

export const RemoveVerificationSchema = z.object({
  verificationId: z.string(),
})

export const GetListingVerificationsSchema = z.object({
  listingId: z.string(),
})

export const GetMyVerificationsSchema = z
  .object({
    limit: z.number().min(1).max(100).default(20),
    page: z.number().min(1).default(1),
  })
  .optional()
