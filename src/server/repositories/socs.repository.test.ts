import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@orm/client'
import { SoCsRepository } from './socs.repository'
import type * as OrmClient from '@orm/client'

vi.mock('@orm/client', async () => {
  const actual = await vi.importActual<typeof OrmClient>('@orm/client')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
    PrismaClient: vi.fn().mockImplementation(function MockPrismaClient() {
      return {
        soC: {
          count: vi.fn(),
          findMany: vi.fn(),
        },
      }
    }),
  }
})

const mockSoc = {
  id: 'soc-1',
  name: 'Snapdragon 8 Gen 3',
  manufacturer: 'Qualcomm',
  architecture: 'ARM64',
  processNode: '4nm',
  cpuCores: 8,
  gpuModel: 'Adreno 750',
  _count: { devices: 3 },
}

function createMockPrisma() {
  const prisma = new PrismaClient()
  vi.mocked(prisma.soC.count).mockResolvedValue(42)
  vi.mocked(prisma.soC.findMany).mockResolvedValue([mockSoc] as never)
  return prisma
}

type MockPrisma = ReturnType<typeof createMockPrisma>

describe('SoCsRepository', () => {
  let prisma: MockPrisma
  let repository: SoCsRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repository = new SoCsRepository(prisma)
  })

  describe('list', () => {
    it('calculates database offset from page input', async () => {
      const result = await repository.list({ page: 3, limit: 10 })

      expect(prisma.soC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
          orderBy: { name: 'asc' },
        }),
      )
      expect(result.socs).toEqual([mockSoc])
      expect(result.pagination).toEqual(
        expect.objectContaining({
          total: 42,
          page: 3,
          limit: 10,
          offset: 20,
        }),
      )
    })

    it('uses offset input when page is not provided', async () => {
      const result = await repository.list({ offset: 15, limit: 5 })

      expect(prisma.soC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 5,
        }),
      )
      expect(result.pagination).toEqual(
        expect.objectContaining({
          page: 4,
          offset: 15,
          limit: 5,
        }),
      )
    })

    it('lets page input take precedence over offset input', async () => {
      await repository.list({ page: 2, offset: 75, limit: 10 })

      expect(prisma.soC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      )
    })

    it('applies search filters and devices count sorting to both queries', async () => {
      await repository.list({
        search: 'snapdragon',
        sortField: 'devicesCount',
        sortDirection: 'desc',
        limit: 20,
        page: 1,
      })

      const where = {
        OR: [
          { name: { contains: 'snapdragon', mode: 'insensitive' } },
          { manufacturer: { contains: 'snapdragon', mode: 'insensitive' } },
          { architecture: { contains: 'snapdragon', mode: 'insensitive' } },
          { gpuModel: { contains: 'snapdragon', mode: 'insensitive' } },
        ],
      }

      expect(prisma.soC.count).toHaveBeenCalledWith({ where })
      expect(prisma.soC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
          orderBy: { devices: { _count: 'desc' } },
          skip: 0,
          take: 20,
        }),
      )
    })
  })
})
