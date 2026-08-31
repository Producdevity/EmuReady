import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GPU_MOBILE_LIST_SELECT } from '@/features/hardware/gpu/server/persistence/gpu.prisma'
import { prisma } from '@/server/db'

vi.unmock('@/server/api/mobileContext')

const mockPrisma = vi.hoisted(() => ({
  gpu: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
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

const { mobileGpusRouter } = await import('./gpus')

const GPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

const gpuRecord = {
  id: GPU_ID,
  brandId: BRAND_ID,
  modelName: 'GeForce RTX 4090',
  createdAt: CREATED_AT,
  brand: { id: BRAND_ID, name: 'NVIDIA' },
  _count: { pcListings: 7 },
}

function createCaller() {
  return {
    caller: mobileGpusRouter.createCaller({
      session: null,
      prisma,
      headers: new Headers(),
      apiKey: null,
    }),
  }
}

describe('mobileGpusRouter', () => {
  beforeEach(() => {
    mockPrisma.gpu.count.mockReset()
    mockPrisma.gpu.findMany.mockReset()
    mockPrisma.gpu.findUnique.mockReset()
  })

  it('returns the existing mobile GPU list compatibility shape', async () => {
    const { caller } = createCaller()
    mockPrisma.gpu.findMany.mockResolvedValueOnce([gpuRecord])
    mockPrisma.gpu.count.mockResolvedValueOnce(1)

    const result = await caller.get({ page: 1, limit: 20 })

    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: GPU_MOBILE_LIST_SELECT,
      }),
    )
    expect(result.gpus[0]).toEqual(gpuRecord)
    expect(result.gpus[0]).not.toHaveProperty('pcListingCount')
  })

  it('preserves the old mobile GPU list high-limit behavior', async () => {
    const { caller } = createCaller()
    mockPrisma.gpu.findMany.mockResolvedValueOnce([])
    mockPrisma.gpu.count.mockResolvedValueOnce(0)

    await caller.get({ page: 1, limit: 1000 })

    expect(mockPrisma.gpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1000,
      }),
    )
  })

  it('returns the existing mobile GPU detail compatibility shape', async () => {
    const { caller } = createCaller()
    mockPrisma.gpu.findUnique.mockResolvedValueOnce(gpuRecord)

    const result = await caller.getById({ id: GPU_ID })

    expect(mockPrisma.gpu.findUnique).toHaveBeenCalledWith({
      where: { id: GPU_ID },
      select: GPU_MOBILE_LIST_SELECT,
    })
    expect(result).toEqual(gpuRecord)
  })

  it('returns the existing GPU not-found error for missing getById results', async () => {
    const { caller } = createCaller()
    mockPrisma.gpu.findUnique.mockResolvedValueOnce(null)

    await expect(caller.getById({ id: GPU_ID })).rejects.toThrow('GPU not found')
  })
})
