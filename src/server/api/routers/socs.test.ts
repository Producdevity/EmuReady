import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const { socsRouter } = await import('./socs')

function createMockPrisma() {
  return {
    soC: {
      count: vi.fn().mockResolvedValue(42),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'soc-1',
          name: 'Snapdragon 8 Gen 3',
          manufacturer: 'Qualcomm',
          architecture: 'ARM64',
          processNode: '4nm',
          cpuCores: 8,
          gpuModel: 'Adreno 750',
          _count: { devices: 3 },
        },
      ]),
    },
  }
}

type MockPrisma = ReturnType<typeof createMockPrisma>

function createCaller(prisma: MockPrisma = createMockPrisma()) {
  return {
    caller: socsRouter.createCaller({
      session: null,
      prisma: prisma as never,
      headers: new Headers(),
    }),
    prisma,
  }
}

describe('socs router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get', () => {
    it('uses page input to calculate the query offset', async () => {
      const { caller, prisma } = createCaller()

      const result = await caller.get({ page: 3, limit: 10 })

      expect(prisma.soC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      )
      expect(result.pagination).toEqual(
        expect.objectContaining({
          page: 3,
          offset: 20,
          limit: 10,
          total: 42,
        }),
      )
    })

    it('uses offset input when page is not provided', async () => {
      const { caller, prisma } = createCaller()

      const result = await caller.get({ offset: 15, limit: 5 })

      expect(prisma.soC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 5,
        }),
      )
      expect(result.pagination).toEqual(
        expect.objectContaining({
          page: 4,
          offset: 15,
          limit: 5,
          total: 42,
        }),
      )
    })
  })
})
