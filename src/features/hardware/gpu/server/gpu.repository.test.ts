import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGINATION } from '@/data/constants'
import { prisma } from '@/server/db'
import { GpuRepository } from './gpu.repository'
import {
  GPU_DELETE_GUARD_SELECT,
  GPU_DETAIL_SELECT,
  GPU_MOBILE_LIST_SELECT,
  GPU_MOBILE_PC_LISTING_SELECT,
  GPU_MODEL_CONFLICT_SELECT,
  GPU_SUMMARY_SELECT,
} from './persistence/gpu.prisma'
import type * as OrmClient from '@orm/client'

const GPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

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

vi.mock('@orm/client', async () => {
  const actual = await vi.importActual<typeof OrmClient>('@orm/client')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

describe('GPU repository persistence adapter', () => {
  let repository: GpuRepository

  beforeEach(() => {
    mockPrisma.gpu.count.mockReset()
    mockPrisma.gpu.create.mockReset()
    mockPrisma.gpu.delete.mockReset()
    mockPrisma.gpu.findFirst.mockReset()
    mockPrisma.gpu.findMany.mockReset()
    mockPrisma.gpu.findUnique.mockReset()
    mockPrisma.gpu.update.mockReset()
    repository = new GpuRepository(prisma)
  })

  it('creates a GPU with the explicit detail select contract', async () => {
    mockPrisma.gpu.create.mockResolvedValueOnce({
      id: GPU_ID,
      modelName: 'GeForce RTX 4090',
      brand: { id: BRAND_ID, name: 'NVIDIA' },
      _count: { pcListings: 0 },
    })

    await repository.create({ brandId: BRAND_ID, modelName: 'GeForce RTX 4090' })

    expect(mockPrisma.gpu.create).toHaveBeenCalledWith({
      data: { brandId: BRAND_ID, modelName: 'GeForce RTX 4090' },
      select: GPU_DETAIL_SELECT,
    })
  })

  it('translates database unique constraint errors for writes', async () => {
    const error = new Error('Unique constraint failed')
    Object.assign(error, { code: 'P2002' })
    mockPrisma.gpu.create.mockRejectedValueOnce(error)

    await expect(
      repository.create({ brandId: BRAND_ID, modelName: 'GeForce RTX 4090' }),
    ).rejects.toThrow('A GPU with model name "GeForce RTX 4090" already exists for this brand')
  })

  it('updates a GPU with the explicit detail select contract', async () => {
    mockPrisma.gpu.update.mockResolvedValueOnce({
      id: GPU_ID,
      modelName: 'GeForce RTX 4090',
      brand: { id: BRAND_ID, name: 'NVIDIA' },
      _count: { pcListings: 0 },
    })

    await repository.update(GPU_ID, { brandId: BRAND_ID, modelName: 'GeForce RTX 4090' })

    expect(mockPrisma.gpu.update).toHaveBeenCalledWith({
      where: { id: GPU_ID },
      data: { brandId: BRAND_ID, modelName: 'GeForce RTX 4090' },
      select: GPU_DETAIL_SELECT,
    })
  })

  it('finds case-insensitive model conflicts for the selected brand', async () => {
    mockPrisma.gpu.findFirst.mockResolvedValueOnce({ id: GPU_ID })

    await expect(
      repository.findModelNameConflict({
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4090',
        excludeId: GPU_ID,
      }),
    ).resolves.toEqual({ id: GPU_ID })

    expect(mockPrisma.gpu.findFirst).toHaveBeenCalledWith({
      where: {
        brandId: BRAND_ID,
        modelName: { equals: 'GeForce RTX 4090', mode: 'insensitive' },
        id: { not: GPU_ID },
      },
      select: GPU_MODEL_CONFLICT_SELECT,
    })
  })

  it('lists GPUs with the explicit detail select contract', async () => {
    mockPrisma.gpu.findMany.mockResolvedValueOnce([
      {
        id: GPU_ID,
        modelName: 'GeForce RTX 4090',
        brand: { id: BRAND_ID, name: 'NVIDIA' },
        _count: { pcListings: 0 },
      },
    ])
    mockPrisma.gpu.count.mockResolvedValueOnce(1)

    await expect(repository.list({ page: 1, limit: PAGINATION.DEFAULT_LIMIT })).resolves.toEqual({
      gpus: [
        {
          id: GPU_ID,
          modelName: 'GeForce RTX 4090',
          brand: { id: BRAND_ID, name: 'NVIDIA' },
          _count: { pcListings: 0 },
        },
      ],
      pagination: {
        total: 1,
        pages: 1,
        page: 1,
        offset: 0,
        limit: PAGINATION.DEFAULT_LIMIT,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: GPU_DETAIL_SELECT }),
    )
  })

  it('lists GPU summaries by id with the explicit summary select contract', async () => {
    mockPrisma.gpu.findMany.mockResolvedValueOnce([
      {
        id: GPU_ID,
        modelName: 'GeForce RTX 4090',
        brand: { id: BRAND_ID, name: 'NVIDIA' },
      },
    ])

    await expect(repository.listByIds([GPU_ID])).resolves.toEqual([
      {
        id: GPU_ID,
        modelName: 'GeForce RTX 4090',
        brand: { id: BRAND_ID, name: 'NVIDIA' },
      },
    ])

    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
      where: { id: { in: [GPU_ID] } },
      select: GPU_SUMMARY_SELECT,
    })
  })

  it('lists mobile compatibility GPUs with the old scalar fields and counts', async () => {
    mockPrisma.gpu.findMany.mockResolvedValueOnce([
      {
        id: GPU_ID,
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4090',
        createdAt: CREATED_AT,
        brand: { id: BRAND_ID, name: 'NVIDIA' },
        _count: { pcListings: 0 },
      },
    ])
    mockPrisma.gpu.count.mockResolvedValueOnce(1)

    await expect(repository.listMobileCompatibility({ page: 1, limit: 1000 })).resolves.toEqual({
      gpus: [
        {
          id: GPU_ID,
          brandId: BRAND_ID,
          modelName: 'GeForce RTX 4090',
          createdAt: CREATED_AT,
          brand: { id: BRAND_ID, name: 'NVIDIA' },
          _count: { pcListings: 0 },
        },
      ],
      pagination: {
        total: 1,
        pages: 1,
        page: 1,
        offset: 0,
        limit: 1000,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: GPU_MOBILE_LIST_SELECT,
        take: 1000,
      }),
    )
  })

  it('reads mobile PC listing GPUs with the old route query contract', async () => {
    mockPrisma.gpu.findMany.mockResolvedValueOnce([
      {
        id: GPU_ID,
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4090',
        createdAt: CREATED_AT,
        brand: { id: BRAND_ID, name: 'NVIDIA' },
      },
    ])

    await expect(
      repository.pcListingMobileGpuCompatibility({ search: 'RTX', limit: 100 }),
    ).resolves.toEqual({
      gpus: [
        {
          id: GPU_ID,
          brandId: BRAND_ID,
          modelName: 'GeForce RTX 4090',
          createdAt: CREATED_AT,
          brand: { id: BRAND_ID, name: 'NVIDIA' },
        },
      ],
    })

    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { modelName: { contains: 'RTX', mode: 'insensitive' } },
          { brand: { name: { contains: 'RTX', mode: 'insensitive' } } },
        ],
      },
      select: GPU_MOBILE_PC_LISTING_SELECT,
      orderBy: { modelName: 'asc' },
      take: 100,
    })
  })

  it('reads GPU dropdown pages with summary select and lookahead pagination', async () => {
    mockPrisma.gpu.findMany.mockResolvedValueOnce([
      {
        id: GPU_ID,
        modelName: 'GeForce RTX 4090',
        brand: { id: BRAND_ID, name: 'NVIDIA' },
      },
      {
        id: '00000000-0000-4000-a000-000000000003',
        modelName: 'GeForce RTX 4080',
        brand: { id: BRAND_ID, name: 'NVIDIA' },
      },
    ])

    await expect(repository.options({ search: 'NVIDIA', limit: 1, offset: 5 })).resolves.toEqual({
      gpus: [
        {
          id: GPU_ID,
          modelName: 'GeForce RTX 4090',
          brand: { id: BRAND_ID, name: 'NVIDIA' },
        },
      ],
      hasMore: true,
    })

    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: GPU_SUMMARY_SELECT,
        skip: 5,
        take: 2,
      }),
    )
  })

  it('reads the delete guard with the explicit delete guard select contract', async () => {
    mockPrisma.gpu.findUnique.mockResolvedValueOnce({
      id: GPU_ID,
      _count: { pcListings: 0, presets: 0 },
    })

    await expect(repository.findDeleteGuardById(GPU_ID)).resolves.toEqual({
      id: GPU_ID,
      _count: { pcListings: 0, presets: 0 },
    })

    expect(mockPrisma.gpu.findUnique).toHaveBeenCalledWith({
      where: { id: GPU_ID },
      select: GPU_DELETE_GUARD_SELECT,
    })
  })

  it('deletes a GPU by id with a minimal select contract', async () => {
    mockPrisma.gpu.delete.mockResolvedValueOnce({ id: GPU_ID })

    await repository.delete(GPU_ID)

    expect(mockPrisma.gpu.delete).toHaveBeenCalledWith({
      where: { id: GPU_ID },
      select: { id: true },
    })
  })

  it('returns GPU usage stats from PC report counts', async () => {
    mockPrisma.gpu.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2)

    await expect(repository.stats()).resolves.toEqual({
      total: 5,
      withListings: 3,
      withoutListings: 2,
    })

    expect(mockPrisma.gpu.count).toHaveBeenCalledWith({ where: { pcListings: { some: {} } } })
    expect(mockPrisma.gpu.count).toHaveBeenCalledWith({ where: { pcListings: { none: {} } } })
  })
})
