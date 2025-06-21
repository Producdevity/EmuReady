import { z } from 'zod'

export const GetVerifiedDevelopersSchema = z
  .object({
    emulatorId: z.string().optional(),
    userId: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    page: z.number().min(1).default(1),
  })
  .optional()

export const VerifyDeveloperSchema = z.object({
  userId: z.string(),
  emulatorId: z.string(),
  notes: z.string().optional(),
})

export const RemoveVerifiedDeveloperSchema = z.object({
  id: z.string(),
})

export const IsVerifiedDeveloperSchema = z.object({
  userId: z.string(),
  emulatorId: z.string(),
})
