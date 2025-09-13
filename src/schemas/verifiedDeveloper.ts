import { z } from 'zod'

export const GetVerifiedDevelopersSchema = z
  .object({
    emulatorId: z.string().uuid().nullable().optional(),
    userId: z.string().uuid().nullable().optional(),
    limit: z.number().min(1).max(100).default(50),
    page: z.number().min(1).default(1),
    search: z.string().nullable().optional(),
    emulatorFilter: z.string().nullable().optional(),
  })
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
