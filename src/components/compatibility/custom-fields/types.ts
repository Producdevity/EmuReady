import { type CustomFieldType } from '@orm'

export interface CompatibilityCustomFieldValue {
  id?: string
  value: unknown
  customFieldDefinition: {
    id?: string
    type: CustomFieldType
    label?: string
    name?: string | null
    options?: unknown
    defaultValue?: unknown
    rangeDecimals?: number | null
    rangeUnit?: string | null
    categoryId?: string | null
    category?: { id: string; name: string } | null
  }
}
