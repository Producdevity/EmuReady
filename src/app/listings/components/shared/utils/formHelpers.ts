import type { CustomFieldType } from '@orm'

interface CustomFieldValue {
  customFieldDefinition: {
    id: string
  }
  value: unknown
}

interface CustomFieldDefinition {
  id: string
  name: string
  label: string
  type: CustomFieldType
  defaultValue?: unknown
  isRequired: boolean
  [key: string]: unknown
}

/**
 * Initializes custom field values for forms, including fields added after listing creation
 * @param existingValues - Array of existing custom field values from the listing
 * @param fieldDefinitions - Array of all custom field definitions from the emulator
 * @returns Array of initialized custom field values for the form
 */
export function initializeCustomFieldValues(
  existingValues: CustomFieldValue[],
  fieldDefinitions: CustomFieldDefinition[],
): { customFieldDefinitionId: string; value: unknown }[] {
  // Create a map of existing custom field values
  const existingValuesMap = new Map(
    existingValues.map((cfv) => [cfv.customFieldDefinition.id, cfv.value]),
  )

  // Initialize all custom fields, including those added after listing creation
  return fieldDefinitions.map((fieldDef) => ({
    customFieldDefinitionId: fieldDef.id,
    value: existingValuesMap.get(fieldDef.id) ?? fieldDef.defaultValue ?? '',
  }))
}
