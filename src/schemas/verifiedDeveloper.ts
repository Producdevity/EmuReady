import { z } from 'zod'

export const GetVerifiedDevelopersSchema = z
  .object({
    emulatorId: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
    limit: z.number().min(1).max(100).default(50),
    page: z.number().min(1).default(1),
    search: z.string().nullable().optional(),
    emulatorFilter: z.string().nullable().optional(),
  })
  .optional()

export const VerifyDeveloperSchema = z.object({
  userId: z.string(),
  emulatorId: z.string(),
  notes: z.string().nullable().optional(),
})

export const UpdateVerifiedDeveloperSchema = z.object({
  id: z.string(),
  emulatorId: z.string(),
  notes: z.string().nullable().optional(),
})

export const RemoveVerifiedDeveloperSchema = z.object({
  id: z.string(),
})

export const IsVerifiedDeveloperSchema = z.object({
  userId: z.string(),
  emulatorId: z.string(),
})
