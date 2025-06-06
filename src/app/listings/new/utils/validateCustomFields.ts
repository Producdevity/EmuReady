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
  const missingFields: string[] = []

  for (const field of requiredFields) {
    const fieldValue = data.customFieldValues?.find(
      (cfv) => cfv.customFieldDefinitionId === field.id,
    )

    if (!fieldValue) {
      missingFields.push(field.label)
      continue
    }

    // Check if value is empty based on field type
    switch (field.type) {
      case CustomFieldType.TEXT:
      case CustomFieldType.TEXTAREA:
      case CustomFieldType.URL:
        if (
          !fieldValue.value ||
          (typeof fieldValue.value === 'string' &&
            fieldValue.value.trim() === '')
        ) {
          missingFields.push(field.label)
        }
        break
      case CustomFieldType.SELECT:
        if (!fieldValue.value || fieldValue.value === '') {
          missingFields.push(field.label)
        }
        break
      // BOOLEAN fields are always valid (true or false)
    }
  }

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
