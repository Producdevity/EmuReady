import { z } from 'zod'
import { CreateCustomFieldDefinitionSchema } from '@/schemas/customFieldDefinition'
import { CustomFieldType } from '@orm'

const orderSchema = z.number().int().min(0).max(2_147_483_647)
const categoryNameSchema = z.string().trim().min(1).max(100)

export const ConfigOptionSchema = z
  .object({ value: z.string().min(1).max(500), label: z.string().min(1).max(200) })
  .strict()

export const ConfigFieldSchema = CreateCustomFieldDefinitionSchema.omit({
  emulatorId: true,
  categoryId: true,
})
  .extend({
    id: z.string().uuid().optional(),
    name: CreateCustomFieldDefinitionSchema.shape.name.max(100),
    label: z.string().trim().min(1).max(200),
    category: categoryNameSchema.nullable().default(null),
    options: z.array(ConfigOptionSchema).max(500).default([]),
    defaultValue: z
      .union([z.string().max(10_000), z.boolean(), z.number().finite(), z.null()])
      .default(null),
    placeholder: z.string().max(500).nullable().default(null),
    rangeMin: z.number().finite().nullable().default(null),
    rangeMax: z.number().finite().nullable().default(null),
    rangeUnit: z.string().max(50).nullable().default(null),
    rangeDecimals: z.number().int().min(0).max(5).nullable().default(null),
    displayOrder: orderSchema.default(0),
    categoryOrder: orderSchema.default(0),
  })
  .strict()
  .superRefine((field, ctx) => {
    function issue(path: string, message: string) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
    }

    if (field.type === CustomFieldType.SELECT) {
      if (field.options.length === 0) issue('options', 'Select fields require options.')
      if (new Set(field.options.map((option) => option.value)).size !== field.options.length) {
        issue('options', 'Option values must be unique.')
      }
      if (
        field.defaultValue !== null &&
        !field.options.some((option) => option.value === field.defaultValue)
      ) {
        issue('defaultValue', 'The default must match an option value.')
      }
    } else if (field.options.length > 0) {
      issue('options', 'Only select fields support options.')
    }

    if (field.type === CustomFieldType.RANGE) {
      if (field.rangeMin === null || field.rangeMax === null || field.rangeMin >= field.rangeMax) {
        issue('rangeMin', 'Range fields require a minimum below the maximum.')
      }
    } else if (
      [field.rangeMin, field.rangeMax, field.rangeUnit, field.rangeDecimals].some(
        (value) => value !== null,
      )
    ) {
      issue('rangeMin', 'Only range fields support range settings.')
    }

    if (field.defaultValue === null) return
    if (field.type === CustomFieldType.BOOLEAN && typeof field.defaultValue !== 'boolean') {
      issue('defaultValue', 'Boolean fields require a boolean default.')
    } else if (field.type === CustomFieldType.RANGE) {
      if (
        typeof field.defaultValue !== 'number' ||
        field.defaultValue < (field.rangeMin ?? 0) ||
        field.defaultValue > (field.rangeMax ?? 0)
      ) {
        issue('defaultValue', 'The default must be a number within the range.')
      }
    } else if (field.type !== CustomFieldType.BOOLEAN && typeof field.defaultValue !== 'string') {
      issue('defaultValue', 'This field requires a string default.')
    } else if (
      field.type === CustomFieldType.URL &&
      field.defaultValue !== '' &&
      !z.string().url().safeParse(field.defaultValue).success
    ) {
      issue('defaultValue', 'The default must be a valid URL.')
    }
  })

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
