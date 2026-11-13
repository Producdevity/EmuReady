import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Prisma, Role } from '@orm'

vi.unmock('@/server/api/trpc')
const database = vi.hoisted(() => ({
  emulator: { findMany: vi.fn(), count: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))

const { emulatorsRouter } = await import('./emulators')

function caller(role: Role, permissions: string[]) {
  return emulatorsRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: {
      user: {
        id: 'authenticated-user',
        name: 'User',
        email: 'user@example.test',
        role,
        permissions,
        showNsfw: false,
      },
    },
  })
}

describe('emulator admin catalog permissions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    database.emulator.findMany.mockResolvedValue([])
    database.emulator.count.mockResolvedValue(0)
  })

  it.each([Role.USER, Role.DEVELOPER, Role.ADMIN])(
    'rejects %s without admin-panel permission before querying the catalog',
    async (role) => {
      await expect(caller(role, []).getForAdmin({})).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(database.emulator.findMany).not.toHaveBeenCalled()
      expect(database.emulator.count).not.toHaveBeenCalled()
    },
  )

  it('restricts developers to their assigned emulators, including filtered totals', async () => {
    await caller(Role.DEVELOPER, [PERMISSIONS.ACCESS_ADMIN_PANEL]).getForAdmin({ search: 'Eden' })
    expect(database.emulator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          verifiedDevelopers: { some: { userId: 'authenticated-user' } },
        }),
      }),
    )
    expect(database.emulator.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        verifiedDevelopers: { some: { userId: 'authenticated-user' } },
      }),
    })
  })

  it('allows admin catalog access without applying a developer ownership filter', async () => {
    await caller(Role.ADMIN, [PERMISSIONS.ACCESS_ADMIN_PANEL]).getForAdmin({})
    expect(database.emulator.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })

  it.each(['', '   '])('ignores a blank admin search %j', async (search) => {
    await caller(Role.ADMIN, [PERMISSIONS.ACCESS_ADMIN_PANEL]).getForAdmin({ search })

    expect(database.emulator.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
    expect(database.emulator.count).toHaveBeenCalledWith({ where: {} })
  })

  it('matches all search words against emulator names in both rows and totals', async () => {
    await caller(Role.ADMIN, [PERMISSIONS.ACCESS_ADMIN_PANEL]).getForAdmin({
      search: '  Eden NX  ',
    })
    const where = {
      OR: [
        {
          AND: [
            { name: { contains: 'Eden', mode: Prisma.QueryMode.insensitive } },
            { name: { contains: 'NX', mode: Prisma.QueryMode.insensitive } },
          ],
        },
      ],
    }

    expect(database.emulator.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
    expect(database.emulator.count).toHaveBeenCalledWith({ where })
  })

  it('retains phrase searches across names and descriptions in the public catalog', async () => {
    await caller(Role.USER, []).get({ search: 'Eden NX' })
    const where = {
      OR: [
        { name: { contains: 'Eden NX', mode: Prisma.QueryMode.insensitive } },
        { description: { contains: 'Eden NX', mode: Prisma.QueryMode.insensitive } },
      ],
    }

    expect(database.emulator.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
    expect(database.emulator.count).toHaveBeenCalledWith({ where })
  })
})
