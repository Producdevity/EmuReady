import { isString } from 'remeda'
import { z } from 'zod'
import { CustomFieldType, type CustomFieldDefinition } from '@orm'
import listingFormSchema from './listingFormSchema'

export interface CustomFieldOptionUI {
  value: string
  label: string
}

export interface CustomFieldDefinitionWithOptions
  extends CustomFieldDefinition {
  parsedOptions?: CustomFieldOptionUI[]
}

/**
 * Dynamic schema builder for custom field validation with specific field errors
 *
 * @param customFields
 */
function createDynamicListingSchema(
  customFields: CustomFieldDefinitionWithOptions[],
) {
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
      if (!values) return

      customFields.forEach((field, index) => {
        if (!field.isRequired) return

        const fieldValue = values.find(
          (cfv) => cfv.customFieldDefinitionId === field.id,
        )

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
                !fieldValue.value ||
                (isString(fieldValue.value) && fieldValue.value.trim() === '')
              ) {
                isValid = false
              }
              break
            case CustomFieldType.SELECT:
              if (!fieldValue.value || fieldValue.value === '') {
                isValid = false
              }
              break
            case CustomFieldType.BOOLEAN:
              // Boolean fields are always valid (true or false)
              isValid = true
              break
          }
        }

        if (!isValid) {
          // Find the actual index in the values array for this field
          const valueIndex = values.findIndex(
            (v) => v.customFieldDefinitionId === field.id,
          )
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
