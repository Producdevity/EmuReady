import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm/client'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockPrisma = vi.hoisted(() => ({
  gpu: {
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

const { gpuRouter } = await import('./gpu.router')

const USER_ID = '00000000-0000-4000-a000-000000000010'
const GPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'

const gpuWithCounts = {
  id: GPU_ID,
  brandId: BRAND_ID,
  modelName: 'GeForce RTX 4090',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  brand: {
    id: BRAND_ID,
    name: 'NVIDIA',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  _count: { pcListings: 2 },
}

function createCaller(overrides: { permissions?: string[] } = {}) {
  return {
    caller: gpuRouter.createCaller({
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

describe('gpuRouter', () => {
  beforeEach(() => {
    mockPrisma.gpu.count.mockReset()
    mockPrisma.gpu.create.mockReset()
    mockPrisma.gpu.delete.mockReset()
    mockPrisma.gpu.findFirst.mockReset()
    mockPrisma.gpu.findMany.mockReset()
    mockPrisma.gpu.findUnique.mockReset()
    mockPrisma.gpu.update.mockReset()
  })

  it('returns stable web DTOs from get and hides Prisma relation count details', async () => {
    const { caller } = createCaller()
    mockPrisma.gpu.findMany.mockResolvedValueOnce([gpuWithCounts])
    mockPrisma.gpu.count.mockResolvedValueOnce(1)

    const result = await caller.get({ page: 2, limit: 10, search: 'NVIDIA' })

    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    )
    expect(result).toEqual({
      gpus: [
        {
          id: GPU_ID,
          modelName: 'GeForce RTX 4090',
          brand: { id: BRAND_ID, name: 'NVIDIA' },
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
    expect(result.gpus[0]).not.toHaveProperty('_count')
  })

  it('creates a GPU through validation, policy, repository, service, and DTO output', async () => {
    const { caller } = createCaller({ permissions: [PERMISSIONS.MANAGE_DEVICES] })
    mockPrisma.gpu.findFirst.mockResolvedValueOnce(null)
    mockPrisma.gpu.create.mockResolvedValueOnce(gpuWithCounts)

    const result = await caller.create({
      brandId: BRAND_ID,
      modelName: '  GeForce   RTX 4090  ',
    })

    expect(mockPrisma.gpu.create).toHaveBeenCalledWith({
      data: { brandId: BRAND_ID, modelName: 'GeForce RTX 4090' },
      select: {
        id: true,
        modelName: true,
        brand: { select: { id: true, name: true } },
        _count: { select: { pcListings: true } },
      },
    })
    expect(result).toEqual({
      id: GPU_ID,
      modelName: 'GeForce RTX 4090',
      brand: { id: BRAND_ID, name: 'NVIDIA' },
      pcListingCount: 2,
    })
  })

  it('rejects create before database access when the session lacks manage-device permission', async () => {
    const { caller } = createCaller()

    await expect(
      caller.create({
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4090',
      }),
    ).rejects.toThrow('You need the following permissions: manage_devices')
    expect(mockPrisma.gpu.findFirst).not.toHaveBeenCalled()
    expect(mockPrisma.gpu.create).not.toHaveBeenCalled()
  })

  it('returns GPU stats only when the session has statistics permission', async () => {
    const { caller } = createCaller({ permissions: [PERMISSIONS.VIEW_STATISTICS] })
    mockPrisma.gpu.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2)

    await expect(caller.stats()).resolves.toEqual({
      total: 5,
      withListings: 3,
      withoutListings: 2,
    })
  })
})
