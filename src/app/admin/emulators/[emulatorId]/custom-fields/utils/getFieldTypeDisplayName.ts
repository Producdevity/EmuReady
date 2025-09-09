import { CustomFieldType } from '@orm'

export function getFieldTypeDisplayName(type: CustomFieldType) {
  const fieldTypeDisplayNameMap: Record<CustomFieldType, string> = {
    [CustomFieldType.TEXT]: 'Text',
    [CustomFieldType.TEXTAREA]: 'Long Text',
    [CustomFieldType.URL]: 'URL',
    [CustomFieldType.BOOLEAN]: 'Yes/No',
    [CustomFieldType.SELECT]: 'Dropdown',
    [CustomFieldType.RANGE]: 'Range',
  }

  return fieldTypeDisplayNameMap[type] ?? type
}
