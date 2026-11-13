import { z } from 'zod'
import { CreateCustomFieldDefinitionSchema } from '@/schemas/customFieldDefinition'
import { CustomFieldType } from '@orm'

export function supportsPlaceholder(type: CustomFieldType) {
  return (
    type === CustomFieldType.TEXT ||
    type === CustomFieldType.TEXTAREA ||
    type === CustomFieldType.URL
  )
}

export const CustomFieldOptionSchema = z
  .object({ value: z.string().min(1).max(500), label: z.string().min(1).max(200) })
  .strict()

export const CustomFieldAttributesSchema = CreateCustomFieldDefinitionSchema.pick({
  type: true,
  isRequired: true,
})
  .extend({
    options: z.array(CustomFieldOptionSchema).max(500).default([]),
    defaultValue: z
      .union([z.string().max(10_000), z.boolean(), z.number().finite(), z.null()])
      .default(null),
    placeholder: z.string().max(500).nullable().default(null),
    rangeMin: z.number().finite().nullable().default(null),
    rangeMax: z.number().finite().nullable().default(null),
    rangeUnit: z.string().max(50).nullable().default(null),
    rangeDecimals: z.number().int().min(0).max(5).nullable().default(null),
  })
  .strict()

export function normalizeRangeDefault(
  value: z.output<typeof CustomFieldAttributesSchema>['defaultValue'],
) {
  if (typeof value !== 'string') return value
  const number = value.trim() ? Number(value) : NaN
  return Number.isFinite(number) ? number : value
}

export function validateCustomFieldAttributes(
  field: z.output<typeof CustomFieldAttributesSchema>,
  ctx: z.RefinementCtx,
) {
  function issue(path: string, message: string) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
  }

  if (field.placeholder !== null && !supportsPlaceholder(field.type)) {
    issue('placeholder', 'Only text, textarea and URL fields support placeholders.')
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
}
