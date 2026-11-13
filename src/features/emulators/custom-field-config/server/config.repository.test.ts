import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { Prisma } from '@orm/client'
import { CustomFieldConfigRepository } from './config.repository'
import { ConfigFieldSchema } from '../shared/config.schemas'
import { CATEGORY_ID, FIELD_ID, TARGET_ID } from '../tests/fixtures'

vi.unmock('@orm/client')
const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  customFieldDefinition: { update: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  customFieldCategory: { update: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

describe('configuration persistence', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses serializable transactions and translates conflicts', async () => {
    const error = Object.assign(new Error('write conflict'), { code: 'P2034' })
    database.$transaction.mockRejectedValue(error)
    const repository = new CustomFieldConfigRepository(prisma)
    await expect(repository.transaction(async () => undefined)).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    })
  })

  it('preserves an unexpected database failure as the configuration error cause', async () => {
    const cause = new Error('Connection closed during commit')
    database.$transaction.mockRejectedValue(cause)
    const repository = new CustomFieldConfigRepository(prisma)

    await expect(repository.transaction(async () => undefined)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database error during apply custom field configuration',
      cause,
    })
  })

  it('preserves field identity and false values, and clears nullable settings explicitly', async () => {
    const repository = new CustomFieldConfigRepository(prisma)
    const field = ConfigFieldSchema.parse({
      name: 'async_shader',
      label: 'Async shader',
      type: 'BOOLEAN',
      defaultValue: false,
    })
    await repository.saveField(TARGET_ID, field, null, FIELD_ID)
    expect(database.customFieldDefinition.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FIELD_ID, emulatorId: TARGET_ID },
        data: expect.objectContaining({
          defaultValue: false,
          options: Prisma.DbNull,
          categoryId: null,
          placeholder: null,
          rangeMin: null,
        }),
      }),
    )
  })
  it('creates pasted fields with a fresh ID and scopes removals to the destination', async () => {
    const repository = new CustomFieldConfigRepository(prisma)
    const field = ConfigFieldSchema.parse({
      id: FIELD_ID,
      name: 'test',
      label: 'Test',
      type: 'TEXT',
    })
    await repository.saveField(TARGET_ID, field, null)
    expect(database.customFieldDefinition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emulatorId: TARGET_ID, name: 'test' }),
      }),
    )
    const data = database.customFieldDefinition.create.mock.calls[0]?.[0]?.data
    expect(data).not.toHaveProperty('id')
    await repository.removeFields(TARGET_ID, [FIELD_ID])
    expect(database.customFieldDefinition.deleteMany).toHaveBeenCalledWith({
      where: { emulatorId: TARGET_ID, id: { in: [FIELD_ID] } },
    })
  })

  it('stages field and category name swaps before applying unique names', async () => {
    const repository = new CustomFieldConfigRepository(prisma)
    const otherCategory = '00000000-0000-4000-a000-000000000004'
    const otherField = '00000000-0000-4000-a000-000000000005'
    const categories = new Map([
      [CATEGORY_ID, 'Graphics'],
      [otherCategory, 'Advanced'],
    ])
    const fields = new Map([
      [FIELD_ID, 'renderer'],
      [otherField, 'backend'],
    ])

    function rename(names: Map<string, string>, id: string | undefined, name: unknown) {
      if (!id || !names.has(id) || typeof name !== 'string') throw new Error('Invalid update')
      if ([...names].some(([otherId, otherName]) => otherId !== id && otherName === name)) {
        throw new Error('Unique name constraint')
      }
      names.set(id, name)
      return { id }
    }

    database.customFieldCategory.update.mockImplementation(
      async (query: Prisma.CustomFieldCategoryUpdateArgs) => {
        expect(query.where.emulatorId).toBe(TARGET_ID)
        return rename(categories, query.where.id, query.data.name)
      },
    )
    database.customFieldDefinition.update.mockImplementation(
      async (query: Prisma.CustomFieldDefinitionUpdateArgs) => {
        expect(query.where.emulatorId).toBe(TARGET_ID)
        return rename(fields, query.where.id, query.data.name)
      },
    )

    await repository.stageRenames(TARGET_ID, [CATEGORY_ID, otherCategory], [FIELD_ID, otherField])
    expect(new Set([...categories.values(), ...fields.values()]).size).toBe(4)
    await repository.saveCategory(TARGET_ID, { name: 'Advanced', displayOrder: 0 }, CATEGORY_ID)
    await repository.saveCategory(TARGET_ID, { name: 'Graphics', displayOrder: 1 }, otherCategory)
    await repository.saveField(
      TARGET_ID,
      ConfigFieldSchema.parse({ name: 'backend', label: 'Backend', type: 'TEXT' }),
      CATEGORY_ID,
      FIELD_ID,
    )
    await repository.saveField(
      TARGET_ID,
      ConfigFieldSchema.parse({ name: 'renderer', label: 'Renderer', type: 'TEXT' }),
      otherCategory,
      otherField,
    )
    expect([...categories]).toEqual([
      [CATEGORY_ID, 'Advanced'],
      [otherCategory, 'Graphics'],
    ])
    expect([...fields]).toEqual([
      [FIELD_ID, 'backend'],
      [otherField, 'renderer'],
    ])
  })
})
