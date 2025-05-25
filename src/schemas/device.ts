import { z } from 'zod'

export const GetDevicesSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    limit: z.number().default(50),
  })
  .optional()

export const GetDeviceByIdSchema = z.object({
  id: z.string().uuid(),
})

export const CreateDeviceSchema = z.object({
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
})

export const UpdateDeviceSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
})

export const DeleteDeviceSchema = z.object({
  id: z.string().uuid(),
})
