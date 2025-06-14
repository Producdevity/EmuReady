import { z } from 'zod'
import { CustomFieldType } from '@orm'

const customFieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

export const CreateCustomFieldDefinitionSchema = z.object({
  emulatorId: z.string().uuid(),
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, {
      message: 'Name must be lowercase alphanumeric with underscores only.',
    }),
  label: z.string().min(1),
  type: z.nativeEnum(CustomFieldType),
  options: z.array(customFieldOptionSchema).optional(),
  defaultValue: z
    .union([z.string(), z.boolean(), z.number(), z.null()])
    .optional(),
  placeholder: z.string().optional(),
  // Range-specific fields
  rangeMin: z.number().optional(),
  rangeMax: z.number().optional(),
  rangeUnit: z.string().optional(),
  rangeDecimals: z.number().int().min(0).max(5).optional(),
  isRequired: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
})

export const GetCustomFieldDefinitionsByEmulatorSchema = z.object({
  emulatorId: z.string().uuid(),
})

export const GetCustomFieldDefinitionByIdSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateCustomFieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, {
      message: 'Name must be lowercase alphanumeric with underscores only.',
    })
    .optional(),
  label: z.string().min(1).optional(),
  type: z.nativeEnum(CustomFieldType).optional(),
  options: z.array(customFieldOptionSchema).optional(),
  defaultValue: z
    .union([z.string(), z.boolean(), z.number(), z.null()])
    .optional(),
  placeholder: z.string().optional(),
  // Range-specific fields
  rangeMin: z.number().optional(),
  rangeMax: z.number().optional(),
  rangeUnit: z.string().optional(),
  rangeDecimals: z.number().int().min(0).max(5).optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
})

export const DeleteCustomFieldDefinitionSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateCustomFieldDefinitionOrderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    displayOrder: z.number().int(),
  }),
)
