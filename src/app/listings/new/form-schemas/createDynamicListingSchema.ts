import { isString } from 'remeda'
import { z } from 'zod'
import { CustomFieldType, type CustomFieldDefinition } from '@orm'
import listingFormSchema from './listingFormSchema'

export interface CustomFieldOptionUI {
  value: string
  label: string
}

export interface CustomFieldDefinitionWithOptions
  extends Omit<CustomFieldDefinition, 'defaultValue'> {
  parsedOptions?: CustomFieldOptionUI[]
  defaultValue?: string | number | boolean | null
}

/**
 * Dynamic schema builder for custom field validation with specific field errors
 *
 * @param customFields
 */
function createDynamicListingSchema(customFields: CustomFieldDefinitionWithOptions[]) {
  if (customFields.length === 0) return listingFormSchema

  // Create dynamic validation for each custom field
  const customFieldValidation = z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(),
      }),
    )
    .optional()
    .superRefine((values, ctx) => {
      // Check required fields even if values array is empty or undefined
      customFields.forEach((field, index) => {
        if (!field.isRequired) return

        const fieldValue = values?.find((cfv) => cfv.customFieldDefinitionId === field.id)

        let isValid = true
        const errorMessage = `${field.label} is required`

        if (!fieldValue) {
          isValid = false
        } else {
          // Validate based on field type
          switch (field.type) {
            case CustomFieldType.TEXT:
            case CustomFieldType.TEXTAREA:
            case CustomFieldType.URL:
              if (
                fieldValue.value === undefined ||
                fieldValue.value === null ||
                (isString(fieldValue.value) && fieldValue.value.trim() === '')
              ) {
                isValid = false
              }
              break
            case CustomFieldType.SELECT:
              if (
                fieldValue.value === undefined ||
                fieldValue.value === null ||
                fieldValue.value === ''
              ) {
                isValid = false
              }
              break
            case CustomFieldType.RANGE:
              if (fieldValue.value === undefined || fieldValue.value === null) {
                isValid = false
              } else if (isString(fieldValue.value) && fieldValue.value.trim() === '') {
                isValid = false
              }
              break
            case CustomFieldType.BOOLEAN:
              // Required boolean must have explicit true/false value (not undefined/null)
              if (fieldValue.value === undefined || fieldValue.value === null) {
                isValid = false
              }
              // Note: both true and false are valid values
              break
          }
        }

        if (!isValid) {
          // Find the actual index in the values array for this field
          const valueIndex = values?.findIndex((v) => v.customFieldDefinitionId === field.id) ?? -1
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessage,
            // If the field value doesn't exist, add it at the expected index
            path: valueIndex >= 0 ? [valueIndex, 'value'] : [index, 'value'],
          })
        }
      })
    })

  return listingFormSchema.extend({ customFieldValues: customFieldValidation })
}

export default createDynamicListingSchema
