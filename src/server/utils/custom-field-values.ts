interface CustomFieldValueInput {
  customFieldDefinitionId: string
  value?: unknown
}

interface NormalizedCustomFieldValue {
  customFieldDefinitionId: string
  value: unknown
}

export function normalizeCustomFieldValues(
  values: CustomFieldValueInput[] | null | undefined,
): NormalizedCustomFieldValue[] | null {
  if (!values) return null

  return values.map((fieldValue) => ({
    customFieldDefinitionId: fieldValue.customFieldDefinitionId,
    value: fieldValue.value ?? null,
  }))
}
