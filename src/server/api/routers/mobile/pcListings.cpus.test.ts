import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PAGINATION } from '@/data/constants'
import { CPU_MOBILE_PC_LISTING_SELECT } from '@/features/hardware/cpu/server/persistence/cpu.prisma'
import { prisma } from '@/server/db'

vi.unmock('@/server/api/mobileContext')

const mockPrisma = vi.hoisted(() => ({
  cpu: {
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

const CPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

const cpuRecord = {
  id: CPU_ID,
  brandId: BRAND_ID,
  modelName: 'Ryzen 7 7800X3D',
  createdAt: CREATED_AT,
  brand: { id: BRAND_ID, name: 'AMD' },
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

describe('mobilePcListingsRouter CPU compatibility endpoint', () => {
  beforeEach(() => {
    mockPrisma.cpu.findMany.mockReset()
  })

  it('returns the existing PC listing CPU compatibility shape', async () => {
    const { caller } = createCaller()
    mockPrisma.cpu.findMany.mockResolvedValueOnce([cpuRecord])

    const result = await caller.cpus({ search: 'Ryzen', limit: 100 })

    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: CPU_MOBILE_PC_LISTING_SELECT,
        orderBy: { modelName: 'asc' },
        take: 100,
      }),
    )
    expect(result).toEqual({
      cpus: [cpuRecord],
    })
    expect(result).not.toHaveProperty('hasMore')
    expect(result.cpus[0]).not.toHaveProperty('_count')
    expect(result.cpus[0]).not.toHaveProperty('pcListingCount')
  })

  it('rejects CPU helper limits above the bounded PC listing contract', async () => {
    const { caller } = createCaller()

    await expect(caller.cpus({ limit: PAGINATION.MAX_LIMIT + 1 })).rejects.toThrow()
    expect(mockPrisma.cpu.findMany).not.toHaveBeenCalled()
  })
})
