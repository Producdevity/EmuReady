import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { CustomFieldType, Role } from '@orm/client'

vi.unmock('@/server/api/trpc')
vi.unmock('@orm/client')
const database = vi.hoisted(() => ({
  customFieldDefinition: { findUnique: vi.fn(), update: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

const { customFieldDefinitionRouter } = await import('./customFieldDefinitions')
const field = {
  id: '00000000-0000-4000-a000-000000000002',
  emulatorId: '00000000-0000-4000-a000-000000000001',
  name: 'scale',
  type: CustomFieldType.TEXT,
  options: null,
  rangeMin: null,
  rangeMax: null,
}

function caller() {
  return customFieldDefinitionRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: {
      user: {
        id: 'authenticated-admin',
        name: 'Admin',
        email: 'admin@example.test',
        role: Role.ADMIN,
        permissions: [PERMISSIONS.MANAGE_CUSTOM_FIELDS],
        showNsfw: false,
      },
    },
  })
}

describe('custom field range updates', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    database.customFieldDefinition.findUnique.mockResolvedValue(field)
  })

  it.each([{}, { rangeMin: 0 }, { rangeMax: 10 }])(
    'rejects changing to Range with missing bounds: %j',
    async (bounds) => {
      await expect(
        caller().update({ id: field.id, type: CustomFieldType.RANGE, ...bounds }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expect(database.customFieldDefinition.update).not.toHaveBeenCalled()
    },
  )

  it('rejects inverted effective bounds', async () => {
    await expect(
      caller().update({ id: field.id, type: CustomFieldType.RANGE, rangeMin: 10, rangeMax: 1 }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(database.customFieldDefinition.update).not.toHaveBeenCalled()
  })

  it('permits partial updates with complete persisted bounds', async () => {
    database.customFieldDefinition.findUnique.mockResolvedValue({
      ...field,
      type: CustomFieldType.RANGE,
      rangeMin: 0,
      rangeMax: 10,
    })
    database.customFieldDefinition.update.mockResolvedValue({ id: field.id })
    await caller().update({ id: field.id, rangeMax: 20 })
    expect(database.customFieldDefinition.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ rangeMax: 20 }) }),
    )
  })
})
