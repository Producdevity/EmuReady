import { z } from 'zod'

export const CreateCustomFieldCategorySchema = z.object({
  emulatorId: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayOrder: z.number().int().optional().default(0),
})

export const GetCustomFieldCategoriesByEmulatorSchema = z.object({
  emulatorId: z.string().uuid(),
})

export const GetCustomFieldCategoryByIdSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateCustomFieldCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  displayOrder: z.number().int().optional(),
})

export const DeleteCustomFieldCategorySchema = z.object({
  id: z.string().uuid(),
})

export const UpdateCustomFieldCategoryOrderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    displayOrder: z.number().int(),
  }),
)
