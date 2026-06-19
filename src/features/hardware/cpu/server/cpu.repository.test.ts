import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGINATION } from '@/data/constants'
import { prisma } from '@/server/db'
import { CpuRepository } from './cpu.repository'
import {
  CPU_DELETE_GUARD_SELECT,
  CPU_DETAIL_SELECT,
  CPU_MOBILE_LIST_SELECT,
  CPU_MOBILE_PC_LISTING_SELECT,
  CPU_MODEL_CONFLICT_SELECT,
  CPU_SUMMARY_SELECT,
} from './persistence/cpu.prisma'
import type * as OrmClient from '@orm/client'

const CPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

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

describe('CPU repository persistence adapter', () => {
  let repository: CpuRepository

  beforeEach(() => {
    mockPrisma.cpu.count.mockReset()
    mockPrisma.cpu.create.mockReset()
    mockPrisma.cpu.delete.mockReset()
    mockPrisma.cpu.findFirst.mockReset()
    mockPrisma.cpu.findMany.mockReset()
    mockPrisma.cpu.findUnique.mockReset()
    mockPrisma.cpu.update.mockReset()
    repository = new CpuRepository(prisma)
  })

  it('creates a CPU with the explicit detail select contract', async () => {
    mockPrisma.cpu.create.mockResolvedValueOnce({
      id: CPU_ID,
      modelName: 'Core i7-13700K',
      brand: { id: BRAND_ID, name: 'Intel' },
      _count: { pcListings: 0 },
    })

    await repository.create({ brandId: BRAND_ID, modelName: 'Core i7-13700K' })

    expect(mockPrisma.cpu.create).toHaveBeenCalledWith({
      data: { brandId: BRAND_ID, modelName: 'Core i7-13700K' },
      select: CPU_DETAIL_SELECT,
    })
  })

  it('translates database unique constraint errors for writes', async () => {
    const error = new Error('Unique constraint failed')
    Object.assign(error, { code: 'P2002' })
    mockPrisma.cpu.create.mockRejectedValueOnce(error)

    await expect(
      repository.create({ brandId: BRAND_ID, modelName: 'Core i7-13700K' }),
    ).rejects.toThrow('A CPU with model name "Core i7-13700K" already exists for this brand')
  })

  it('updates a CPU with the explicit detail select contract', async () => {
    mockPrisma.cpu.update.mockResolvedValueOnce({
      id: CPU_ID,
      modelName: 'Core i7-13700K',
      brand: { id: BRAND_ID, name: 'Intel' },
      _count: { pcListings: 0 },
    })

    await repository.update(CPU_ID, { brandId: BRAND_ID, modelName: 'Core i7-13700K' })

    expect(mockPrisma.cpu.update).toHaveBeenCalledWith({
      where: { id: CPU_ID },
      data: { brandId: BRAND_ID, modelName: 'Core i7-13700K' },
      select: CPU_DETAIL_SELECT,
    })
  })

  it('finds case-insensitive model conflicts for the selected brand', async () => {
    mockPrisma.cpu.findFirst.mockResolvedValueOnce({ id: CPU_ID })

    await expect(
      repository.findModelNameConflict({
        brandId: BRAND_ID,
        modelName: 'Core i7-13700K',
        excludeId: CPU_ID,
      }),
    ).resolves.toEqual({ id: CPU_ID })

    expect(mockPrisma.cpu.findFirst).toHaveBeenCalledWith({
      where: {
        brandId: BRAND_ID,
        modelName: { equals: 'Core i7-13700K', mode: 'insensitive' },
        id: { not: CPU_ID },
      },
      select: CPU_MODEL_CONFLICT_SELECT,
    })
  })

  it('lists CPUs with the explicit detail select contract', async () => {
    mockPrisma.cpu.findMany.mockResolvedValueOnce([
      {
        id: CPU_ID,
        modelName: 'Core i7-13700K',
        brand: { id: BRAND_ID, name: 'Intel' },
        _count: { pcListings: 0 },
      },
    ])
    mockPrisma.cpu.count.mockResolvedValueOnce(1)

    await expect(repository.list({ page: 1, limit: PAGINATION.DEFAULT_LIMIT })).resolves.toEqual({
      cpus: [
        {
          id: CPU_ID,
          modelName: 'Core i7-13700K',
          brand: { id: BRAND_ID, name: 'Intel' },
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
    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: CPU_DETAIL_SELECT }),
    )
  })

  it('lists CPU summaries by id with the explicit summary select contract', async () => {
    mockPrisma.cpu.findMany.mockResolvedValueOnce([
      {
        id: CPU_ID,
        modelName: 'Core i7-13700K',
        brand: { id: BRAND_ID, name: 'Intel' },
      },
    ])

    await expect(repository.listByIds([CPU_ID])).resolves.toEqual([
      {
        id: CPU_ID,
        modelName: 'Core i7-13700K',
        brand: { id: BRAND_ID, name: 'Intel' },
      },
    ])

    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
      where: { id: { in: [CPU_ID] } },
      select: CPU_SUMMARY_SELECT,
    })
  })

  it('lists mobile compatibility CPUs with the old scalar fields and counts', async () => {
    mockPrisma.cpu.findMany.mockResolvedValueOnce([
      {
        id: CPU_ID,
        brandId: BRAND_ID,
        modelName: 'Core i7-13700K',
        createdAt: CREATED_AT,
        brand: { id: BRAND_ID, name: 'Intel' },
        _count: { pcListings: 0 },
      },
    ])
    mockPrisma.cpu.count.mockResolvedValueOnce(1)

    await expect(repository.listMobileCompatibility({ page: 1, limit: 1000 })).resolves.toEqual({
      cpus: [
        {
          id: CPU_ID,
          brandId: BRAND_ID,
          modelName: 'Core i7-13700K',
          createdAt: CREATED_AT,
          brand: { id: BRAND_ID, name: 'Intel' },
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
    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: CPU_MOBILE_LIST_SELECT,
        take: 1000,
      }),
    )
  })

  it('reads mobile PC listing CPUs with the old route query contract', async () => {
    mockPrisma.cpu.findMany.mockResolvedValueOnce([
      {
        id: CPU_ID,
        brandId: BRAND_ID,
        modelName: 'Core i7-13700K',
        createdAt: CREATED_AT,
        brand: { id: BRAND_ID, name: 'Intel' },
      },
    ])

    await expect(
      repository.pcListingMobileCpuCompatibility({ search: 'Core', limit: 100 }),
    ).resolves.toEqual({
      cpus: [
        {
          id: CPU_ID,
          brandId: BRAND_ID,
          modelName: 'Core i7-13700K',
          createdAt: CREATED_AT,
          brand: { id: BRAND_ID, name: 'Intel' },
        },
      ],
    })

    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { modelName: { contains: 'Core', mode: 'insensitive' } },
          { brand: { name: { contains: 'Core', mode: 'insensitive' } } },
        ],
      },
      select: CPU_MOBILE_PC_LISTING_SELECT,
      orderBy: { modelName: 'asc' },
      take: 100,
    })
  })

  it('reads CPU dropdown pages with summary select and lookahead pagination', async () => {
    mockPrisma.cpu.findMany.mockResolvedValueOnce([
      {
        id: CPU_ID,
        modelName: 'Core i7-13700K',
        brand: { id: BRAND_ID, name: 'Intel' },
      },
      {
        id: '00000000-0000-4000-a000-000000000003',
        modelName: 'Core i9-14900K',
        brand: { id: BRAND_ID, name: 'Intel' },
      },
    ])

    await expect(repository.options({ search: 'Intel', limit: 1, offset: 5 })).resolves.toEqual({
      cpus: [
        {
          id: CPU_ID,
          modelName: 'Core i7-13700K',
          brand: { id: BRAND_ID, name: 'Intel' },
        },
      ],
      hasMore: true,
    })

    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: CPU_SUMMARY_SELECT,
        skip: 5,
        take: 2,
      }),
    )
  })

  it('reads the delete guard with the explicit delete guard select contract', async () => {
    mockPrisma.cpu.findUnique.mockResolvedValueOnce({
      id: CPU_ID,
      _count: { pcListings: 0, presets: 0 },
    })

    await expect(repository.findDeleteGuardById(CPU_ID)).resolves.toEqual({
      id: CPU_ID,
      _count: { pcListings: 0, presets: 0 },
    })

    expect(mockPrisma.cpu.findUnique).toHaveBeenCalledWith({
      where: { id: CPU_ID },
      select: CPU_DELETE_GUARD_SELECT,
    })
  })

  it('deletes a CPU by id with a minimal select contract', async () => {
    mockPrisma.cpu.delete.mockResolvedValueOnce({ id: CPU_ID })

    await repository.delete(CPU_ID)

    expect(mockPrisma.cpu.delete).toHaveBeenCalledWith({
      where: { id: CPU_ID },
      select: { id: true },
    })
  })

  it('returns CPU usage stats from PC report counts', async () => {
    mockPrisma.cpu.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2)

    await expect(repository.stats()).resolves.toEqual({
      total: 5,
      withListings: 3,
      withoutListings: 2,
    })

    expect(mockPrisma.cpu.count).toHaveBeenCalledWith({ where: { pcListings: { some: {} } } })
    expect(mockPrisma.cpu.count).toHaveBeenCalledWith({ where: { pcListings: { none: {} } } })
  })
})
