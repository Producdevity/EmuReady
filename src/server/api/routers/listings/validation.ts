import { CustomFieldType, type Prisma } from '@orm'
import { AppError, ResourceError } from '@/lib/errors'

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
  customFieldValues?: CustomFieldValue[]
): Promise<void> {
  // Get all custom field definitions for this emulator
  const customFieldDefinitions = await tx.customFieldDefinition.findMany({
    where: { emulatorId },
  })

  // Validate required custom fields
  const requiredFields = customFieldDefinitions.filter((field: CustomFieldDefinition) => field.isRequired)
  
  for (const requiredField of requiredFields) {
    const providedValue = customFieldValues?.find(
      cfv => cfv.customFieldDefinitionId === requiredField.id
    )

    if (!providedValue) {
      AppError.missingRequiredField(requiredField.label)
      return // This will never be reached, but helps TypeScript
    }

    // Validate the value based on field type
    validateFieldValue(requiredField, providedValue.value ?? null)
  }

  // Validate all provided custom field values
  if (customFieldValues) {
    for (const cfv of customFieldValues) {
      const fieldDef = await tx.customFieldDefinition.findUnique({
        where: { id: cfv.customFieldDefinitionId },
      })
      
      if (!fieldDef || fieldDef.emulatorId !== emulatorId) {
        ResourceError.customField.invalidForEmulator(cfv.customFieldDefinitionId, emulatorId)
        return // This will never be reached, but helps TypeScript
      }

      // Validate non-required fields if they have values
      if (!fieldDef.isRequired && cfv.value) {
        validateFieldValue(fieldDef, cfv.value)
      }
    }
  }
}

function validateFieldValue(fieldDef: CustomFieldDefinition, value: unknown): void {
  switch (fieldDef.type) {
    case CustomFieldType.TEXT:
    case CustomFieldType.TEXTAREA:
    case CustomFieldType.URL:
      if (fieldDef.isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
        AppError.badRequest(`Required custom field '${fieldDef.label}' cannot be empty`)
        return // This will never be reached, but helps TypeScript
      }
      break
      
    case CustomFieldType.SELECT:
      if (fieldDef.isRequired && (!value || value === '')) {
        AppError.badRequest(`Required custom field '${fieldDef.label}' must have a selected value`)
        return // This will never be reached, but helps TypeScript
      }
      
      // Validate that the selected value is one of the valid options
      if (value && value !== '' && Array.isArray(fieldDef.options)) {
        const validValues = (fieldDef.options as Array<{value: string, label: string}>).map(opt => opt.value)
        if (!validValues.includes(String(value))) {
          AppError.badRequest(`Invalid value for custom field '${fieldDef.label}'. Must be one of: ${validValues.join(', ')}`)
          return // This will never be reached, but helps TypeScript
        }
      }
      break
      
    case CustomFieldType.BOOLEAN:
      // Boolean fields are always valid (true or false)
      break
  }
} 