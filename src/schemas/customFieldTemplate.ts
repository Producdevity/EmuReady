import { z } from 'zod'
import { CustomFieldType } from '@orm'

const customFieldOptionSchema = z.object({
  value: z
    .string()
    .min(1, 'Option value is required')
    .max(50, 'Option value must be 50 characters or less')
    .trim(),
  label: z
    .string()
    .min(1, 'Option label is required')
    .max(100, 'Option label must be 100 characters or less')
    .trim(),
})

const customFieldTemplateFieldSchema = z.object({
  name: z
    .string()
    .min(1, 'Field name is required')
    .max(50, 'Field name must be 50 characters or less')
    .regex(/^[a-z0-9_]+$/, {
      message: 'Name must be lowercase alphanumeric with underscores only.',
    })
    .transform((val) => val.trim().toLowerCase()),
  label: z
    .string()
    .min(1, 'Field label is required')
    .max(100, 'Field label must be 100 characters or less')
    .transform((val) => val.trim()),
  type: z.nativeEnum(CustomFieldType),
  options: z.array(customFieldOptionSchema).max(50, 'Maximum 50 options allowed').optional(),
  defaultValue: z.union([z.string(), z.boolean(), z.null()]).optional(),
  isRequired: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
})

export const CreateCustomFieldTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be 100 characters or less')
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform((val) => val.trim())
    .optional(),
  fields: z
    .array(customFieldTemplateFieldSchema)
    .min(1, 'At least one field is required')
    .max(50, 'Maximum 50 fields allowed per template'),
})

export const UpdateCustomFieldTemplateSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be 100 characters or less')
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform((val) => val.trim())
    .optional(),
  fields: z
    .array(customFieldTemplateFieldSchema)
    .min(1, 'At least one field is required')
    .max(50, 'Maximum 50 fields allowed per template')
    .optional(),
})

export const GetCustomFieldTemplateByIdSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
})

export const DeleteCustomFieldTemplateSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
})

export const ApplyCustomFieldTemplateSchema = z.object({
  emulatorId: z.string().uuid('Invalid emulator ID'),
  templateIds: z
    .array(z.string().uuid('Invalid template ID'))
    .min(1, 'At least one template must be selected')
    .max(10, 'Maximum 10 templates can be applied at once'),
})
