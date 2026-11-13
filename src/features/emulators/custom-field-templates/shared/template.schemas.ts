import { z } from 'zod'
import { CustomFieldType } from '@orm'
import {
  CustomFieldAttributesSchema,
  CustomFieldOptionSchema,
  validateCustomFieldAttributes,
} from '../../shared/custom-field-attributes.schemas'

const templateOptionSchema = CustomFieldOptionSchema.extend({
  value: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(100),
})
const orderSchema = z.number().int().min(0).max(2_147_483_647)

export const TemplateFieldSchema = CustomFieldAttributesSchema.extend({
  name: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Name must be lowercase alphanumeric with underscores only.'),
  label: z.string().trim().min(1).max(100),
  options: z.array(templateOptionSchema).max(50).default([]),
  placeholder: z.string().max(200).nullable().default(null),
  rangeUnit: z.string().max(10).nullable().default(null),
  categoryName: z.string().trim().min(1).max(100).nullable().default(null),
  categoryOrder: orderSchema.default(0),
  displayOrder: orderSchema.default(0),
})
  .strict()
  .transform((field) => {
    if (typeof field.defaultValue !== 'string') return field
    if (field.type === CustomFieldType.SELECT)
      return { ...field, defaultValue: field.defaultValue.trim() }
    if (field.type !== CustomFieldType.RANGE) return field
    const value = field.defaultValue.trim() ? Number(field.defaultValue) : NaN
    return Number.isFinite(value) ? { ...field, defaultValue: value } : field
  })
  .superRefine(validateCustomFieldAttributes)

const fieldsSchema = z
  .array(TemplateFieldSchema)
  .min(1)
  .max(50)
  .superRefine((fields, ctx) => {
    const names = new Set<string>()
    fields.forEach((field, index) => {
      if (names.has(field.name))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'name'],
          message: 'Field names must be unique within a template.',
        })
      names.add(field.name)
    })
  })
export const TEMPLATE_NAME_MAX_LENGTH = 100
const templateNameSchema = z.string().trim().min(1).max(TEMPLATE_NAME_MAX_LENGTH)
const descriptionSchema = z.string().trim().max(500).nullable()

export const CreateCustomFieldTemplateSchema = z
  .object({
    name: templateNameSchema,
    description: descriptionSchema.optional(),
    fields: fieldsSchema,
  })
  .strict()

export const UpdateCustomFieldTemplateSchema = z
  .object({
    id: z.string().uuid(),
    name: templateNameSchema.optional(),
    description: descriptionSchema.optional(),
    fields: fieldsSchema.optional(),
  })
  .strict()

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
    .max(10, 'Maximum 10 templates can be applied at once')
    .refine((ids) => new Set(ids).size === ids.length, 'Select each template only once.'),
})
