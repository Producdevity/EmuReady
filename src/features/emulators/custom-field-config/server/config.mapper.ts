import { createHash } from 'node:crypto'
import { CustomFieldType } from '@orm'
import { type ConfigEmulatorRecord } from './persistence/config.prisma'
import { supportsPlaceholder } from '../../shared/custom-field-attributes.schemas'
import {
  ConfigFieldSchema,
  CustomFieldConfigSchema,
  type CustomFieldConfigSnapshot,
} from '../shared/config.schemas'

export function toConfigField(field: ConfigEmulatorRecord['customFieldDefinitions'][number]) {
  let defaultValue = typeof field.defaultValue === 'object' ? null : field.defaultValue
  if (
    field.type === CustomFieldType.BOOLEAN &&
    (defaultValue === 'true' || defaultValue === 'false')
  ) {
    defaultValue = defaultValue === 'true'
  }
  return ConfigFieldSchema.parse({
    id: field.id,
    name: field.name,
    label: field.label,
    type: field.type,
    category: field.category?.name ?? null,
    options: field.type === CustomFieldType.SELECT ? (field.options ?? []) : [],
    defaultValue,
    placeholder: supportsPlaceholder(field.type) ? field.placeholder : null,
    rangeMin: field.type === CustomFieldType.RANGE ? field.rangeMin : null,
    rangeMax: field.type === CustomFieldType.RANGE ? field.rangeMax : null,
    rangeUnit: field.type === CustomFieldType.RANGE ? field.rangeUnit : null,
    rangeDecimals: field.type === CustomFieldType.RANGE ? field.rangeDecimals : null,
    isRequired: field.isRequired,
    displayOrder: field.displayOrder,
    categoryOrder: field.categoryOrder,
  })
}

export function toConfigSnapshot(emulator: ConfigEmulatorRecord): CustomFieldConfigSnapshot {
  const configuration = CustomFieldConfigSchema.parse({
    version: 1,
    categories: emulator.customFieldCategories.map((category) => ({
      id: category.id,
      name: category.name,
      displayOrder: category.displayOrder,
    })),
    fields: emulator.customFieldDefinitions.map(toConfigField),
  })

  return {
    configuration,
    revision: createHash('sha256').update(JSON.stringify(configuration)).digest('hex'),
  }
}
