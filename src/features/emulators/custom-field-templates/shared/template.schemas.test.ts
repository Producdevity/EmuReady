import { describe, expect, it } from 'vitest'
import { CreateCustomFieldTemplateSchema } from '@/features/emulators/custom-field-templates/shared/template.schemas'
import { CustomFieldType } from '@orm'

describe('template field attributes', () => {
  it('normalizes numeric range defaults saved by the previous editor', () => {
    const result = CreateCustomFieldTemplateSchema.parse({
      name: 'Graphics',
      fields: [
        {
          name: 'resolution',
          label: 'Resolution',
          type: CustomFieldType.RANGE,
          defaultValue: '1.5',
          rangeMin: 0.25,
          rangeMax: 4,
        },
      ],
    })
    expect(result.fields[0]?.defaultValue).toBe(1.5)
  })

  it.each(['invalid', '', 'Infinity'])(
    'rejects an invalid serialized range default: %s',
    (defaultValue) => {
      expect(
        CreateCustomFieldTemplateSchema.safeParse({
          name: 'Graphics',
          fields: [
            {
              name: 'resolution',
              label: 'Resolution',
              type: CustomFieldType.RANGE,
              defaultValue,
              rangeMin: 0.25,
              rangeMax: 4,
            },
          ],
        }).success,
      ).toBe(false)
    },
  )

  it('preserves a false boolean default', () => {
    const result = CreateCustomFieldTemplateSchema.parse({
      name: 'Graphics',
      fields: [
        { name: 'enabled', label: 'Enabled', type: CustomFieldType.BOOLEAN, defaultValue: false },
      ],
    })
    expect(result.fields[0]?.defaultValue).toBe(false)
  })
  it('preserves numeric defaults and every range attribute', () => {
    const field = {
      name: 'resolution',
      label: 'Resolution',
      type: CustomFieldType.RANGE,
      defaultValue: 1.5,
      rangeMin: 0.25,
      rangeMax: 4,
      rangeUnit: 'x',
      rangeDecimals: 2,
      categoryName: 'Graphics',
      categoryOrder: 3,
      isRequired: true,
      displayOrder: 2,
    }
    const result = CreateCustomFieldTemplateSchema.parse({ name: 'Graphics', fields: [field] })
    expect(result.fields[0]).toMatchObject(field)
  })

  it('preserves text placeholders and category suggestions', () => {
    const field = {
      name: 'driver',
      label: 'Driver',
      type: CustomFieldType.TEXT,
      defaultValue: 'custom',
      placeholder: 'Enter a driver',
      categoryName: 'Graphics',
      categoryOrder: 3,
    }
    const result = CreateCustomFieldTemplateSchema.parse({ name: 'Graphics', fields: [field] })
    expect(result.fields[0]).toMatchObject(field)
  })
})
