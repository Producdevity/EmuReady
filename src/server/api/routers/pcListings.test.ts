import { TRPCError } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus, PcOs, ReportReason, ReportStatus } from '@orm'
import { pcListingsRouter } from './pcListings'
import type { PrismaClient } from '@orm'

// Mock Prisma client
const mockPrisma = {
  pcListing: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  userPcPreset: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  cpu: {
    findMany: vi.fn(),
  },
  gpu: {
    findMany: vi.fn(),
  },
  pcListingReport: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  pcListingDeveloperVerification: {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient

// Mock context with authenticated user
const mockUserContext = {
  prisma: mockPrisma,
  session: {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
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
const samplePcListing = {
  id: 'pc-listing-123',
  gameId: 'game-123',
  emulatorId: 'emulator-123',
  performanceId: 1,
  notes: 'Test notes',
  authorId: 'user-123',
  memorySize: 16,
  cpuId: 'cpu-123',
  gpuId: 'gpu-123',
  os: PcOs.WINDOWS,
  osVersion: '11',
  status: ApprovalStatus.APPROVED,
  createdAt: new Date(),
  updatedAt: new Date(),
  processedAt: null,
  processedNotes: null,
  processedByUserId: null,
  game: {
    id: 'game-123',
    title: 'Test Game',
    status: ApprovalStatus.APPROVED,
    system: {
      id: 'system-123',
      name: 'Test System',
      key: 'test-system',
    },
  },
  cpu: {
    id: 'cpu-123',
    modelName: 'Test CPU',
    brand: {
      id: 'brand-123',
      name: 'Intel',
    },
  },
  gpu: {
    id: 'gpu-123',
    modelName: 'Test GPU',
    brand: {
      id: 'brand-456',
      name: 'NVIDIA',
    },
  },
  emulator: {
    id: 'emulator-123',
    name: 'Test Emulator',
    logo: 'test-logo.png',
  },
  performance: {
    id: 1,
    label: 'Perfect',
    rank: 5,
  },
  author: {
    id: 'user-123',
    name: 'Test User',
  },
  _count: {
    reports: 0,
    developerVerifications: 1,
  },
}

const samplePcPreset = {
  id: 'preset-123',
  userId: 'user-123',
  name: 'Gaming PC',
  cpuId: 'cpu-123',
  gpuId: 'gpu-123',
  memorySize: 32,
  os: PcOs.WINDOWS,
  osVersion: '11',
  createdAt: new Date(),
  updatedAt: new Date(),
  cpu: {
    id: 'cpu-123',
    modelName: 'Intel Core i7-12700K',
    brand: { id: 'brand-123', name: 'Intel' },
  },
  gpu: {
    id: 'gpu-123',
    modelName: 'GeForce RTX 3080',
    brand: { id: 'brand-456', name: 'NVIDIA' },
  },
}

describe('pcListingsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll (public)', () => {
    it('should return PC listings with pagination', async () => {
      const listings = [samplePcListing]
      mockPrisma.pcListing.findMany.mockResolvedValue(listings)
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      const result = await caller.getAll({
        page: 1,
        limit: 10,
      })

      expect(result.listings).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.pages).toBe(1)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPreviousPage).toBe(false)
    })

    it('should filter by game IDs', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      await caller.getAll({
        page: 1,
        limit: 10,
        gameIds: ['game-123', 'game-456'],
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          gameId: { in: ['game-123', 'game-456'] },
          status: ApprovalStatus.APPROVED,
          game: { status: ApprovalStatus.APPROVED },
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should filter by CPU IDs', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      await caller.getAll({
        page: 1,
        limit: 10,
        cpuIds: ['cpu-123'],
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          cpuId: { in: ['cpu-123'] },
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should filter by GPU IDs', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      await caller.getAll({
        page: 1,
        limit: 10,
        gpuIds: ['gpu-123'],
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          gpuId: { in: ['gpu-123'] },
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should filter by operating systems', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      await caller.getAll({
        page: 1,
        limit: 10,
        operatingSystems: [PcOs.WINDOWS, PcOs.LINUX],
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          os: { in: [PcOs.WINDOWS, PcOs.LINUX] },
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should filter by performance IDs', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      await caller.getAll({
        page: 1,
        limit: 10,
        performanceIds: [1, 2, 3],
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          performanceId: { in: [1, 2, 3] },
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should sort by different fields', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      await caller.getAll({
        page: 1,
        limit: 10,
        sortBy: 'performance',
        sortOrder: 'desc',
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { performance: { rank: 'desc' } },
        include: expect.any(Object),
      })
    })

    it('should handle empty results', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([])
      mockPrisma.pcListing.count.mockResolvedValue(0)

      const caller = pcListingsRouter.createCaller(mockPublicContext)
      const result = await caller.getAll({
        page: 1,
        limit: 10,
      })

      expect(result.listings).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.pages).toBe(0)
    })
  })

  describe('create (protected)', () => {
    it('should create a new PC listing', async () => {
      const createdListing = {
        ...samplePcListing,
        status: ApprovalStatus.PENDING,
      }
      mockPrisma.pcListing.create.mockResolvedValue(createdListing)

      const caller = pcListingsRouter.createCaller(mockUserContext)
      const result = await caller.create({
        gameId: 'game-123',
        emulatorId: 'emulator-123',
        performanceId: 1,
        notes: 'Test notes',
        memorySize: 16,
        cpuId: 'cpu-123',
        gpuId: 'gpu-123',
        os: PcOs.WINDOWS,
        osVersion: '11',
      })

      expect(mockPrisma.pcListing.create).toHaveBeenCalledWith({
        data: {
          gameId: 'game-123',
          emulatorId: 'emulator-123',
          performanceId: 1,
          notes: 'Test notes',
          memorySize: 16,
          cpuId: 'cpu-123',
          gpuId: 'gpu-123',
          os: PcOs.WINDOWS,
          osVersion: '11',
          authorId: 'user-123',
          status: ApprovalStatus.PENDING,
          customFieldValues: undefined,
        },
        include: expect.any(Object),
      })

      expect(result.status).toBe(ApprovalStatus.PENDING)
    })

    it('should create PC listing with custom field values', async () => {
      const createdListing = {
        ...samplePcListing,
        status: ApprovalStatus.PENDING,
      }
      mockPrisma.pcListing.create.mockResolvedValue(createdListing)

      const caller = pcListingsRouter.createCaller(mockUserContext)
      await caller.create({
        gameId: 'game-123',
        emulatorId: 'emulator-123',
        performanceId: 1,
        notes: 'Test notes',
        memorySize: 16,
        cpuId: 'cpu-123',
        gpuId: 'gpu-123',
        os: PcOs.WINDOWS,
        osVersion: '11',
        customFieldValues: [
          {
            customFieldDefinitionId: 'field-123',
            value: 'test-value',
          },
        ],
      })

      expect(mockPrisma.pcListing.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customFieldValues: {
            create: [
              {
                customFieldDefinitionId: 'field-123',
                value: 'test-value',
              },
            ],
          },
        }),
        include: expect.any(Object),
      })
    })
  })

  describe('update (protected)', () => {
    it('should update PC listing when user owns it', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'user-123',
      })
      mockPrisma.pcListing.update.mockResolvedValue(samplePcListing)

      const caller = pcListingsRouter.createCaller(mockUserContext)
      await caller.update({
        id: 'pc-listing-123',
        notes: 'Updated notes',
        memorySize: 32,
      })

      expect(mockPrisma.pcListing.update).toHaveBeenCalledWith({
        where: { id: 'pc-listing-123' },
        data: expect.objectContaining({
          notes: 'Updated notes',
          memorySize: 32,
        }),
        include: expect.any(Object),
      })
    })

    it('should throw error when listing not found', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue(null)

      const caller = pcListingsRouter.createCaller(mockUserContext)

      await expect(
        caller.update({
          id: 'nonexistent',
          notes: 'Updated notes',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should throw error when user does not own listing', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'other-user-456',
      })

      const caller = pcListingsRouter.createCaller(mockUserContext)

      await expect(
        caller.update({
          id: 'pc-listing-123',
          notes: 'Updated notes',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('delete (protected)', () => {
    it('should delete PC listing when user owns it', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'user-123',
      })
      mockPrisma.pcListing.delete.mockResolvedValue(samplePcListing)

      const caller = pcListingsRouter.createCaller(mockUserContext)
      const result = await caller.delete({
        id: 'pc-listing-123',
      })

      expect(mockPrisma.pcListing.delete).toHaveBeenCalledWith({
        where: { id: 'pc-listing-123' },
      })
      expect(result).toEqual({ success: true })
    })

    it('should throw error when listing not found', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue(null)

      const caller = pcListingsRouter.createCaller(mockUserContext)

      await expect(
        caller.delete({
          id: 'nonexistent',
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should throw error when user does not own listing', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'other-user-456',
      })

      const caller = pcListingsRouter.createCaller(mockUserContext)

      await expect(
        caller.delete({
          id: 'pc-listing-123',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('report (protected)', () => {
    it('should create a report for PC listing', async () => {
      const report = {
        id: 'report-123',
        pcListingId: 'pc-listing-123',
        reportedById: 'user-123',
        reason: ReportReason.SPAM,
        description: 'This is spam',
        status: ReportStatus.PENDING,
        createdAt: new Date(),
      }

      mockPrisma.pcListingReport.findUnique.mockResolvedValue(null)
      mockPrisma.pcListingReport.create.mockResolvedValue(report)

      const caller = pcListingsRouter.createCaller(mockUserContext)
      const result = await caller.report({
        pcListingId: 'pc-listing-123',
        reason: ReportReason.SPAM,
        description: 'This is spam',
      })

      expect(mockPrisma.pcListingReport.create).toHaveBeenCalledWith({
        data: {
          pcListingId: 'pc-listing-123',
          reportedById: 'user-123',
          reason: ReportReason.SPAM,
          description: 'This is spam',
        },
      })
      expect(result).toEqual(report)
    })

    it('should throw error if user already reported the listing', async () => {
      mockPrisma.pcListingReport.findUnique.mockResolvedValue({
        id: 'existing-report-123',
      })

      const caller = pcListingsRouter.createCaller(mockUserContext)

      await expect(
        caller.report({
          pcListingId: 'pc-listing-123',
          reason: ReportReason.SPAM,
          description: 'This is spam',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('verify (protected)', () => {
    it('should add developer verification', async () => {
      const verification = {
        id: 'verification-123',
        pcListingId: 'pc-listing-123',
        verifiedBy: 'user-123',
        verifiedAt: new Date(),
        notes: 'Verified working',
      }

      mockPrisma.pcListingDeveloperVerification.findUnique.mockResolvedValue(
        null,
      )
      mockPrisma.pcListingDeveloperVerification.create.mockResolvedValue(
        verification,
      )

      const caller = pcListingsRouter.createCaller(mockUserContext)
      const result = await caller.verify({
        pcListingId: 'pc-listing-123',
        notes: 'Verified working',
      })

      expect(
        mockPrisma.pcListingDeveloperVerification.create,
      ).toHaveBeenCalledWith({
        data: {
          pcListingId: 'pc-listing-123',
          verifiedBy: 'user-123',
          notes: 'Verified working',
        },
      })
      expect(result).toEqual(verification)
    })

    it('should throw error if user already verified the listing', async () => {
      mockPrisma.pcListingDeveloperVerification.findUnique.mockResolvedValue({
        id: 'existing-verification-123',
      })

      const caller = pcListingsRouter.createCaller(mockUserContext)

      await expect(
        caller.verify({
          pcListingId: 'pc-listing-123',
          notes: 'Verified working',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('unverify (protected)', () => {
    it('should remove developer verification', async () => {
      const verification = {
        id: 'verification-123',
        pcListingId: 'pc-listing-123',
        verifiedBy: 'user-123',
      }

      mockPrisma.pcListingDeveloperVerification.findUnique.mockResolvedValue(
        verification,
      )
      mockPrisma.pcListingDeveloperVerification.delete.mockResolvedValue(
        verification,
      )

      const caller = pcListingsRouter.createCaller(mockUserContext)
      const result = await caller.unverify({
        pcListingId: 'pc-listing-123',
      })

      expect(
        mockPrisma.pcListingDeveloperVerification.delete,
      ).toHaveBeenCalledWith({
        where: {
          pcListingId_verifiedBy: {
            pcListingId: 'pc-listing-123',
            verifiedBy: 'user-123',
          },
        },
      })
      expect(result).toEqual({ success: true })
    })

    it('should throw error if verification not found', async () => {
      mockPrisma.pcListingDeveloperVerification.findUnique.mockResolvedValue(
        null,
      )

      const caller = pcListingsRouter.createCaller(mockUserContext)

      await expect(
        caller.unverify({
          pcListingId: 'pc-listing-123',
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('PC Presets', () => {
    describe('presets.get (protected)', () => {
      it('should return user PC presets', async () => {
        mockPrisma.userPcPreset.findMany.mockResolvedValue([samplePcPreset])

        const caller = pcListingsRouter.createCaller(mockUserContext)
        const result = await caller.presets.get({
          limit: 10,
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(samplePcPreset)
        expect(mockPrisma.userPcPreset.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            cpu: { include: { brand: { select: { id: true, name: true } } } },
            gpu: { include: { brand: { select: { id: true, name: true } } } },
          },
        })
      })
    })

    describe('presets.create (protected)', () => {
      it('should create a new PC preset', async () => {
        mockPrisma.userPcPreset.create.mockResolvedValue(samplePcPreset)

        const caller = pcListingsRouter.createCaller(mockUserContext)
        const result = await caller.presets.create({
          name: 'Gaming PC',
          cpuId: 'cpu-123',
          gpuId: 'gpu-123',
          memorySize: 32,
          os: PcOs.WINDOWS,
          osVersion: '11',
        })

        expect(mockPrisma.userPcPreset.create).toHaveBeenCalledWith({
          data: {
            name: 'Gaming PC',
            cpuId: 'cpu-123',
            gpuId: 'gpu-123',
            memorySize: 32,
            os: PcOs.WINDOWS,
            osVersion: '11',
            userId: 'user-123',
          },
          include: {
            cpu: { include: { brand: { select: { id: true, name: true } } } },
            gpu: { include: { brand: { select: { id: true, name: true } } } },
          },
        })
        expect(result).toEqual(samplePcPreset)
      })
    })
  })
})
