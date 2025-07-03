import { TRPCError } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gpusRouter } from './gpus'
import type { PrismaClient } from '@orm'

// Mock Prisma client
const mockPrisma = {
  gpu: {
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
const sampleGpu = {
  id: 'gpu-123',
  brandId: 'brand-456',
  modelName: 'GeForce RTX 3080',
  createdAt: new Date(),
  brand: {
    id: 'brand-456',
    name: 'NVIDIA',
  },
}

const sampleGpuWithStats = {
  ...sampleGpu,
  _count: {
    pcListings: 8,
  },
}

describe('gpusRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get (public)', () => {
    it('should return GPUs with pagination', async () => {
      const gpus = [sampleGpu]
      mockPrisma.gpu.findMany.mockResolvedValue(gpus)
      mockPrisma.gpu.count.mockResolvedValue(1)

      const caller = gpusRouter.createCaller(mockPublicContext)
      const result = await caller.get({
        page: 1,
        limit: 10,
      })

      expect(result.gpus).toHaveLength(1)
      expect(result.gpus[0]).toEqual(sampleGpu)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.pages).toBe(1)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPreviousPage).toBe(false)
    })

    it('should filter GPUs by search term', async () => {
      mockPrisma.gpu.findMany.mockResolvedValue([sampleGpu])
      mockPrisma.gpu.count.mockResolvedValue(1)

      const caller = gpusRouter.createCaller(mockPublicContext)
      await caller.get({
        page: 1,
        limit: 10,
        search: 'rtx',
      })

      expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { modelName: { contains: 'rtx', mode: 'insensitive' } },
            { brand: { name: { contains: 'rtx', mode: 'insensitive' } } },
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

    it('should filter GPUs by brand ID', async () => {
      mockPrisma.gpu.findMany.mockResolvedValue([sampleGpu])
      mockPrisma.gpu.count.mockResolvedValue(1)

      const caller = gpusRouter.createCaller(mockPublicContext)
      await caller.get({
        page: 1,
        limit: 10,
        brandId: 'brand-456',
      })

      expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
        where: {
          brandId: 'brand-456',
        },
        skip: 0,
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should sort GPUs by brand name', async () => {
      mockPrisma.gpu.findMany.mockResolvedValue([sampleGpu])
      mockPrisma.gpu.count.mockResolvedValue(1)

      const caller = gpusRouter.createCaller(mockPublicContext)
      await caller.get({
        page: 1,
        limit: 10,
        sortBy: 'brand',
        sortOrder: 'desc',
      })

      expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
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
      mockPrisma.gpu.findMany.mockResolvedValue([])
      mockPrisma.gpu.count.mockResolvedValue(0)

      const caller = gpusRouter.createCaller(mockPublicContext)
      const result = await caller.get({
        page: 1,
        limit: 10,
      })

      expect(result.gpus).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.pages).toBe(0)
    })
  })

  describe('create (moderator only)', () => {
    it('should create a new GPU as moderator', async () => {
      mockPrisma.gpu.create.mockResolvedValue(sampleGpu)

      const caller = gpusRouter.createCaller(mockModeratorContext)
      const result = await caller.create({
        brandId: 'brand-456',
        modelName: 'GeForce RTX 3080',
      })

      expect(mockPrisma.gpu.create).toHaveBeenCalledWith({
        data: {
          brandId: 'brand-456',
          modelName: 'GeForce RTX 3080',
        },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
      expect(result).toEqual(sampleGpu)
    })

    it('should throw error for duplicate GPU', async () => {
      const prismaError = new Error('Unique constraint failed')
      prismaError.code = 'P2002'
      mockPrisma.gpu.create.mockRejectedValue(prismaError)

      const caller = gpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.create({
          brandId: 'brand-456',
          modelName: 'GeForce RTX 3080',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should require moderator role', async () => {
      const caller = gpusRouter.createCaller(mockUserContext)

      await expect(
        caller.create({
          brandId: 'brand-456',
          modelName: 'GeForce RTX 3080',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('update (moderator only)', () => {
    it('should update GPU as moderator', async () => {
      const updatedGpu = { ...sampleGpu, modelName: 'GeForce RTX 3080 Ti' }
      mockPrisma.gpu.findUnique.mockResolvedValue(sampleGpu)
      mockPrisma.gpu.update.mockResolvedValue(updatedGpu)

      const caller = gpusRouter.createCaller(mockModeratorContext)
      const result = await caller.update({
        id: 'gpu-123',
        modelName: 'GeForce RTX 3080 Ti',
      })

      expect(mockPrisma.gpu.update).toHaveBeenCalledWith({
        where: { id: 'gpu-123' },
        data: {
          modelName: 'GeForce RTX 3080 Ti',
        },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
      expect(result).toEqual(updatedGpu)
    })

    it('should throw error when GPU not found', async () => {
      mockPrisma.gpu.findUnique.mockResolvedValue(null)

      const caller = gpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.update({
          id: 'nonexistent',
          modelName: 'New name',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should require moderator role', async () => {
      const caller = gpusRouter.createCaller(mockUserContext)

      await expect(
        caller.update({
          id: 'gpu-123',
          modelName: 'New name',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('delete (moderator only)', () => {
    it('should delete GPU when no listings exist', async () => {
      mockPrisma.gpu.findUnique.mockResolvedValue(sampleGpu)
      mockPrisma.pcListing.count.mockResolvedValue(0)
      mockPrisma.gpu.delete.mockResolvedValue(sampleGpu)

      const caller = gpusRouter.createCaller(mockModeratorContext)
      const result = await caller.delete({
        id: 'gpu-123',
      })

      expect(mockPrisma.gpu.delete).toHaveBeenCalledWith({
        where: { id: 'gpu-123' },
      })
      expect(result).toEqual({ success: true })
    })

    it('should throw error when GPU has associated listings', async () => {
      mockPrisma.gpu.findUnique.mockResolvedValue(sampleGpu)
      mockPrisma.pcListing.count.mockResolvedValue(8) // Has listings

      const caller = gpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.delete({
          id: 'gpu-123',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should throw error when GPU not found', async () => {
      mockPrisma.gpu.findUnique.mockResolvedValue(null)

      const caller = gpusRouter.createCaller(mockModeratorContext)

      await expect(
        caller.delete({
          id: 'nonexistent',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should require moderator role', async () => {
      const caller = gpusRouter.createCaller(mockUserContext)

      await expect(
        caller.delete({
          id: 'gpu-123',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('stats (moderator only)', () => {
    it('should return GPU statistics', async () => {
      mockPrisma.gpu.count.mockResolvedValue(200)
      mockPrisma.gpu.findMany
        .mockResolvedValueOnce([
          { brand: { name: 'NVIDIA' }, _count: { id: 120 } },
          { brand: { name: 'AMD' }, _count: { id: 80 } },
        ])
        .mockResolvedValueOnce([sampleGpuWithStats])

      const caller = gpusRouter.createCaller(mockModeratorContext)
      const result = await caller.stats()

      expect(result.totalGpus).toBe(200)
      expect(result.gpusByBrand).toHaveLength(2)
      expect(result.gpusByBrand[0]).toEqual({ name: 'NVIDIA', count: 120 })
      expect(result.recentGpus).toHaveLength(1)
    })

    it('should require moderator role', async () => {
      const caller = gpusRouter.createCaller(mockUserContext)

      await expect(caller.stats()).rejects.toThrow(TRPCError)
    })
  })

  describe('getById (public)', () => {
    it('should return GPU by ID', async () => {
      mockPrisma.gpu.findUnique.mockResolvedValue(sampleGpu)

      const caller = gpusRouter.createCaller(mockPublicContext)
      const result = await caller.getById({
        id: 'gpu-123',
      })

      expect(mockPrisma.gpu.findUnique).toHaveBeenCalledWith({
        where: { id: 'gpu-123' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
      expect(result).toEqual(sampleGpu)
    })

    it('should throw error when GPU not found', async () => {
      mockPrisma.gpu.findUnique.mockResolvedValue(null)

      const caller = gpusRouter.createCaller(mockPublicContext)

      await expect(
        caller.getById({
          id: 'nonexistent',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('search (public)', () => {
    it('should return search results', async () => {
      mockPrisma.gpu.findMany.mockResolvedValue([sampleGpu])

      const caller = gpusRouter.createCaller(mockPublicContext)
      const result = await caller.search({
        query: 'rtx',
        limit: 5,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(sampleGpu)
      expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { modelName: { contains: 'rtx', mode: 'insensitive' } },
            { brand: { name: { contains: 'rtx', mode: 'insensitive' } } },
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
      mockPrisma.gpu.findMany.mockResolvedValue([])

      const caller = gpusRouter.createCaller(mockPublicContext)
      const result = await caller.search({
        query: 'nonexistent',
        limit: 5,
      })

      expect(result).toHaveLength(0)
    })
  })
})
