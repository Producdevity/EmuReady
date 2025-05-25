import { z } from 'zod'

export const GetEmulatorsSchema = z
  .object({
    search: z.string().optional(),
  })
  .optional()

export const GetEmulatorByIdSchema = z.object({
  id: z.string().uuid(),
})

export const CreateEmulatorSchema = z.object({
  name: z.string().min(1),
})

export const UpdateEmulatorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
})

export const DeleteEmulatorSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateSupportedSystemsSchema = z.object({
  emulatorId: z.string().uuid(),
  systemIds: z.array(z.string().uuid()),
})
