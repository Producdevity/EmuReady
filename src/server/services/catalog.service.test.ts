import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role, type PrismaClient } from '@orm/client'

const mockDeviceById = vi.hoisted(() => vi.fn())
const mockFindByModelAndBrandName = vi.hoisted(() => vi.fn())
const mockGetDeviceCompatibilityData = vi.hoisted(() => vi.fn())
const mockGetSocCompatibilityData = vi.hoisted(() => vi.fn())

const cacheMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))

vi.mock('@/server/repositories/devices.repository', () => ({
  DevicesRepository: vi.fn().mockImplementation(function MockDevicesRepository() {
    return {
      byId: mockDeviceById,
      findByModelAndBrandName: mockFindByModelAndBrandName,
    }
  }),
}))

vi.mock('@/server/repositories/listings.repository', () => ({
  ListingsRepository: vi.fn().mockImplementation(function MockListingsRepository() {
    return {
      getDeviceCompatibilityData: mockGetDeviceCompatibilityData,
      getSocCompatibilityData: mockGetSocCompatibilityData,
    }
  }),
}))

vi.mock('@/server/utils/cache/instances', () => ({
  catalogCompatibilityCache: cacheMocks,
}))

const { getDeviceCompatibility } = await import('./catalog.service')

const device = {
  id: 'device-1',
  modelName: 'Pocket',
  socId: 'soc-1',
  brand: { name: 'Brand' },
  soc: { id: 'soc-1', name: 'SoC', manufacturer: 'Maker' },
}

const cachedResponse = {
  device: {
    id: 'device-1',
    modelName: 'Pocket',
    brandName: 'Brand',
    socId: 'soc-1',
    socName: 'SoC',
    socManufacturer: 'Maker',
  },
  systems: [],
  generatedAt: new Date('2026-01-01T00:00:00.000Z'),
  cacheExpiresIn: 600,
}

describe('catalog compatibility cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeviceById.mockResolvedValue(device)
    cacheMocks.get.mockReturnValue(cachedResponse)
  })

  it('uses a public visibility cache key for regular users', async () => {
    await getDeviceCompatibility(
      { deviceId: 'device-1', systemIds: ['system-b', 'system-a'] },
      { prisma: {} as PrismaClient, userRole: Role.USER, userId: 'user-1' },
    )

    expect(cacheMocks.get).toHaveBeenCalledWith(
      'device:device-1:systems:system-a,system-b:breakdown:true:min:1:soc:soc-1:visibility:public',
    )
  })

  it('uses a moderator visibility cache key for moderators', async () => {
    await getDeviceCompatibility(
      { deviceId: 'device-1', includeEmulatorBreakdown: false, minListingCount: 3 },
      { prisma: {} as PrismaClient, userRole: Role.MODERATOR, userId: 'mod-1' },
    )

    expect(cacheMocks.get).toHaveBeenCalledWith(
      'device:device-1:systems:all:breakdown:false:min:3:soc:soc-1:visibility:moderator',
    )
  })
})
