import { TRPCError } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cpusRouter } from './cpus'
import type { PrismaClient } from '@orm'

// Mock Prisma client
const mockPrisma = {
  cpu: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  pcListing: {
    count: vi.fn(),
  },
} as unknown as PrismaClient

// Mock context with moderator user
const mockModeratorContext = {
  prisma: mockPrisma,
  session: {
    user: {
      id: 'moderator-123',
      name: 'Moderator User',
      email: 'moderator@example.com',
      role: 'MODERATOR',
    },
  },
}

// Mock context with regular user (for protected routes)
const mockUserContext = {
  prisma: mockPrisma,
  session: {
    user: {
      id: 'user-123',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'USER',
    },
  },
}

// Mock context for public routes
const mockPublicContext = {
  prisma: mockPrisma,
  session: null,
}

// Sample data
const sampleCpu = {
  id: 'cpu-123',
  brandId: 'brand-123',
  modelName: 'Intel Core i7-12700K',
  createdAt: new Date(),
  brand: {
    id: 'brand-123',
    name: 'Intel',
  },
}

const sampleCpuWithStats = {
  ...sampleCpu,
  _count: {
    pcListings: 5,
  },
}

describe('cpusRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get (public)', () => {
    it('should return CPUs with pagination', async () => {
      const cpus = [sampleCpu]
      mockPrisma.cpu.findMany.mockResolvedValue(cpus)
      mockPrisma.cpu.count.mockResolvedValue(1)

      const caller = cpusRouter.createCaller(mockPublicContext)
      const result = await caller.get({
        page: 1,
        limit: 10,
      })

      expect(result.cpus).toHaveLength(1)
      expect(result.cpus[0]).toEqual(sampleCpu)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.pages).toBe(1)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPreviousPage).toBe(false)
    })

    it('should filter CPUs by search term', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([sampleCpu])
      mockPrisma.cpu.count.mockResolvedValue(1)

      const caller = cpusRouter.createCaller(mockPublicContext)
      await caller.get({
        page: 1,
        limit: 10,
        search: 'intel',
      })

      expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { modelName: { contains: 'intel', mode: 'insensitive' } },
            { brand: { name: { contains: 'intel', mode: 'insensitive' } } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should filter CPUs by brand ID', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([sampleCpu])
      mockPrisma.cpu.count.mockResolvedValue(1)

      const caller = cpusRouter.createCaller(mockPublicContext)
      await caller.get({
        page: 1,
        limit: 10,
        brandId: 'brand-123',
      })

      expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
        where: {
          brandId: 'brand-123',
        },
        skip: 0,
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should sort CPUs by brand name', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([sampleCpu])
      mockPrisma.cpu.count.mockResolvedValue(1)

      const caller = cpusRouter.createCaller(mockPublicContext)
      await caller.get({
        page: 1,
        limit: 10,
        sortBy: 'brand',
        sortOrder: 'desc',
      })

      expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { brand: { name: 'desc' } },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should handle empty results', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([])
      mockPrisma.cpu.count.mockResolvedValue(0)

      const caller = cpusRouter.createCaller(mockPublicContext)
      const result = await caller.get({
        page: 1,
        limit: 10,
      })

      expect(result.cpus).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.pages).toBe(0)
    })
  })

  describe('create (moderator only)', () => {
    it('should create a new CPU as moderator', async () => {
      mockPrisma.cpu.create.mockResolvedValue(sampleCpu)

      const caller = cpusRouter.createCaller(mockModeratorContext)
      const result = await caller.create({
        brandId: 'brand-123',
        modelName: 'Intel Core i7-12700K',
      })

      expect(mockPrisma.cpu.create).toHaveBeenCalledWith({
        data: {
          brandId: 'brand-123',
          modelName: 'Intel Core i7-12700K',
        },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
      expect(result).toEqual(sampleCpu)
    })

    it('should throw error for duplicate CPU', async () => {
      const prismaError = new Error('Unique constraint failed')
      prismaError.code = 'P2002'
      mockPrisma.cpu.create.mockRejectedValue(prismaError)

      const caller = cpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.create({
          brandId: 'brand-123',
          modelName: 'Intel Core i7-12700K',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should require moderator role', async () => {
      const caller = cpusRouter.createCaller(mockUserContext)

      await expect(
        caller.create({
          brandId: 'brand-123',
          modelName: 'Intel Core i7-12700K',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('update (moderator only)', () => {
    it('should update CPU as moderator', async () => {
      const updatedCpu = { ...sampleCpu, modelName: 'Intel Core i7-12700KF' }
      mockPrisma.cpu.findUnique.mockResolvedValue(sampleCpu)
      mockPrisma.cpu.update.mockResolvedValue(updatedCpu)

      const caller = cpusRouter.createCaller(mockModeratorContext)
      const result = await caller.update({
        id: 'cpu-123',
        modelName: 'Intel Core i7-12700KF',
      })

      expect(mockPrisma.cpu.update).toHaveBeenCalledWith({
        where: { id: 'cpu-123' },
        data: {
          modelName: 'Intel Core i7-12700KF',
        },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
      expect(result).toEqual(updatedCpu)
    })

    it('should throw error when CPU not found', async () => {
      mockPrisma.cpu.findUnique.mockResolvedValue(null)

      const caller = cpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.update({
          id: 'nonexistent',
          modelName: 'New name',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should require moderator role', async () => {
      const caller = cpusRouter.createCaller(mockUserContext)

      await expect(
        caller.update({
          id: 'cpu-123',
          modelName: 'New name',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('delete (moderator only)', () => {
    it('should delete CPU when no listings exist', async () => {
      mockPrisma.cpu.findUnique.mockResolvedValue(sampleCpu)
      mockPrisma.pcListing.count.mockResolvedValue(0)
      mockPrisma.cpu.delete.mockResolvedValue(sampleCpu)

      const caller = cpusRouter.createCaller(mockModeratorContext)
      const result = await caller.delete({
        id: 'cpu-123',
      })

      expect(mockPrisma.cpu.delete).toHaveBeenCalledWith({
        where: { id: 'cpu-123' },
      })
      expect(result).toEqual({ success: true })
    })

    it('should throw error when CPU has associated listings', async () => {
      mockPrisma.cpu.findUnique.mockResolvedValue(sampleCpu)
      mockPrisma.pcListing.count.mockResolvedValue(5) // Has listings

      const caller = cpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.delete({
          id: 'cpu-123',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should throw error when CPU not found', async () => {
      mockPrisma.cpu.findUnique.mockResolvedValue(null)

      const caller = cpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.delete({
          id: 'nonexistent',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should require moderator role', async () => {
      const caller = cpusRouter.createCaller(mockUserContext)

      await expect(
        caller.delete({
          id: 'cpu-123',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('stats (moderator only)', () => {
    it('should return CPU statistics', async () => {
      mockPrisma.cpu.count.mockResolvedValue(150)
      mockPrisma.cpu.findMany
        .mockResolvedValueOnce([
          { brand: { name: 'Intel' }, _count: { id: 100 } },
          { brand: { name: 'AMD' }, _count: { id: 50 } },
        ])
        .mockResolvedValueOnce([sampleCpuWithStats])

      const caller = cpusRouter.createCaller(mockModeratorContext)
      const result = await caller.stats()

      expect(result.totalCpus).toBe(150)
      expect(result.cpusByBrand).toHaveLength(2)
      expect(result.cpusByBrand[0]).toEqual({ name: 'Intel', count: 100 })
      expect(result.recentCpus).toHaveLength(1)
    })

    it('should require moderator role', async () => {
      const caller = cpusRouter.createCaller(mockUserContext)

      await expect(caller.stats()).rejects.toThrow(TRPCError)
    })
  })

  describe('getById (public)', () => {
    it('should return CPU by ID', async () => {
      mockPrisma.cpu.findUnique.mockResolvedValue(sampleCpu)

      const caller = cpusRouter.createCaller(mockPublicContext)
      const result = await caller.getById({
        id: 'cpu-123',
      })

      expect(mockPrisma.cpu.findUnique).toHaveBeenCalledWith({
        where: { id: 'cpu-123' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
      expect(result).toEqual(sampleCpu)
    })

    it('should throw error when CPU not found', async () => {
      mockPrisma.cpu.findUnique.mockResolvedValue(null)

      const caller = cpusRouter.createCaller(mockPublicContext)

      await expect(
        caller.getById({
          id: 'nonexistent',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('search (public)', () => {
    it('should return search results', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([sampleCpu])

      const caller = cpusRouter.createCaller(mockPublicContext)
      const result = await caller.search({
        query: 'intel',
        limit: 5,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(sampleCpu)
      expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { modelName: { contains: 'intel', mode: 'insensitive' } },
            { brand: { name: { contains: 'intel', mode: 'insensitive' } } },
          ],
        },
        take: 5,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should handle empty search results', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([])

      const caller = cpusRouter.createCaller(mockPublicContext)
      const result = await caller.search({
        query: 'nonexistent',
        limit: 5,
      })

      expect(result).toHaveLength(0)
    })
  })
})
