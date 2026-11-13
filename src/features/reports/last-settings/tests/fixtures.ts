import { vi } from 'vitest'
import { type CustomFieldDefinitionWithOptions } from '@/utils/custom-field-validation'
import { CustomFieldType } from '@orm'

export const userId = '00000000-0000-4000-a000-000000000001'
export const emulatorId = '00000000-0000-4000-a000-000000000002'

export function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
    clear: vi.fn(() => values.clear()),
  }
}

export function fieldId(index: number) {
  return `00000000-0000-4000-a000-${String(index).padStart(12, '0')}`
}

export function customField(
  index: number,
  type: CustomFieldType = CustomFieldType.TEXT,
  overrides: Partial<CustomFieldDefinitionWithOptions> = {},
): CustomFieldDefinitionWithOptions {
  return {
    id: fieldId(index),
    emulatorId,
    name: `setting_${index}`,
    label: `Setting ${index}`,
    type,
    isRequired: false,
    displayOrder: index,
    categoryId: null,
    categoryOrder: 0,
    defaultValue: null,
    rangeMin: null,
    rangeMax: null,
    options: null,
    placeholder: null,
    rangeUnit: null,
    rangeDecimals: null,
    createdAt: new Date('2026-11-01'),
    updatedAt: new Date('2026-11-01'),
    ...overrides,
  }
}
