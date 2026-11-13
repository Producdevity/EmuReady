import { createHash } from 'node:crypto'
import { AppError } from '@/lib/errors'
import { CustomFieldType } from '@orm'
import { type ConfigEmulatorRecord } from './persistence/config.prisma'
import {
  normalizeRangeDefault,
  supportsPlaceholder,
} from '../../shared/custom-field-attributes.schemas'
import {
  ConfigCategorySchema,
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
  if (field.type === CustomFieldType.RANGE) defaultValue = normalizeRangeDefault(defaultValue)
  const result = ConfigFieldSchema.safeParse({
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
  if (!result.success)
    return AppError.badRequest(
      `Field "${field.name}" has invalid settings. Correct it in the field editor before editing its JSON configuration.`,
    )
  return result.data
}

export function toConfigSnapshot(emulator: ConfigEmulatorRecord): CustomFieldConfigSnapshot {
  const result = CustomFieldConfigSchema.safeParse({
    version: 1,
    categories: emulator.customFieldCategories.map((category) => {
      const result = ConfigCategorySchema.safeParse(category)
      if (!result.success)
        return AppError.badRequest(
          `Category "${category.name}" has invalid settings. Correct it in the category editor before editing its JSON configuration.`,
        )
      return result.data
    }),
    fields: emulator.customFieldDefinitions.map(toConfigField),
  })
  if (!result.success)
    return AppError.badRequest(
      `Emulator "${emulator.id}" has invalid field or category settings. Correct them before editing its JSON configuration.`,
    )

  return {
    configuration: result.data,
    revision: createHash('sha256').update(JSON.stringify(result.data)).digest('hex'),
  }
}
