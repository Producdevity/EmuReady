import { z } from 'zod'
import { JsonValueSchema } from '@/schemas/common'
import { CustomFieldType } from '@orm'

const TemplateFieldOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: z.nativeEnum(CustomFieldType),
  options: JsonValueSchema,
  defaultValue: JsonValueSchema,
  placeholder: z.string().nullable(),
  rangeMin: z.number().nullable(),
  rangeMax: z.number().nullable(),
  rangeUnit: z.string().nullable(),
  rangeDecimals: z.number().nullable(),
  isRequired: z.boolean(),
  categoryName: z.string().nullable(),
  categoryOrder: z.number(),
  displayOrder: z.number(),
})
export const TemplateOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  fields: z.array(TemplateFieldOutputSchema),
})
export const ApplyTemplateOutputSchema = z.object({
  createdFields: z.number().int().nonnegative(),
  skippedFields: z.number().int().nonnegative(),
  templateNames: z.array(z.string()),
})
