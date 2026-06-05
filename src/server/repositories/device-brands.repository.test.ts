import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type PrismaClient } from '@orm/client'
import { DeviceBrandsRepository } from './device-brands.repository'

vi.mock('@orm/client', async () => {
  const actual = await import('@orm/client')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

function createMockPrisma() {
  return {
    deviceBrand: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  } as unknown as PrismaClient
}

describe('DeviceBrandsRepository', () => {
  let prisma: PrismaClient
  let repository: DeviceBrandsRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repository = new DeviceBrandsRepository(prisma)
  })

  it('filters brands to CPU-backed brands when category is cpu', async () => {
    await repository.list({ category: 'cpu', search: 'in', limit: 10 })

    expect(prisma.deviceBrand.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: 'in', mode: 'insensitive' },
          cpus: { some: {} },
        },
        take: 10,
      }),
    )
  })

  it('filters brands to GPU-backed brands when category is gpu', async () => {
    await repository.list({ category: 'gpu' })

    expect(prisma.deviceBrand.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          gpus: { some: {} },
        },
      }),
    )
  })

  it('uses the default limit when no limit is provided', async () => {
    await repository.list()

    expect(prisma.deviceBrand.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      }),
    )
  })

  it('allows callers to disable the default limit', async () => {
    await repository.list({}, { defaultLimit: undefined })

    expect(prisma.deviceBrand.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: undefined,
      }),
    )
  })

  it('uses the same category filter when counting brands', async () => {
    await repository.count({ category: 'cpu' })

    expect(prisma.deviceBrand.count).toHaveBeenCalledWith({
      where: {
        cpus: { some: {} },
      },
    })
  })
})
