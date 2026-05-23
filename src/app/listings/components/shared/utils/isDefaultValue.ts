import { isNullish } from 'remeda'
import type { CompatibilityCustomFieldValue } from '@/components/compatibility/custom-fields'

/**
 * Checks if a custom field value is the default value for its definition
 * @param fieldValue
 */
export function isDefaultValue(fieldValue: CompatibilityCustomFieldValue): boolean {
  const defaultValue = fieldValue.customFieldDefinition.defaultValue
  const currentValue = fieldValue.value

  // If no default is set, consider any value as non-default
  if (isNullish(defaultValue)) return false

  // For JSON values, need to parse and compare
  if (typeof defaultValue === 'object' && typeof currentValue === 'object') {
    return JSON.stringify(defaultValue) === JSON.stringify(currentValue)
  }

  // Direct comparison for primitives
  return defaultValue === currentValue
}
