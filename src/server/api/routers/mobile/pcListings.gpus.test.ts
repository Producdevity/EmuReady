import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGINATION } from '@/data/constants'
import { GPU_MOBILE_PC_LISTING_SELECT } from '@/features/hardware/gpu/server/persistence/gpu.prisma'
import { prisma } from '@/server/db'

vi.unmock('@/server/api/mobileContext')

const mockPrisma = vi.hoisted(() => ({
  gpu: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

vi.mock('@/schemas/apiAccess', () => ({
  CreateApiKeySchema: {},
  GetApiKeyUsageSchema: {},
  ListApiKeysSchema: {},
  RevokeApiKeySchema: {},
  UpdateApiKeySchema: {},
}))

vi.mock('@/server/repositories/api-keys.repository', () => ({
  ApiKeysRepository: vi.fn().mockImplementation(function MockApiKeysRepository() {
    return {}
  }),
}))

const { mobilePcListingsRouter } = await import('./pcListings')

const GPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

const gpuRecord = {
  id: GPU_ID,
  brandId: BRAND_ID,
  modelName: 'GeForce RTX 4090',
  createdAt: CREATED_AT,
  brand: { id: BRAND_ID, name: 'NVIDIA' },
}

function createCaller() {
  return {
    caller: mobilePcListingsRouter.createCaller({
      session: null,
      prisma,
      headers: new Headers(),
      apiKey: null,
    }),
  }
}

describe('mobilePcListingsRouter GPU compatibility endpoint', () => {
  beforeEach(() => {
    mockPrisma.gpu.findMany.mockReset()
  })

  it('returns the existing PC listing GPU compatibility shape', async () => {
    const { caller } = createCaller()
    mockPrisma.gpu.findMany.mockResolvedValueOnce([gpuRecord])

    const result = await caller.gpus({ search: 'RTX', limit: 100 })

    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: GPU_MOBILE_PC_LISTING_SELECT,
        orderBy: { modelName: 'asc' },
        take: 100,
      }),
    )
    expect(result).toEqual({
      gpus: [gpuRecord],
    })
    expect(result).not.toHaveProperty('hasMore')
    expect(result.gpus[0]).not.toHaveProperty('_count')
    expect(result.gpus[0]).not.toHaveProperty('pcListingCount')
  })

  it('rejects GPU helper limits above the bounded PC listing contract', async () => {
    const { caller } = createCaller()

    await expect(caller.gpus({ limit: PAGINATION.MAX_LIMIT + 1 })).rejects.toThrow()
    expect(mockPrisma.gpu.findMany).not.toHaveBeenCalled()
  })
})
