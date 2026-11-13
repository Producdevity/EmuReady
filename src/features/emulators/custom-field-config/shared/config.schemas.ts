import { z } from 'zod'
import { CreateCustomFieldDefinitionSchema } from '@/schemas/customFieldDefinition'
import {
  CustomFieldAttributesSchema,
  validateCustomFieldAttributes,
} from '../../shared/custom-field-attributes.schemas'

const orderSchema = z.number().int().min(0).max(2_147_483_647)
const categoryNameSchema = z.string().trim().min(1).max(100)

export const ConfigFieldSchema = CreateCustomFieldDefinitionSchema.omit({
  emulatorId: true,
  categoryId: true,
})
  .merge(CustomFieldAttributesSchema)
  .extend({
    id: z.string().uuid().optional(),
    name: CreateCustomFieldDefinitionSchema.shape.name.max(100),
    label: z.string().trim().min(1).max(200),
    category: categoryNameSchema.nullable().default(null),
    displayOrder: orderSchema.default(0),
    categoryOrder: orderSchema.default(0),
  })
  .strict()
  .superRefine(validateCustomFieldAttributes)

export const CustomFieldConfigSchema = z
  .object({
    version: z.literal(1),
    categories: z
      .array(
        z
          .object({
            id: z.string().uuid().optional(),
            name: categoryNameSchema,
            displayOrder: orderSchema.default(0),
          })
          .strict(),
      )
      .max(100),
    fields: z.array(ConfigFieldSchema).max(500),
  })
  .strict()
  .superRefine((config, ctx) => {
    for (const key of ['categories', 'fields'] as const) {
      const seen = new Set<string>()
      const ids = new Set<string>()
      config[key].forEach((item, index) => {
        if (seen.has(item.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key, index, 'name'],
            message: 'Names must be unique.',
          })
        }
        if (item.id && ids.has(item.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key, index, 'id'],
            message: 'IDs must be unique.',
          })
        }
        if (item.id) ids.add(item.id)
        seen.add(item.name)
      })
    }
    const categories = new Set(config.categories.map((category) => category.name))
    config.fields.forEach((field, index) => {
      if (field.category !== null && !categories.has(field.category)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fields', index, 'category'],
          message: 'Category must be included in categories.',
        })
      }
    })
  })

export const GetCustomFieldConfigSchema = z.object({ emulatorId: z.string().uuid() }).strict()

export const CustomFieldConfigSnapshotSchema = z.object({
  configuration: CustomFieldConfigSchema,
  revision: z.string().regex(/^[a-f0-9]{64}$/),
})

export const SaveCustomFieldConfigSchema = GetCustomFieldConfigSchema.extend({
  configuration: CustomFieldConfigSchema,
  expectedRevision: CustomFieldConfigSnapshotSchema.shape.revision,
}).strict()

export type CustomFieldConfig = z.output<typeof CustomFieldConfigSchema>
export type ConfigField = z.output<typeof ConfigFieldSchema>
export type CustomFieldConfigSnapshot = z.output<typeof CustomFieldConfigSnapshotSchema>
export type SaveCustomFieldConfig = z.output<typeof SaveCustomFieldConfigSchema>

export function parseConfigJson(json: string) {
  try {
    const value: unknown = JSON.parse(json)
    const result = CustomFieldConfigSchema.safeParse(value)
    if (result.success) return { success: true, data: result.data } as const
    return {
      success: false,
      error: result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n'),
    } as const
  } catch {
    return { success: false, error: 'Enter valid JSON.' } as const
  }
}
