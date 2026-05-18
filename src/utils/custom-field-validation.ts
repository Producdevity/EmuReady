import { z } from 'zod'
import { JsonValueSchema } from '@/schemas/common'
import {
  isCustomFieldValueEmpty,
  parseCustomFieldOptions,
  type CustomFieldOptionUI,
} from '@/utils/custom-fields'
import { CustomFieldType, type CustomFieldDefinition } from '@orm'

export interface CustomFieldDefinitionWithOptions
  extends Omit<CustomFieldDefinition, 'defaultValue'> {
  parsedOptions?: CustomFieldOptionUI[]
  defaultValue?: string | number | boolean | null
}

const CustomFieldValueSchema = z.object({
  customFieldDefinitionId: z.string().uuid(),
  value: JsonValueSchema.optional(),
})

function getFieldValue(
  values: readonly z.infer<typeof CustomFieldValueSchema>[] | undefined,
  fieldId: string,
) {
  return values?.find((value) => value.customFieldDefinitionId === fieldId)
}

function getFieldErrorPath(
  values: readonly z.infer<typeof CustomFieldValueSchema>[] | undefined,
  fieldId: string,
  fallbackIndex: number,
): (string | number)[] {
  const valueIndex = values?.findIndex((value) => value.customFieldDefinitionId === fieldId) ?? -1
  return valueIndex >= 0 ? [valueIndex, 'value'] : [fallbackIndex, 'value']
}

function isSelectValueValid(field: CustomFieldDefinitionWithOptions, value: unknown): boolean {
  if (typeof value !== 'string') return false
  const options = field.parsedOptions ?? parseCustomFieldOptions(field) ?? []
  if (options.length === 0) return true
  return options.some((option) => option.value === value)
}

function isRangeValueValid(field: CustomFieldDefinitionWithOptions, value: unknown): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  if (field.rangeMin !== null && field.rangeMin !== undefined && value < field.rangeMin)
    return false
  if (field.rangeMax !== null && field.rangeMax !== undefined && value > field.rangeMax)
    return false
  return true
}

function isUrlValueValid(value: unknown): boolean {
  return z.string().url().safeParse(value).success
}

function isCustomFieldValueValid(field: CustomFieldDefinitionWithOptions, value: unknown): boolean {
  switch (field.type) {
    case CustomFieldType.BOOLEAN:
      return typeof value === 'boolean'
    case CustomFieldType.RANGE:
      return isRangeValueValid(field, value)
    case CustomFieldType.SELECT:
      return isSelectValueValid(field, value)
    case CustomFieldType.URL:
      return isUrlValueValid(value)
    case CustomFieldType.TEXT:
    case CustomFieldType.TEXTAREA:
      return typeof value === 'string'
  }
}

export function createCustomFieldValuesSchema(
  customFields: readonly CustomFieldDefinitionWithOptions[],
) {
  return z
    .array(CustomFieldValueSchema)
    .optional()
    .superRefine((values, ctx) => {
      customFields.forEach((field, index) => {
        const fieldValue = getFieldValue(values, field.id)
        const value = fieldValue?.value

        if (field.isRequired && isCustomFieldValueEmpty(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} is required`,
            path: getFieldErrorPath(values, field.id, index),
          })
          return
        }

        if (!fieldValue || isCustomFieldValueEmpty(value)) return
        if (isCustomFieldValueValid(field, value)) return

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field.label} has an invalid value`,
          path: getFieldErrorPath(values, field.id, index),
        })
      })
    })
}
