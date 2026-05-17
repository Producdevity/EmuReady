import { z } from 'zod'
import { JsonValueSchema } from '@/schemas/common'
import { isCustomFieldValueEmpty, type CustomFieldOptionUI } from '@/utils/custom-fields'
import { type CustomFieldDefinition } from '@orm'

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

export function createCustomFieldValuesSchema(
  customFields: readonly CustomFieldDefinitionWithOptions[],
) {
  return z
    .array(CustomFieldValueSchema)
    .optional()
    .superRefine((values, ctx) => {
      customFields.forEach((field, index) => {
        if (!field.isRequired) return

        const fieldValue = getFieldValue(values, field.id)
        if (fieldValue && !isCustomFieldValueEmpty(fieldValue.value)) return

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field.label} is required`,
          path: getFieldErrorPath(values, field.id, index),
        })
      })
    })
}
