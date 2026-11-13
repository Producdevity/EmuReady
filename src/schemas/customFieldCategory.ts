import { z } from 'zod'
import { SignedInt32Schema } from '@/schemas/common'

export const CreateCustomFieldCategorySchema = z.object({
  emulatorId: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayOrder: SignedInt32Schema.optional().default(0),
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
  displayOrder: SignedInt32Schema.optional(),
})

export const DeleteCustomFieldCategorySchema = z.object({
  id: z.string().uuid(),
})

export const UpdateCustomFieldCategoryOrderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    displayOrder: SignedInt32Schema,
  }),
)
