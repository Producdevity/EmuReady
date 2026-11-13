import { describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { CustomFieldType } from '@orm'
import { CustomFieldTemplateRepository } from './template.repository'
import { CreateCustomFieldTemplateSchema } from '../shared/template.schemas'

vi.unmock('@orm')
const database = vi.hoisted(() => ({
  customFieldTemplate: { upsert: vi.fn().mockResolvedValue({ id: 'template' }) },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

describe('template catalog persistence', () => {
  it('replaces a catalog field set in one nested write while preserving all attributes', async () => {
    const input = CreateCustomFieldTemplateSchema.parse({
      name: 'Catalog',
      fields: [
        {
          name: 'clock',
          label: 'Clock',
          type: CustomFieldType.RANGE,
          defaultValue: 0,
          rangeMin: -3,
          rangeMax: 3,
          rangeUnit: '%',
          rangeDecimals: 2,
          categoryName: 'CPU',
          categoryOrder: 3,
        },
        {
          name: 'driver',
          label: 'Driver',
          type: CustomFieldType.TEXT,
          placeholder: 'Enter driver',
          categoryName: 'Graphics',
          categoryOrder: 4,
        },
      ],
    })
    await new CustomFieldTemplateRepository(prisma).syncCatalogTemplate(input)
    const fields = [
      expect.objectContaining({
        defaultValue: 0,
        rangeMin: -3,
        rangeMax: 3,
        rangeUnit: '%',
        rangeDecimals: 2,
        categoryName: 'CPU',
        categoryOrder: 3,
      }),
      expect.objectContaining({
        placeholder: 'Enter driver',
        categoryName: 'Graphics',
        categoryOrder: 4,
      }),
    ]
    expect(database.customFieldTemplate.upsert).toHaveBeenCalledOnce()
    expect(database.customFieldTemplate.upsert).toHaveBeenCalledWith({
      where: { name: 'Catalog' },
      create: { name: 'Catalog', description: undefined, fields: { create: fields } },
      update: { fields: { deleteMany: {}, create: fields } },
      select: { id: true },
    })
  })
})
