import { CustomFieldType } from '@orm'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'

interface CustomFieldOptionUI {
  value: string
  label: string
}

interface CustomFieldDefinitionWithOptions {
  id: string
  name: string
  label: string
  type: CustomFieldType
  isRequired: boolean
  parsedOptions?: CustomFieldOptionUI[]
}

type ListingFormValues = RouterInput['listings']['create']

function validateCustomFields(
  data: ListingFormValues,
  parsedCustomFields: CustomFieldDefinitionWithOptions[],
): boolean {
  if (parsedCustomFields.length === 0) return true

  const requiredFields = parsedCustomFields.filter((field) => field.isRequired)

  const missingFields = requiredFields
    .filter((field) => {
      const fieldValue = data.customFieldValues?.find(
        (cfv) => cfv.customFieldDefinitionId === field.id,
      )

      if (!fieldValue) return true

      // Check if value is empty based on field type
      switch (field.type) {
        case CustomFieldType.TEXT:
        case CustomFieldType.TEXTAREA:
        case CustomFieldType.URL:
          return (
            !fieldValue.value ||
            (typeof fieldValue.value === 'string' &&
              fieldValue.value.trim() === '')
          )
        case CustomFieldType.SELECT:
          return !fieldValue.value || fieldValue.value === ''
        // BOOLEAN fields are always valid (true or false)
        default:
          return false
      }
    })
    .map((field) => field.label)

  if (missingFields.length > 0) {
    // Provide user-friendly toast message
    toast.error(
      `Please fill in all required fields: ${missingFields.join(', ')}`,
    )

    // The schema validation will handle setting specific field errors,
    // so we don't need to set them here to avoid conflicts

    // Scroll to the first error field
    setTimeout(() => {
      const firstErrorField = document
        .querySelector('.text-red-500')
        ?.closest('.mb-4')
      if (firstErrorField) {
        firstErrorField.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 100)

    return false
  }

  return true
}

export default validateCustomFields
