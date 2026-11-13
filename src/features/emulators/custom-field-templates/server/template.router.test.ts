import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { CustomFieldType, Role } from '@orm'
import { customFieldTemplateRouter } from './template.router'
import { actor, TEMPLATE_ID, template } from '../tests/fixtures'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const database = vi.hoisted(() => ({
  customFieldTemplate: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

function caller(role: Role) {
  return customFieldTemplateRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: {
      user: { id: actor.userId, email: null, name: null, role, permissions: [], showNsfw: false },
    },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  database.customFieldTemplate.findMany.mockResolvedValue([template()])
  database.customFieldTemplate.findUnique.mockResolvedValue(template())
  database.customFieldTemplate.create.mockResolvedValue({ id: TEMPLATE_ID })
  database.customFieldTemplate.update.mockResolvedValue({ id: TEMPLATE_ID })
  database.customFieldTemplate.delete.mockResolvedValue({ id: TEMPLATE_ID })
})

describe('template transport', () => {
  it.each([Role.ADMIN, Role.SUPER_ADMIN])(
    'returns field attributes through explicit output contracts for %s',
    async (role) => {
      const result = await caller(role).get()
      expect(result[0]?.fields[0]).toMatchObject({
        defaultValue: 1.5,
        rangeMin: 0.25,
        rangeMax: 4,
        rangeUnit: 'x',
        rangeDecimals: 2,
        categoryName: 'Graphics',
        categoryOrder: 3,
      })
      expect(result[0]?.fields[1]?.placeholder).toBe('Enter a driver')
      expect(result[0]).not.toHaveProperty('updatedAt')
    },
  )

  it.each([Role.USER, Role.AUTHOR, Role.DEVELOPER, Role.MODERATOR])(
    'rejects reads by %s before querying templates',
    async (role) => {
      await expect(caller(role).get()).rejects.toThrow()
      expect(database.customFieldTemplate.findMany).not.toHaveBeenCalled()
    },
  )

  it('returns a not-found error instead of an empty editor for a missing template', async () => {
    database.customFieldTemplate.findUnique.mockResolvedValue(null)
    await expect(caller(Role.ADMIN).byId({ id: TEMPLATE_ID })).rejects.toThrow(
      'Custom field template not found',
    )
  })

  it('keeps writes restricted to super admins and returns a success receipt', async () => {
    const input = {
      name: 'Template',
      fields: [
        { name: 'enabled', label: 'Enabled', type: CustomFieldType.BOOLEAN, defaultValue: false },
      ],
    }
    await expect(caller(Role.ADMIN).create(input)).rejects.toThrow()
    expect(database.customFieldTemplate.create).not.toHaveBeenCalled()
    await expect(caller(Role.SUPER_ADMIN).create(input)).resolves.toEqual({ success: true })
    expect(database.customFieldTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fields: { create: [expect.objectContaining({ defaultValue: false })] },
        }),
      }),
    )
  })
})
