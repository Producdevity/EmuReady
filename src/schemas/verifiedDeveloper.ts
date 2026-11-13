import { z } from 'zod'
import { refinePaginationOffset } from '@/schemas/pagination'

export const GetVerifiedDevelopersSchema = z
  .object({
    emulatorId: z.string().uuid().nullable().optional(),
    userId: z.string().uuid().nullable().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    page: z.number().int().safe().min(1).default(1),
    search: z.string().nullable().optional(),
    emulatorFilter: z.string().nullable().optional(),
  })
  .superRefine(refinePaginationOffset)
  .optional()

export const VerifyDeveloperSchema = z.object({
  userId: z.string().uuid(),
  emulatorId: z.string().uuid(),
  notes: z.string().nullable().optional(),
})

export const UpdateVerifiedDeveloperSchema = z.object({
  id: z.string().uuid(),
  emulatorId: z.string().uuid(),
  notes: z.string().nullable().optional(),
})

export const RemoveVerifiedDeveloperSchema = z.object({
  id: z.string().uuid(),
})

export const IsVerifiedDeveloperSchema = z.object({
  userId: z.string().uuid(),
  emulatorId: z.string().uuid(),
})
