import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus, PcOs } from '@orm'
import { mobilePcListingsRouter } from './pcListings'

// Mock Prisma client
const mockPrisma = {
  pcListing: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
}

// Mock context
const mockContext = {
  prisma: mockPrisma,
  session: {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    },
  },
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
  cpu: sampleCpu,
  gpu: sampleGpu,
}

describe('mobilePcListingsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPcListings', () => {
    it('should return PC listings with pagination', async () => {
      const listings = [samplePcListing]
      mockPrisma.pcListing.findMany.mockResolvedValue(listings)
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.getPcListings({
        page: 1,
        limit: 10,
      })

      expect(result.listings).toHaveLength(1)
      expect(result.listings[0].verificationCount).toBe(1)
      expect(result.listings[0].reportCount).toBe(0)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.pages).toBe(1)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPreviousPage).toBe(false)
    })

    it('should filter by game ID', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.getPcListings({
        page: 1,
        limit: 10,
        gameId: 'game-123',
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          gameId: 'game-123',
          status: ApprovalStatus.APPROVED,
          game: { status: ApprovalStatus.APPROVED },
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should filter by CPU ID', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.getPcListings({
        page: 1,
        limit: 10,
        cpuId: 'cpu-123',
      })

      expect(mockPrisma.pcListing.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          cpuId: 'cpu-123',
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      })
    })

    it('should filter by search term in game title', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.getPcListings({
        page: 1,
        limit: 10,
        search: 'Test',
      })

      expect(result.listings).toHaveLength(1)
      expect(result.listings[0].game.title).toContain('Test')
    })

    it('should filter by search term in notes', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([samplePcListing])
      mockPrisma.pcListing.count.mockResolvedValue(1)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.getPcListings({
        page: 1,
        limit: 10,
        search: 'notes',
      })

      expect(result.listings).toHaveLength(1)
      expect(result.listings[0].notes).toContain('notes')
    })

    it('should handle empty results', async () => {
      mockPrisma.pcListing.findMany.mockResolvedValue([])
      mockPrisma.pcListing.count.mockResolvedValue(0)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.getPcListings({
        page: 1,
        limit: 10,
      })

      expect(result.listings).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.pages).toBe(0)
    })
  })

  describe('createPcListing', () => {
    it('should create a new PC listing', async () => {
      const createdListing = {
        ...samplePcListing,
        status: ApprovalStatus.PENDING,
      }
      mockPrisma.pcListing.create.mockResolvedValue(createdListing)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.createPcListing({
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
    })

    it('should create PC listing with custom field values', async () => {
      const createdListing = {
        ...samplePcListing,
        status: ApprovalStatus.PENDING,
      }
      mockPrisma.pcListing.create.mockResolvedValue(createdListing)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.createPcListing({
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

  describe('updatePcListing', () => {
    it('should update PC listing when user owns it', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'user-123',
      })
      mockPrisma.pcListing.update.mockResolvedValue(samplePcListing)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.updatePcListing({
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

    it('should return error when listing not found', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue(null)

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.updatePcListing({
        id: 'nonexistent',
        notes: 'Updated notes',
      })

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
          }),
        }),
      )
    })

    it('should return error when user does not own listing', async () => {
      mockPrisma.pcListing.findUnique.mockResolvedValue({
        authorId: 'other-user-456',
      })

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.updatePcListing({
        id: 'pc-listing-123',
        notes: 'Updated notes',
      })

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'FORBIDDEN',
          }),
        }),
      )
    })
  })

  describe('getCpus', () => {
    it('should return CPUs with brand information', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([sampleCpu])

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.getCpus({ limit: 10 })

      expect(result.cpus).toHaveLength(1)
      expect(result.cpus[0]).toEqual(sampleCpu)
      expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
        where: {},
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should filter CPUs by search term', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([sampleCpu])

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.getCpus({ limit: 10, search: 'intel' })

      expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { modelName: { contains: 'intel', mode: 'insensitive' } },
            { brand: { name: { contains: 'intel', mode: 'insensitive' } } },
          ],
        },
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should filter CPUs by brand ID', async () => {
      mockPrisma.cpu.findMany.mockResolvedValue([sampleCpu])

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.getCpus({ limit: 10, brandId: 'brand-123' })

      expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith({
        where: {
          brandId: 'brand-123',
        },
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })
  })

  describe('getGpus', () => {
    it('should return GPUs with brand information', async () => {
      mockPrisma.gpu.findMany.mockResolvedValue([sampleGpu])

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      const result = await caller.getGpus({ limit: 10 })

      expect(result.gpus).toHaveLength(1)
      expect(result.gpus[0]).toEqual(sampleGpu)
      expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
        where: {},
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })

    it('should filter GPUs by search term', async () => {
      mockPrisma.gpu.findMany.mockResolvedValue([sampleGpu])

      const caller = mobilePcListingsRouter.createCaller(mockContext)
      await caller.getGpus({ limit: 10, search: 'rtx' })

      expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { modelName: { contains: 'rtx', mode: 'insensitive' } },
            { brand: { name: { contains: 'rtx', mode: 'insensitive' } } },
          ],
        },
        take: 10,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })
    })
  })

  describe('presets', () => {
    describe('get', () => {
      it('should return user PC presets', async () => {
        mockPrisma.userPcPreset.findMany.mockResolvedValue([samplePcPreset])

        const caller = mobilePcListingsRouter.createCaller(mockContext)
        const result = await caller.presets.get({ limit: 10 })

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

    describe('create', () => {
      it('should create a new PC preset', async () => {
        mockPrisma.userPcPreset.create.mockResolvedValue(samplePcPreset)

        const caller = mobilePcListingsRouter.createCaller(mockContext)
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

    describe('update', () => {
      it('should update PC preset when user owns it', async () => {
        mockPrisma.userPcPreset.findUnique.mockResolvedValue({
          userId: 'user-123',
        })
        mockPrisma.userPcPreset.update.mockResolvedValue(samplePcPreset)

        const caller = mobilePcListingsRouter.createCaller(mockContext)
        await caller.presets.update({
          id: 'preset-123',
          name: 'Updated Gaming PC',
          memorySize: 64,
        })

        expect(mockPrisma.userPcPreset.update).toHaveBeenCalledWith({
          where: { id: 'preset-123' },
          data: {
            name: 'Updated Gaming PC',
            memorySize: 64,
          },
          include: {
            cpu: { include: { brand: { select: { id: true, name: true } } } },
            gpu: { include: { brand: { select: { id: true, name: true } } } },
          },
        })
      })

      it('should return error when preset not found', async () => {
        mockPrisma.userPcPreset.findUnique.mockResolvedValue(null)

        const caller = mobilePcListingsRouter.createCaller(mockContext)
        const result = await caller.presets.update({
          id: 'nonexistent',
          name: 'Updated name',
        })

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'NOT_FOUND',
            }),
          }),
        )
      })

      it('should return error when user does not own preset', async () => {
        mockPrisma.userPcPreset.findUnique.mockResolvedValue({
          userId: 'other-user-456',
        })

        const caller = mobilePcListingsRouter.createCaller(mockContext)
        const result = await caller.presets.update({
          id: 'preset-123',
          name: 'Updated name',
        })

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'FORBIDDEN',
            }),
          }),
        )
      })
    })

    describe('delete', () => {
      it('should delete PC preset when user owns it', async () => {
        mockPrisma.userPcPreset.findUnique.mockResolvedValue({
          userId: 'user-123',
        })
        mockPrisma.userPcPreset.delete.mockResolvedValue(samplePcPreset)

        const caller = mobilePcListingsRouter.createCaller(mockContext)
        const result = await caller.presets.delete({
          id: 'preset-123',
        })

        expect(mockPrisma.userPcPreset.delete).toHaveBeenCalledWith({
          where: { id: 'preset-123' },
        })
        expect(result).toEqual(samplePcPreset)
      })

      it('should return error when preset not found', async () => {
        mockPrisma.userPcPreset.findUnique.mockResolvedValue(null)

        const caller = mobilePcListingsRouter.createCaller(mockContext)
        const result = await caller.presets.delete({
          id: 'nonexistent',
        })

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'NOT_FOUND',
            }),
          }),
        )
      })

      it('should return error when user does not own preset', async () => {
        mockPrisma.userPcPreset.findUnique.mockResolvedValue({
          userId: 'other-user-456',
        })

        const caller = mobilePcListingsRouter.createCaller(mockContext)
        const result = await caller.presets.delete({
          id: 'preset-123',
        })

        expect(result).toEqual(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'FORBIDDEN',
            }),
          }),
        )
      })
    })
  })
})
