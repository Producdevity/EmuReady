import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type PrismaClient } from '@orm'
import { DevicesRepository } from './devices.repository'

const DEVICE_ID = '00000000-0000-4000-a000-000000000001'
const PLATFORM_A = '00000000-0000-4000-a000-000000000101'
const PLATFORM_B = '00000000-0000-4000-a000-000000000102'
const PLATFORM_C = '00000000-0000-4000-a000-000000000103'

type MockPrisma = {
  device: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  devicePlatform: {
    findUnique: ReturnType<typeof vi.fn>
  }
}

function createMockPrisma(): MockPrisma {
  return {
    device: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({
        id: DEVICE_ID,
        platforms: [],
        defaultPlatform: null,
        brand: { id: 'b', name: 'X' },
        soc: null,
      }),
    },
    devicePlatform: {
      findUnique: vi.fn(),
    },
  }
}

describe('DevicesRepository.updateSupportedPlatforms', () => {
  let prisma: MockPrisma
  let repo: DevicesRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repo = new DevicesRepository(prisma as unknown as PrismaClient)
  })

  it('replaces the junction rows with the given platformIds', async () => {
    prisma.device.findUnique.mockResolvedValueOnce({ defaultPlatformId: null })

    await repo.updateSupportedPlatforms(DEVICE_ID, [PLATFORM_A, PLATFORM_B])

    const call = prisma.device.update.mock.calls[0][0]
    expect(call.where).toEqual({ id: DEVICE_ID })
    expect(call.data.platforms).toEqual({
      deleteMany: {},
      create: [{ platformId: PLATFORM_A }, { platformId: PLATFORM_B }],
    })
  })

  it('preserves defaultPlatformId when it is included in the new supported set', async () => {
    prisma.device.findUnique.mockResolvedValueOnce({ defaultPlatformId: PLATFORM_A })

    await repo.updateSupportedPlatforms(DEVICE_ID, [PLATFORM_A, PLATFORM_B])

    const call = prisma.device.update.mock.calls[0][0]
    // When keepDefault is true the update payload does NOT include
    // `defaultPlatformId`, preserving the current value.
    expect(call.data.defaultPlatformId).toBeUndefined()
  })

  it('clears defaultPlatformId when the default is removed from the supported set', async () => {
    prisma.device.findUnique.mockResolvedValueOnce({ defaultPlatformId: PLATFORM_C })

    await repo.updateSupportedPlatforms(DEVICE_ID, [PLATFORM_A, PLATFORM_B])

    const call = prisma.device.update.mock.calls[0][0]
    expect(call.data.defaultPlatformId).toBeNull()
  })

  it('clears default when the new supported list is empty', async () => {
    prisma.device.findUnique.mockResolvedValueOnce({ defaultPlatformId: PLATFORM_A })

    await repo.updateSupportedPlatforms(DEVICE_ID, [])

    const call = prisma.device.update.mock.calls[0][0]
    expect(call.data.defaultPlatformId).toBeNull()
    expect(call.data.platforms).toEqual({ deleteMany: {}, create: [] })
  })

  it('throws device.notFound when the device does not exist', async () => {
    prisma.device.findUnique.mockResolvedValueOnce(null)
    await expect(repo.updateSupportedPlatforms(DEVICE_ID, [PLATFORM_A])).rejects.toThrow(
      /not found/i,
    )
  })
})

describe('DevicesRepository.updateDefaultPlatform', () => {
  let prisma: MockPrisma
  let repo: DevicesRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repo = new DevicesRepository(prisma as unknown as PrismaClient)
  })

  it('sets the default when the platform is in the device support set', async () => {
    prisma.devicePlatform.findUnique.mockResolvedValueOnce({ deviceId: DEVICE_ID })

    await repo.updateDefaultPlatform(DEVICE_ID, PLATFORM_A)

    expect(prisma.devicePlatform.findUnique).toHaveBeenCalledWith({
      where: { deviceId_platformId: { deviceId: DEVICE_ID, platformId: PLATFORM_A } },
      select: { deviceId: true },
    })
    expect(prisma.device.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DEVICE_ID },
        data: { defaultPlatformId: PLATFORM_A },
      }),
    )
  })

  it('throws platform.notAvailableForDevice when the platform is NOT in the device support set', async () => {
    prisma.devicePlatform.findUnique.mockResolvedValueOnce(null)

    await expect(repo.updateDefaultPlatform(DEVICE_ID, PLATFORM_A)).rejects.toThrow(
      /not available for this device/i,
    )
    expect(prisma.device.update).not.toHaveBeenCalled()
  })

  it('clears the default (null) without a support-set lookup', async () => {
    await repo.updateDefaultPlatform(DEVICE_ID, null)

    expect(prisma.devicePlatform.findUnique).not.toHaveBeenCalled()
    expect(prisma.device.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { defaultPlatformId: null } }),
    )
  })
})
