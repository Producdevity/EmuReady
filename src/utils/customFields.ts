import { CustomFieldType } from '@orm'

export interface CustomFieldOptionUI {
  value: string
  label: string
}

/**
 * Parses custom field options from raw database format to UI-friendly format
 * This utility prevents code duplication between listings and pc-listings forms
 */
export function parseCustomFieldOptions(field: {
  type: CustomFieldType
  options?: unknown
}): CustomFieldOptionUI[] | undefined {
  if (field.type !== CustomFieldType.SELECT || !Array.isArray(field.options)) {
    return undefined
  }

  return field.options.reduce((acc: CustomFieldOptionUI[], opt: unknown) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt) {
      const knownOpt = opt as { value: unknown; label: unknown }
      acc.push({
        value: String(knownOpt.value),
        label: String(knownOpt.label),
      })
    }
    return acc
  }, [])
}

/**
 * Gets the default value for a custom field based on its type and options
 */
export function getCustomFieldDefaultValue(
  field: {
    type: CustomFieldType
    defaultValue?: string | number | boolean | null | undefined
  },
  parsedOptions?: CustomFieldOptionUI[],
): string | boolean | number | null | undefined {
  // Use the actual default value from the field definition if available
  if (field.defaultValue !== null && field.defaultValue !== undefined) {
    return field.defaultValue
  }

  // Fall back to type-specific defaults
  switch (field.type) {
    case CustomFieldType.BOOLEAN:
      return false
    case CustomFieldType.SELECT:
      return parsedOptions?.[0]?.value ?? ''
    default:
      return ''
  }
}
