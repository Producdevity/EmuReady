import { describe, expect, it } from 'vitest'
import { CustomFieldType } from '@orm'
import { ConfigFieldSchema, CustomFieldConfigSchema, parseConfigJson } from './config.schemas'

const field = { name: 'renderer', label: 'Renderer', type: CustomFieldType.TEXT }

describe('custom field configuration JSON', () => {
  it('preserves false and zero defaults and explicit ordering', () => {
    const result = CustomFieldConfigSchema.parse({
      version: 1,
      categories: [{ name: 'Graphics', displayOrder: 4 }],
      fields: [
        {
          ...field,
          type: CustomFieldType.BOOLEAN,
          defaultValue: false,
          category: 'Graphics',
          categoryOrder: 2,
          displayOrder: 7,
        },
        {
          name: 'scale',
          label: 'Scale',
          type: CustomFieldType.RANGE,
          rangeMin: 0,
          rangeMax: 4,
          defaultValue: 0,
          rangeDecimals: 1,
        },
      ],
    })
    expect(result.fields[0]?.defaultValue).toBe(false)
    expect(result.fields[0]?.categoryOrder).toBe(2)
    expect(result.fields[1]?.defaultValue).toBe(0)
  })

  it.each([
    { ...field, id: 'not-a-uuid' },
    { ...field, categoryId: 'foreign-category' },
    { ...field, type: CustomFieldType.BOOLEAN, defaultValue: 'false' },
    { ...field, type: CustomFieldType.RANGE, rangeMin: 2, rangeMax: 1 },
    { ...field, type: CustomFieldType.RANGE, rangeMin: 0, rangeMax: 1, defaultValue: 2 },
    { ...field, type: CustomFieldType.SELECT, options: [] },
    {
      ...field,
      type: CustomFieldType.SELECT,
      options: [{ value: 'a', label: 'A' }],
      defaultValue: 'b',
    },
    {
      ...field,
      type: CustomFieldType.SELECT,
      options: [
        { value: 'a', label: 'A' },
        { value: 'a', label: 'B' },
      ],
    },
    { ...field, options: [{ value: 'a', label: 'A' }] },
    { ...field, type: CustomFieldType.URL, defaultValue: 'not a URL' },
  ])('rejects invalid field contracts %#', (input) => {
    expect(ConfigFieldSchema.safeParse(input).success).toBe(false)
  })

  it('rejects duplicate field/category names and unknown category references', () => {
    expect(
      CustomFieldConfigSchema.safeParse({ version: 1, categories: [], fields: [field, field] })
        .success,
    ).toBe(false)
    expect(
      CustomFieldConfigSchema.safeParse({
        version: 1,
        categories: [{ name: 'A' }, { name: ' A ' }],
        fields: [],
      }).success,
    ).toBe(false)
    expect(
      CustomFieldConfigSchema.safeParse({
        version: 1,
        categories: [],
        fields: [{ ...field, category: 'Other' }],
      }).success,
    ).toBe(false)
  })

  it('reports syntax and field paths without throwing in the editor', () => {
    expect(parseConfigJson('{')).toEqual({ success: false, error: 'Enter valid JSON.' })
    expect(
      parseConfigJson(
        JSON.stringify({
          version: 1,
          categories: [],
          fields: [{ ...field, type: CustomFieldType.SELECT }],
        }),
      ),
    ).toMatchObject({ success: false, error: expect.stringContaining('fields.0.options') })
  })
  it('rejects duplicate IDs even when names differ', () => {
    const id = '00000000-0000-4000-a000-000000000099'
    expect(
      CustomFieldConfigSchema.safeParse({
        version: 1,
        categories: [],
        fields: [
          { ...field, id },
          { ...field, id, name: 'second' },
        ],
      }).success,
    ).toBe(false)
  })
})
