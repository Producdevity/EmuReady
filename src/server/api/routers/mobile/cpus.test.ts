import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CPU_MOBILE_LIST_SELECT } from '@/features/hardware/cpu/server/persistence/cpu.prisma'
import { prisma } from '@/server/db'

vi.unmock('@/server/api/mobileContext')

const mockPrisma = vi.hoisted(() => ({
  cpu: {
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

const { mobileCpusRouter } = await import('./cpus')

const CPU_ID = '00000000-0000-4000-a000-000000000001'
const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z')

const cpuRecord = {
  id: CPU_ID,
  brandId: BRAND_ID,
  modelName: 'Ryzen 7 7800X3D',
  createdAt: CREATED_AT,
  brand: { id: BRAND_ID, name: 'AMD' },
  _count: { pcListings: 7 },
}

function createCaller() {
  return {
    caller: mobileCpusRouter.createCaller({
      session: null,
      prisma,
      headers: new Headers(),
      apiKey: null,
    }),
  }
}

describe('mobileCpusRouter', () => {
  beforeEach(() => {
    mockPrisma.cpu.count.mockReset()
    mockPrisma.cpu.findMany.mockReset()
    mockPrisma.cpu.findUnique.mockReset()
  })

  it('returns the existing mobile CPU list compatibility shape', async () => {
    const { caller } = createCaller()
    mockPrisma.cpu.findMany.mockResolvedValueOnce([cpuRecord])
    mockPrisma.cpu.count.mockResolvedValueOnce(1)

    const result = await caller.get({ page: 1, limit: 20 })

    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: CPU_MOBILE_LIST_SELECT,
      }),
    )
    expect(result.cpus[0]).toEqual(cpuRecord)
    expect(result.cpus[0]).not.toHaveProperty('pcListingCount')
  })

  it('preserves the old mobile CPU list high-limit behavior', async () => {
    const { caller } = createCaller()
    mockPrisma.cpu.findMany.mockResolvedValueOnce([])
    mockPrisma.cpu.count.mockResolvedValueOnce(0)

    await caller.get({ page: 1, limit: 1000 })

    expect(mockPrisma.cpu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1000,
      }),
    )
  })

  it('returns the existing mobile CPU detail compatibility shape', async () => {
    const { caller } = createCaller()
    mockPrisma.cpu.findUnique.mockResolvedValueOnce(cpuRecord)

    const result = await caller.getById({ id: CPU_ID })

    expect(mockPrisma.cpu.findUnique).toHaveBeenCalledWith({
      where: { id: CPU_ID },
      select: CPU_MOBILE_LIST_SELECT,
    })
    expect(result).toEqual(cpuRecord)
  })

  it('returns the existing CPU not-found error for missing getById results', async () => {
    const { caller } = createCaller()
    mockPrisma.cpu.findUnique.mockResolvedValueOnce(null)

    await expect(caller.getById({ id: CPU_ID })).rejects.toThrow('CPU not found')
  })
})
