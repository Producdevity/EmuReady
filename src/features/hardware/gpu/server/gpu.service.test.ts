import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGINATION } from '@/data/constants'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm/client'
import { GpuRepository } from './gpu.repository'
import { GpuService } from './gpu.service'
import type { GpuDetailRecord, GpuMobileListRecord } from './gpu.repository.types'
import type { Actor } from '@/server/auth/actor'

const GPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

const gpuWithCounts = {
  id: GPU_ID,
  modelName: 'GeForce RTX 4090',
  brand: { id: BRAND_ID, name: 'NVIDIA' },
  _count: { pcListings: 4 },
} satisfies GpuDetailRecord

const mobileGpuRecord = {
  id: GPU_ID,
  brandId: BRAND_ID,
  modelName: 'GeForce RTX 4090',
  createdAt: CREATED_AT,
  brand: { id: BRAND_ID, name: 'NVIDIA' },
  _count: { pcListings: 4 },
} satisfies GpuMobileListRecord

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

function createActor(permissions: string[]): Actor {
  return {
    type: 'user',
    userId: 'user-id',
    role: Role.ADMIN,
    permissions,
    showNsfw: false,
  }
}

function createMockRepository() {
  const repository = new GpuRepository(prisma)

  return {
    repository,
    byIdWithCounts: vi.spyOn(repository, 'byIdWithCounts'),
    byIdMobileCompatibility: vi.spyOn(repository, 'byIdMobileCompatibility'),
    create: vi.spyOn(repository, 'create'),
    delete: vi.spyOn(repository, 'delete'),
    findDeleteGuardById: vi.spyOn(repository, 'findDeleteGuardById'),
    findModelNameConflict: vi.spyOn(repository, 'findModelNameConflict'),
    list: vi.spyOn(repository, 'list'),
    listByIds: vi.spyOn(repository, 'listByIds'),
    listMobileCompatibility: vi.spyOn(repository, 'listMobileCompatibility'),
    options: vi.spyOn(repository, 'options'),
    pcListingMobileGpuCompatibility: vi.spyOn(repository, 'pcListingMobileGpuCompatibility'),
    stats: vi.spyOn(repository, 'stats'),
    update: vi.spyOn(repository, 'update'),
  }
}

type MockGpuRepository = ReturnType<typeof createMockRepository>

function createService(repository: MockGpuRepository = createMockRepository()) {
  return {
    repository,
    service: new GpuService(repository.repository),
  }
}

describe('GpuService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps list results to stable GPU DTOs', async () => {
    const { repository, service } = createService()
    repository.list.mockResolvedValueOnce({
      gpus: [gpuWithCounts],
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

    const result = await service.list({ page: 1, limit: PAGINATION.DEFAULT_LIMIT })

    expect(result.gpus).toEqual([
      {
        id: GPU_ID,
        modelName: 'GeForce RTX 4090',
        brand: { id: BRAND_ID, name: 'NVIDIA' },
        pcListingCount: 4,
      },
    ])
    expect(result.gpus[0]).not.toHaveProperty('_count')
  })

  it('preserves mobile GPU list compatibility responses', async () => {
    const { repository, service } = createService()
    repository.listMobileCompatibility.mockResolvedValueOnce({
      gpus: [mobileGpuRecord],
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

    await expect(service.listMobileCompatibility({ page: 1, limit: 1000 })).resolves.toEqual({
      gpus: [mobileGpuRecord],
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
  })

  it('preserves mobile GPU detail compatibility responses', async () => {
    const { repository, service } = createService()
    repository.byIdMobileCompatibility.mockResolvedValueOnce(mobileGpuRecord)

    await expect(service.byIdMobileCompatibility(GPU_ID)).resolves.toEqual(mobileGpuRecord)
  })

  it('preserves mobile PC listing GPU compatibility responses', async () => {
    const { repository, service } = createService()
    repository.pcListingMobileGpuCompatibility.mockResolvedValueOnce({
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

    await expect(service.pcListingMobileGpuCompatibility({ limit: 100 })).resolves.toEqual({
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
  })

  it('normalizes model names before creating a GPU', async () => {
    const { repository, service } = createService()
    repository.findModelNameConflict.mockResolvedValueOnce(null)
    repository.create.mockResolvedValueOnce(gpuWithCounts)

    const result = await service.create(createActor([PERMISSIONS.MANAGE_DEVICES]), {
      brandId: BRAND_ID,
      modelName: '  GeForce   RTX 4090  ',
    })

    expect(repository.findModelNameConflict).toHaveBeenCalledWith({
      brandId: BRAND_ID,
      modelName: 'GeForce RTX 4090',
    })
    expect(repository.create).toHaveBeenCalledWith({
      brandId: BRAND_ID,
      modelName: 'GeForce RTX 4090',
    })
    expect(result).toEqual({
      id: GPU_ID,
      modelName: 'GeForce RTX 4090',
      brand: { id: BRAND_ID, name: 'NVIDIA' },
      pcListingCount: 4,
    })
  })

  it('rejects GPU creation before touching the repository when the actor lacks permission', async () => {
    const { repository, service } = createService()

    await expect(
      service.create(createActor([]), {
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4090',
      }),
    ).rejects.toThrow('You need the following permissions: manage_devices')
    expect(repository.findModelNameConflict).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('rejects duplicate GPU model names before creating', async () => {
    const { repository, service } = createService()
    repository.findModelNameConflict.mockResolvedValueOnce({ id: GPU_ID })

    await expect(
      service.create(createActor([PERMISSIONS.MANAGE_DEVICES]), {
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4090',
      }),
    ).rejects.toThrow('A GPU with model name "GeForce RTX 4090" already exists for this brand')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('normalizes model names before updating a GPU', async () => {
    const { repository, service } = createService()
    repository.findModelNameConflict.mockResolvedValueOnce(null)
    repository.update.mockResolvedValueOnce(gpuWithCounts)

    await service.update(createActor([PERMISSIONS.MANAGE_DEVICES]), {
      id: GPU_ID,
      brandId: BRAND_ID,
      modelName: '  GeForce   RTX 4090  ',
    })

    expect(repository.findModelNameConflict).toHaveBeenCalledWith({
      brandId: BRAND_ID,
      modelName: 'GeForce RTX 4090',
      excludeId: GPU_ID,
    })
    expect(repository.update).toHaveBeenCalledWith(GPU_ID, {
      brandId: BRAND_ID,
      modelName: 'GeForce RTX 4090',
    })
  })

  it('rejects deleting a missing GPU before writing', async () => {
    const { repository, service } = createService()
    repository.findDeleteGuardById.mockResolvedValueOnce(null)

    await expect(
      service.delete(createActor([PERMISSIONS.MANAGE_DEVICES]), { id: GPU_ID }),
    ).rejects.toThrow('GPU not found')
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('blocks deleting GPUs that are used by reports or presets before writing', async () => {
    const { repository, service } = createService()
    repository.findDeleteGuardById.mockResolvedValueOnce({
      id: GPU_ID,
      _count: { pcListings: 3, presets: 1 },
    })

    await expect(
      service.delete(createActor([PERMISSIONS.MANAGE_DEVICES]), { id: GPU_ID }),
    ).rejects.toThrow('Cannot delete GPU that is used in 4 records')
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('deletes unused GPUs after checking the delete guard', async () => {
    const { repository, service } = createService()
    repository.findDeleteGuardById.mockResolvedValueOnce({
      id: GPU_ID,
      _count: { pcListings: 0, presets: 0 },
    })
    repository.delete.mockResolvedValueOnce(undefined)

    await expect(
      service.delete(createActor([PERMISSIONS.MANAGE_DEVICES]), { id: GPU_ID }),
    ).resolves.toEqual({ success: true })
    expect(repository.delete).toHaveBeenCalledWith(GPU_ID)
  })

  it('requires the statistics permission before returning GPU stats', async () => {
    const { repository, service } = createService()
    repository.stats.mockResolvedValueOnce({ total: 5, withListings: 3, withoutListings: 2 })

    await expect(service.stats(createActor([]))).rejects.toThrow(
      'You need the following permissions: view_statistics',
    )
    expect(repository.stats).not.toHaveBeenCalled()

    await expect(service.stats(createActor([PERMISSIONS.VIEW_STATISTICS]))).resolves.toEqual({
      total: 5,
      withListings: 3,
      withoutListings: 2,
    })
  })
})
