import { isString } from 'remeda'
import { AppError, ResourceError } from '@/lib/errors'
import { isValidUrl } from '@/utils/validation'
import { CustomFieldType, type Prisma } from '@orm'

type PrismaTransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

interface CustomFieldDefinition {
  id: string
  label: string
  type: CustomFieldType
  isRequired: boolean
  options?: unknown
}

interface CustomFieldValue {
  customFieldDefinitionId: string
  value?: unknown
}

export async function validateCustomFields(
  tx: PrismaTransactionClient,
  emulatorId: string,
  customFieldValues?: CustomFieldValue[],
): Promise<void> {
  // Get all custom field definitions for this emulator
  const customFieldDefinitions = await tx.customFieldDefinition.findMany({
    where: { emulatorId },
  })

  // Validate required custom fields
  const requiredFields = customFieldDefinitions.filter(
    (field: CustomFieldDefinition) => field.isRequired,
  )

  // Check if any required field is missing or invalid
  const missingField = requiredFields.find((requiredField) => {
    const providedValue = customFieldValues?.find(
      (cfv) => cfv.customFieldDefinitionId === requiredField.id,
    )

    if (!providedValue) return true // Field is missing

    // Validate the value based on field type
    try {
      validateFieldValue(requiredField, providedValue.value ?? null)
      return false // Field is valid
    } catch {
      return true // Field is invalid
    }
  })

  if (missingField) return AppError.missingRequiredField(missingField.label)

  // Validate all provided custom field values
  if (customFieldValues) {
    // Use Promise.all for parallel validation when we need async operations
    await Promise.all(
      customFieldValues.map(async (cfv) => {
        const fieldDef = customFieldDefinitions.find(
          (d) => d.id === cfv.customFieldDefinitionId,
        )

        if (!fieldDef || fieldDef.emulatorId !== emulatorId) {
          return ResourceError.customField.invalidForEmulator(
            cfv.customFieldDefinitionId,
            emulatorId,
          )
        }

        // Validate non-required fields if they have values
        if (!fieldDef.isRequired && cfv.value) {
          validateFieldValue(fieldDef, cfv.value)
        }
      }),
    )
  }
}

function validateFieldValue(
  fieldDef: CustomFieldDefinition,
  value: unknown,
): void {
  switch (fieldDef.type) {
    case CustomFieldType.TEXT:
    case CustomFieldType.TEXTAREA:
      if (
        fieldDef.isRequired &&
        (!value || (isString(value) && value.trim() === ''))
      ) {
        return AppError.badRequest(
          `Required custom field '${fieldDef.label}' cannot be empty`,
        )
      }
      break

    case CustomFieldType.URL:
      if (
        fieldDef.isRequired &&
        (!value || (isString(value) && value.trim() === ''))
      ) {
        return AppError.badRequest(
          `Required custom field '${fieldDef.label}' cannot be empty`,
        )
      }

      // Validate URL format if value is provided
      if (value && isString(value) && value.trim() !== '') {
        if (!isValidUrl(value.trim())) {
          return AppError.badRequest(
            `Custom field '${fieldDef.label}' must be a valid URL (http:// or https://)`,
          )
        }
      }
      break

    case CustomFieldType.SELECT:
      if (fieldDef.isRequired && (!value || value === '')) {
        return AppError.badRequest(
          `Required custom field '${fieldDef.label}' must have a selected value`,
        )
      }

      // Validate that the selected value is one of the valid options
      if (value && value !== '' && Array.isArray(fieldDef.options)) {
        const validValues = (
          fieldDef.options as Array<{ value: string; label: string }>
        ).map((opt) => opt.value)
        if (!validValues.includes(String(value))) {
          return AppError.badRequest(
            `Invalid value for custom field '${fieldDef.label}'. Must be one of: ${validValues.join(', ')}`,
          )
        }
      }
      break

    case CustomFieldType.RANGE:
      if (fieldDef.isRequired && (value === null || value === undefined)) {
        return AppError.badRequest(
          `Required custom field '${fieldDef.label}' must have a value`,
        )
      }

      // Validate that the value is a number within the expected range
      if (value !== null && value !== undefined) {
        const numValue =
          typeof value === 'string' ? parseFloat(value) : Number(value)
        if (isNaN(numValue)) {
          return AppError.badRequest(
            `Custom field '${fieldDef.label}' must be a valid number`,
          )
        }
      }
      break

    case CustomFieldType.BOOLEAN:
      // Boolean fields are always valid (true or false)
      break
  }
}
