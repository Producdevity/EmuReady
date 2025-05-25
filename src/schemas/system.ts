import { z } from 'zod'

export const GetSystemsSchema = z
  .object({ search: z.string().optional() })
  .optional()

export const GetSystemByIdSchema = z.object({ id: z.string().uuid() })

export const CreateSystemSchema = z.object({ name: z.string().min(1) })

export const UpdateSystemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
})

export const DeleteSystemSchema = z.object({ id: z.string().uuid() })
