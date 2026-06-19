import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm/client'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockPrisma = vi.hoisted(() => ({
  cpu: {
    count: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

const { cpuRouter } = await import('./cpu.router')

const USER_ID = '00000000-0000-4000-a000-000000000010'
const CPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'

const cpuWithCounts = {
  id: CPU_ID,
  brandId: BRAND_ID,
  modelName: 'Core i7-13700K',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  brand: {
    id: BRAND_ID,
    name: 'Intel',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  _count: { pcListings: 2 },
}

function createCaller(overrides: { permissions?: string[] } = {}) {
  return {
    caller: cpuRouter.createCaller({
      session: {
        user: {
          id: USER_ID,
          email: 'test@test.com',
          name: 'Test User',
          role: Role.ADMIN,
          permissions: overrides.permissions ?? [],
          showNsfw: false,
        },
      },
      prisma,
      headers: new Headers(),
    }),
  }
}

describe('cpuRouter', () => {
  beforeEach(() => {
    mockPrisma.cpu.count.mockReset()
    mockPrisma.cpu.create.mockReset()
    mockPrisma.cpu.delete.mockReset()
    mockPrisma.cpu.findFirst.mockReset()
    mockPrisma.cpu.findMany.mockReset()
    mockPrisma.cpu.findUnique.mockReset()
    mockPrisma.cpu.update.mockReset()
  })

  it('returns stable web DTOs from get and hides Prisma relation count details', async () => {
    const { caller } = createCaller()
    mockPrisma.cpu.findMany.mockResolvedValueOnce([cpuWithCounts])
    mockPrisma.cpu.count.mockResolvedValueOnce(1)

    const result = await caller.get({ page: 2, limit: 10, search: 'Intel' })

    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    )
    expect(result).toEqual({
      cpus: [
        {
          id: CPU_ID,
          modelName: 'Core i7-13700K',
          brand: { id: BRAND_ID, name: 'Intel' },
          pcListingCount: 2,
        },
      ],
      pagination: {
        total: 1,
        pages: 1,
        page: 2,
        offset: 10,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    })
    expect(result.cpus[0]).not.toHaveProperty('_count')
  })

  it('creates a CPU through validation, policy, repository, service, and DTO output', async () => {
    const { caller } = createCaller({ permissions: [PERMISSIONS.MANAGE_DEVICES] })
    mockPrisma.cpu.findFirst.mockResolvedValueOnce(null)
    mockPrisma.cpu.create.mockResolvedValueOnce(cpuWithCounts)

    const result = await caller.create({
      brandId: BRAND_ID,
      modelName: '  Core   i7-13700K  ',
    })

    expect(mockPrisma.cpu.create).toHaveBeenCalledWith({
      data: { brandId: BRAND_ID, modelName: 'Core i7-13700K' },
      select: {
        id: true,
        modelName: true,
        brand: { select: { id: true, name: true } },
        _count: { select: { pcListings: true } },
      },
    })
    expect(result).toEqual({
      id: CPU_ID,
      modelName: 'Core i7-13700K',
      brand: { id: BRAND_ID, name: 'Intel' },
      pcListingCount: 2,
    })
  })

  it('rejects create before database access when the session lacks manage-device permission', async () => {
    const { caller } = createCaller()

    await expect(
      caller.create({
        brandId: BRAND_ID,
        modelName: 'Core i7-13700K',
      }),
    ).rejects.toThrow('You need the following permissions: manage_devices')
    expect(mockPrisma.cpu.findFirst).not.toHaveBeenCalled()
    expect(mockPrisma.cpu.create).not.toHaveBeenCalled()
  })

  it('returns CPU stats only when the session has statistics permission', async () => {
    const { caller } = createCaller({ permissions: [PERMISSIONS.VIEW_STATISTICS] })
    mockPrisma.cpu.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2)

    await expect(caller.stats()).resolves.toEqual({
      total: 5,
      withListings: 3,
      withoutListings: 2,
    })
  })
})
