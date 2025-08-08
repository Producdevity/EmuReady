import { z } from 'zod'
import { AppError, ResourceError } from '@/lib/errors'
import { validateData } from '@/server/utils/validation'
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

// Zod schemas for custom field validation
const CustomFieldValueSchema = z.object({
  customFieldDefinitionId: z.string(),
  value: z.unknown().optional(),
})

const CustomFieldValuesSchema = z.array(CustomFieldValueSchema)

export async function validateCustomFields(
  tx: PrismaTransactionClient,
  emulatorId: string,
  customFieldValues?: CustomFieldValue[],
): Promise<void> {
  // Validate the structure of custom field values if provided
  if (customFieldValues) {
    validateData(CustomFieldValuesSchema, customFieldValues, {
      customMessage: 'Invalid custom field values format',
    })
  }
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
        const fieldDef = customFieldDefinitions.find((d) => d.id === cfv.customFieldDefinitionId)

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

// Validation schemas for different field types
const TextFieldSchema = z.string().min(1, 'Field cannot be empty')
const OptionalTextFieldSchema = z.string().optional()
const UrlFieldSchema = z.string().url('Must be a valid URL')
const OptionalUrlFieldSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''))
const SelectFieldSchema = z.string().min(1, 'Must select a value')
const RangeFieldSchema = z.number()
const BooleanFieldSchema = z.boolean()

// Schema for SELECT field options
const SelectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
})
const SelectOptionsArraySchema = z.array(SelectOptionSchema)

function validateFieldValue(fieldDef: CustomFieldDefinition, value: unknown): void {
  switch (fieldDef.type) {
    case CustomFieldType.TEXT:
    case CustomFieldType.TEXTAREA:
      if (fieldDef.isRequired) {
        validateData(TextFieldSchema, value, {
          customMessage: `Required custom field '${fieldDef.label}' cannot be empty`,
        })
      } else if (value !== undefined && value !== null) {
        validateData(OptionalTextFieldSchema, value, {
          customMessage: `Custom field '${fieldDef.label}' must be a valid text value`,
        })
      }
      break

    case CustomFieldType.URL:
      if (fieldDef.isRequired) {
        validateData(UrlFieldSchema, value, {
          customMessage: `Required custom field '${fieldDef.label}' must be a valid URL`,
        })
      } else if (value !== undefined && value !== null && value !== '') {
        validateData(OptionalUrlFieldSchema, value, {
          customMessage: `Custom field '${fieldDef.label}' must be a valid URL`,
        })
      }
      break

    case CustomFieldType.SELECT:
      if (fieldDef.isRequired) {
        validateData(SelectFieldSchema, value, {
          customMessage: `Required custom field '${fieldDef.label}' must have a selected value`,
        })
      }

      // Validate that the selected value is one of the valid options
      if (value && value !== '' && fieldDef.options) {
        // Validate the options array structure
        const validatedOptions = validateData(SelectOptionsArraySchema, fieldDef.options)
        const validValues = validatedOptions.map((opt) => opt.value)

        if (validValues.length > 0) {
          const SelectOptionsSchema = z.enum(validValues as [string, ...string[]])
          validateData(SelectOptionsSchema, value, {
            customMessage: `Invalid value for custom field '${fieldDef.label}'. Must be one of: ${validValues.join(', ')}`,
          })
        }
      }
      break

    case CustomFieldType.RANGE:
      if (fieldDef.isRequired && (value === null || value === undefined)) {
        return AppError.badRequest(`Required custom field '${fieldDef.label}' must have a value`)
      }

      // Validate that the value is a number
      if (value !== null && value !== undefined) {
        // Convert string to number if needed
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        validateData(RangeFieldSchema, numValue, {
          customMessage: `Custom field '${fieldDef.label}' must be a valid number`,
        })
      }
      break

    case CustomFieldType.BOOLEAN:
      // Validate boolean type
      if (value !== undefined && value !== null) {
        validateData(BooleanFieldSchema, value, {
          customMessage: `Custom field '${fieldDef.label}' must be true or false`,
        })
      }
      break
  }
}
