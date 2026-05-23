import { describe, expect, it } from 'vitest'
import { CustomFieldType } from '@orm'
import {
  createCustomFieldValuesSchema,
  type CustomFieldDefinitionWithOptions,
} from './custom-field-validation'

const BASE_FIELD_ID = '123e4567-e89b-12d3-a456-426614174010'

function createField(
  type: CustomFieldType,
  overrides: Partial<CustomFieldDefinitionWithOptions> = {},
): CustomFieldDefinitionWithOptions {
  return {
    id: BASE_FIELD_ID,
    emulatorId: '123e4567-e89b-12d3-a456-426614174001',
    name: `test_${type.toLowerCase()}`,
    label: 'Test Field',
    type,
    isRequired: false,
    displayOrder: 0,
    categoryId: null,
    categoryOrder: 0,
    defaultValue: null,
    rangeMin: null,
    rangeMax: null,
    options: null,
    placeholder: null,
    rangeUnit: null,
    rangeDecimals: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createFieldValue(value: unknown) {
  return [
    {
      customFieldDefinitionId: BASE_FIELD_ID,
      value,
    },
  ]
}

describe('createCustomFieldValuesSchema', () => {
  it('rejects non-boolean values for boolean fields', () => {
    const schema = createCustomFieldValuesSchema([createField(CustomFieldType.BOOLEAN)])

    expect(schema.safeParse(createFieldValue('true')).success).toBe(false)
    expect(schema.safeParse(createFieldValue(true)).success).toBe(true)
    expect(schema.safeParse(createFieldValue(false)).success).toBe(true)
  })

  it('rejects select values outside parsed options', () => {
    const schema = createCustomFieldValuesSchema([
      createField(CustomFieldType.SELECT, {
        parsedOptions: [
          { value: 'option-a', label: 'Option A' },
          { value: 'option-b', label: 'Option B' },
        ],
      }),
    ])

    expect(schema.safeParse(createFieldValue('option-c')).success).toBe(false)
    expect(schema.safeParse(createFieldValue('option-a')).success).toBe(true)
  })

  it('validates select values against raw options when parsed options are not provided', () => {
    const schema = createCustomFieldValuesSchema([
      createField(CustomFieldType.SELECT, {
        options: [{ value: 'raw-option', label: 'Raw Option' }],
      }),
    ])

    expect(schema.safeParse(createFieldValue('other-option')).success).toBe(false)
    expect(schema.safeParse(createFieldValue('raw-option')).success).toBe(true)
  })

  it('rejects range values that are non-numeric or outside configured bounds', () => {
    const schema = createCustomFieldValuesSchema([
      createField(CustomFieldType.RANGE, {
        rangeMin: 10,
        rangeMax: 20,
      }),
    ])

    expect(schema.safeParse(createFieldValue('15')).success).toBe(false)
    expect(schema.safeParse(createFieldValue(9)).success).toBe(false)
    expect(schema.safeParse(createFieldValue(21)).success).toBe(false)
    expect(schema.safeParse(createFieldValue(15)).success).toBe(true)
  })

  it('rejects malformed URL values', () => {
    const schema = createCustomFieldValuesSchema([createField(CustomFieldType.URL)])

    expect(schema.safeParse(createFieldValue('not-a-url')).success).toBe(false)
    expect(schema.safeParse(createFieldValue('https://example.com')).success).toBe(true)
  })

  it('keeps optional empty values valid', () => {
    const schema = createCustomFieldValuesSchema([createField(CustomFieldType.URL)])

    expect(schema.safeParse(createFieldValue('')).success).toBe(true)
    expect(schema.safeParse([]).success).toBe(true)
    expect(schema.safeParse(undefined).success).toBe(true)
  })
})
