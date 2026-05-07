import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PcOs, PlatformScope, type PrismaClient } from '@orm'
import { PlatformsRepository } from './platforms.repository'

type MockPrisma = {
  platform: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  devicePlatform: {
    findMany: ReturnType<typeof vi.fn>
  }
}

function createMockPrisma(): MockPrisma {
  return {
    platform: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    devicePlatform: {
      findMany: vi.fn(),
    },
  }
}

describe('PlatformsRepository', () => {
  let prisma: MockPrisma
  let repository: PlatformsRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repository = new PlatformsRepository(prisma as unknown as PrismaClient)
  })

  describe('list', () => {
    it('returns all platforms sorted by sortOrder then name when no filter given', async () => {
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.list()

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })

    it('filters to a single scope when scope is provided', async () => {
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.list({ scope: PlatformScope.MOBILE })

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: { scope: PlatformScope.MOBILE },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })

    it('filters to multiple scopes via `in` when scopes[] is provided', async () => {
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.list({
        scopes: [PlatformScope.DESKTOP, PlatformScope.UNIVERSAL],
      })

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: { scope: { in: [PlatformScope.DESKTOP, PlatformScope.UNIVERSAL] } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })

    it('falls back to no scope filter when scopes[] is empty', async () => {
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.list({ scopes: [] })

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })

    it('prefers `scope` over `scopes[]` when both are set', async () => {
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.list({
        scope: PlatformScope.MOBILE,
        scopes: [PlatformScope.DESKTOP],
      })

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: { scope: PlatformScope.MOBILE },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })
  })

  describe('byId', () => {
    it('queries platform.findUnique with the passed id', async () => {
      vi.mocked(prisma.platform.findUnique).mockResolvedValueOnce(null)

      await repository.byId('abc-123')

      expect(prisma.platform.findUnique).toHaveBeenCalledWith({
        where: { id: 'abc-123' },
      })
    })
  })

  describe('listCompatibleForDevice', () => {
    const DEVICE_ID = '00000000-0000-4000-a000-000000000aa1'
    const PLATFORM_ANDROID = '00000000-0000-4000-a000-000000000aa2'
    const PLATFORM_IOS = '00000000-0000-4000-a000-000000000aa3'

    it('returns the intersection of DevicePlatform links', async () => {
      vi.mocked(prisma.devicePlatform.findMany).mockResolvedValueOnce([
        { platformId: PLATFORM_ANDROID },
        { platformId: PLATFORM_IOS },
      ])
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.listCompatibleForDevice(DEVICE_ID)

      expect(prisma.devicePlatform.findMany).toHaveBeenCalledWith({
        where: { deviceId: DEVICE_ID },
        select: { platformId: true },
      })
      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: { id: { in: [PLATFORM_ANDROID, PLATFORM_IOS] } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })

    it('fail-opens: returns ALL platforms when the device has no DevicePlatform links', async () => {
      vi.mocked(prisma.devicePlatform.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.listCompatibleForDevice(DEVICE_ID)

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })
  })

  describe('listCompatibleForOs', () => {
    it('filters by the OS↔slug compatibility table when it returns a concrete list', async () => {
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.listCompatibleForOs(PcOs.WINDOWS)

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: { slug: { in: expect.arrayContaining(['windows-x86']) } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })

    it('returns all platforms when the OS has no compatibility entry (e.g. OTHER)', async () => {
      vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

      await repository.listCompatibleForOs(PcOs.OTHER)

      expect(prisma.platform.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    })
  })
})
