import { CustomFieldType } from '@orm'

export type CustomFieldValueEntry = {
  customFieldDefinitionId: string
  value?: unknown
}

interface CustomFieldDefinitionForSync {
  id: string
  type: CustomFieldType
  defaultValue?: unknown
}

function fieldIdsMatch(
  fields: readonly CustomFieldDefinitionForSync[],
  current: readonly CustomFieldValueEntry[],
): boolean {
  if (fields.length !== current.length) return false
  for (let i = 0; i < fields.length; i += 1) {
    if (fields[i].id !== current[i].customFieldDefinitionId) return false
  }
  return true
}

function defaultValueFor(field: CustomFieldDefinitionForSync): unknown {
  if (field.defaultValue !== null && field.defaultValue !== undefined) return field.defaultValue
  if (field.type === CustomFieldType.BOOLEAN) return false
  return null
}

// Returns the values to write into the form, or `null` when the form's
// current values already align with `fields` and no update is needed.
export function diffCustomFieldValues(
  fields: readonly CustomFieldDefinitionForSync[],
  current: readonly CustomFieldValueEntry[],
): CustomFieldValueEntry[] | null {
  if (fields.length === 0) return null
  if (fieldIdsMatch(fields, current)) return null

  return fields.map((field) => {
    const existing = current.find((v) => v.customFieldDefinitionId === field.id)
    const value =
      existing?.value === null || existing?.value === undefined
        ? defaultValueFor(field)
        : existing.value
    return { customFieldDefinitionId: field.id, value }
  })
}
