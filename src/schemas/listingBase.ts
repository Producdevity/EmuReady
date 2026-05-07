import { z } from 'zod'
import { JsonValueSchema } from '@/schemas/common'
import { ApprovalStatus } from '@orm'

const CustomFieldValueEntrySchema = z.object({
  customFieldDefinitionId: z.string().uuid(),
  value: JsonValueSchema,
})

export const BaseCreateListingFields = {
  gameId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  platformId: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  customFieldValues: z.array(CustomFieldValueEntrySchema).nullable().optional(),
  recaptchaToken: z.string().nullable().optional(),
} as const

export const BaseGetListingsFields = {
  systemIds: z.array(z.string().uuid()).nullable().optional(),
  emulatorIds: z.array(z.string().uuid()).nullable().optional(),
  performanceIds: z.array(z.number()).nullable().optional(),
  platformIds: z.array(z.string().uuid()).nullable().optional(),
  searchTerm: z.string().nullable().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus).nullable().optional(),
  myListings: z.boolean().nullable().optional(),
} as const

export const BaseUpdateListingUserFields = {
  id: z.string().uuid(),
  performanceId: z.number(),
  platformId: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  customFieldValues: z.array(CustomFieldValueEntrySchema).nullable().optional(),
} as const

export const BaseUpdateListingAdminFields = {
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  performanceId: z.number(),
  platformId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.nativeEnum(ApprovalStatus),
  customFieldValues: z.array(CustomFieldValueEntrySchema).nullable().optional(),
} as const
