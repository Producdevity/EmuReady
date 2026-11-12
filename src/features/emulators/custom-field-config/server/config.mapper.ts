import { createHash } from 'node:crypto'
import { CustomFieldType } from '@orm'
import { type ConfigEmulatorRecord } from './persistence/config.prisma'
import { CustomFieldConfigSchema, type CustomFieldConfigSnapshot } from '../shared/config.schemas'

export function toConfigSnapshot(emulator: ConfigEmulatorRecord): CustomFieldConfigSnapshot {
  const configuration = CustomFieldConfigSchema.parse({
    version: 1,
    categories: emulator.customFieldCategories.map((category) => ({
      name: category.name,
      displayOrder: category.displayOrder,
    })),
    fields: emulator.customFieldDefinitions.map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type,
      category: field.category?.name ?? null,
      options: field.type === CustomFieldType.SELECT ? (field.options ?? []) : [],
      defaultValue: field.defaultValue,
      placeholder: field.placeholder,
      rangeMin: field.type === CustomFieldType.RANGE ? field.rangeMin : null,
      rangeMax: field.type === CustomFieldType.RANGE ? field.rangeMax : null,
      rangeUnit: field.type === CustomFieldType.RANGE ? field.rangeUnit : null,
      rangeDecimals: field.type === CustomFieldType.RANGE ? field.rangeDecimals : null,
      isRequired: field.isRequired,
      displayOrder: field.displayOrder,
      categoryOrder: field.categoryOrder,
    })),
  })

  return {
    configuration,
    revision: createHash('sha256').update(JSON.stringify(configuration)).digest('hex'),
  }
}
