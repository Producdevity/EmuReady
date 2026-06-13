import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGINATION } from '@/data/constants'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm/client'
import { CpuRepository } from './cpu.repository'
import { CpuService } from './cpu.service'
import type { CpuDetailRecord, CpuMobileListRecord } from './cpu.repository.types'
import type { Actor } from '@/server/auth/actor'

const CPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

const cpuWithCounts = {
  id: CPU_ID,
  modelName: 'Core i7-13700K',
  brand: { id: BRAND_ID, name: 'Intel' },
  _count: { pcListings: 4 },
} satisfies CpuDetailRecord

const mobileCpuRecord = {
  id: CPU_ID,
  brandId: BRAND_ID,
  modelName: 'Core i7-13700K',
  createdAt: CREATED_AT,
  brand: { id: BRAND_ID, name: 'Intel' },
  _count: { pcListings: 4 },
} satisfies CpuMobileListRecord

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
  const repository = new CpuRepository(prisma)

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
    pcListingMobileCpuCompatibility: vi.spyOn(repository, 'pcListingMobileCpuCompatibility'),
    stats: vi.spyOn(repository, 'stats'),
    update: vi.spyOn(repository, 'update'),
  }
}

type MockCpuRepository = ReturnType<typeof createMockRepository>

function createService(repository: MockCpuRepository = createMockRepository()) {
  return {
    repository,
    service: new CpuService(repository.repository),
  }
}

describe('CpuService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps list results to stable CPU DTOs', async () => {
    const { repository, service } = createService()
    repository.list.mockResolvedValueOnce({
      cpus: [cpuWithCounts],
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

    expect(result.cpus).toEqual([
      {
        id: CPU_ID,
        modelName: 'Core i7-13700K',
        brand: { id: BRAND_ID, name: 'Intel' },
        pcListingCount: 4,
      },
    ])
    expect(result.cpus[0]).not.toHaveProperty('_count')
  })

  it('preserves mobile CPU list compatibility responses', async () => {
    const { repository, service } = createService()
    repository.listMobileCompatibility.mockResolvedValueOnce({
      cpus: [mobileCpuRecord],
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
      cpus: [mobileCpuRecord],
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

  it('preserves mobile CPU detail compatibility responses', async () => {
    const { repository, service } = createService()
    repository.byIdMobileCompatibility.mockResolvedValueOnce(mobileCpuRecord)

    await expect(service.byIdMobileCompatibility(CPU_ID)).resolves.toEqual(mobileCpuRecord)
  })

  it('preserves mobile PC listing CPU compatibility responses', async () => {
    const { repository, service } = createService()
    repository.pcListingMobileCpuCompatibility.mockResolvedValueOnce({
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

    await expect(service.pcListingMobileCpuCompatibility({ limit: 100 })).resolves.toEqual({
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
  })

  it('normalizes model names before creating a CPU', async () => {
    const { repository, service } = createService()
    repository.findModelNameConflict.mockResolvedValueOnce(null)
    repository.create.mockResolvedValueOnce(cpuWithCounts)

    const result = await service.create(createActor([PERMISSIONS.MANAGE_DEVICES]), {
      brandId: BRAND_ID,
      modelName: '  Core   i7-13700K  ',
    })

    expect(repository.findModelNameConflict).toHaveBeenCalledWith({
      brandId: BRAND_ID,
      modelName: 'Core i7-13700K',
    })
    expect(repository.create).toHaveBeenCalledWith({
      brandId: BRAND_ID,
      modelName: 'Core i7-13700K',
    })
    expect(result).toEqual({
      id: CPU_ID,
      modelName: 'Core i7-13700K',
      brand: { id: BRAND_ID, name: 'Intel' },
      pcListingCount: 4,
    })
  })

  it('rejects CPU creation before touching the repository when the actor lacks permission', async () => {
    const { repository, service } = createService()

    await expect(
      service.create(createActor([]), {
        brandId: BRAND_ID,
        modelName: 'Core i7-13700K',
      }),
    ).rejects.toThrow('You need the following permissions: manage_devices')
    expect(repository.findModelNameConflict).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('rejects duplicate CPU model names before creating', async () => {
    const { repository, service } = createService()
    repository.findModelNameConflict.mockResolvedValueOnce({ id: CPU_ID })

    await expect(
      service.create(createActor([PERMISSIONS.MANAGE_DEVICES]), {
        brandId: BRAND_ID,
        modelName: 'Core i7-13700K',
      }),
    ).rejects.toThrow('A CPU with model name "Core i7-13700K" already exists for this brand')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('normalizes model names before updating a CPU', async () => {
    const { repository, service } = createService()
    repository.findModelNameConflict.mockResolvedValueOnce(null)
    repository.update.mockResolvedValueOnce(cpuWithCounts)

    await service.update(createActor([PERMISSIONS.MANAGE_DEVICES]), {
      id: CPU_ID,
      brandId: BRAND_ID,
      modelName: '  Core   i7-13700K  ',
    })

    expect(repository.findModelNameConflict).toHaveBeenCalledWith({
      brandId: BRAND_ID,
      modelName: 'Core i7-13700K',
      excludeId: CPU_ID,
    })
    expect(repository.update).toHaveBeenCalledWith(CPU_ID, {
      brandId: BRAND_ID,
      modelName: 'Core i7-13700K',
    })
  })

  it('rejects deleting a missing CPU before writing', async () => {
    const { repository, service } = createService()
    repository.findDeleteGuardById.mockResolvedValueOnce(null)

    await expect(
      service.delete(createActor([PERMISSIONS.MANAGE_DEVICES]), { id: CPU_ID }),
    ).rejects.toThrow('CPU not found')
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('blocks deleting CPUs that are used by reports or presets before writing', async () => {
    const { repository, service } = createService()
    repository.findDeleteGuardById.mockResolvedValueOnce({
      id: CPU_ID,
      _count: { pcListings: 3, presets: 1 },
    })

    await expect(
      service.delete(createActor([PERMISSIONS.MANAGE_DEVICES]), { id: CPU_ID }),
    ).rejects.toThrow('Cannot delete CPU that is used in 4 records')
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('deletes unused CPUs after checking the delete guard', async () => {
    const { repository, service } = createService()
    repository.findDeleteGuardById.mockResolvedValueOnce({
      id: CPU_ID,
      _count: { pcListings: 0, presets: 0 },
    })
    repository.delete.mockResolvedValueOnce(undefined)

    await expect(
      service.delete(createActor([PERMISSIONS.MANAGE_DEVICES]), { id: CPU_ID }),
    ).resolves.toEqual({ success: true })
    expect(repository.delete).toHaveBeenCalledWith(CPU_ID)
  })

  it('requires the statistics permission before returning CPU stats', async () => {
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
