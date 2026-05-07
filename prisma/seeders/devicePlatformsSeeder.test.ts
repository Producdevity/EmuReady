import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type PrismaClient } from '@orm'
import devicePlatformsSeeder from './devicePlatformsSeeder'

const PLATFORMS = [
  { id: 'p-android', slug: 'android' },
  { id: 'p-ios', slug: 'ios' },
  { id: 'p-windows-x86', slug: 'windows-x86' },
  { id: 'p-linux-x86', slug: 'linux-x86' },
  { id: 'p-linux-arm', slug: 'linux-arm' },
]

type MockDevice = {
  id: string
  modelName: string
  brand: { name: string }
  soc: { name: string | null; manufacturer: string | null; architecture: string | null } | null
}

function createMockPrisma(devices: MockDevice[]) {
  return {
    platform: {
      findMany: vi.fn().mockResolvedValue(PLATFORMS),
    },
    device: {
      findMany: vi.fn().mockResolvedValue(devices),
      update: vi.fn().mockResolvedValue({}),
    },
    devicePlatform: {
      create: vi.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaClient
}

function createdPlatformIds(prisma: PrismaClient): string[] {
  return vi
    .mocked(prisma.devicePlatform.create)
    .mock.calls.map((c) => (c[0].data as { platformId: string }).platformId)
}

describe('devicePlatformsSeeder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('classifies Apple devices as iOS regardless of SoC architecture', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-iphone',
        modelName: 'iPhone 15',
        brand: { name: 'Apple' },
        soc: { name: 'A16 Bionic', manufacturer: 'Apple', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma)).toEqual(['p-ios'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-iphone' },
      data: { defaultPlatformId: 'p-ios' },
    })
  })

  it('classifies generic x86_64 handhelds as dual-boot defaulting to Windows', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-ally',
        modelName: 'ROG Ally RC71L',
        brand: { name: 'ASUS' },
        soc: { name: 'Ryzen Z1 Extreme', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-linux-x86', 'p-windows-x86'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-ally' },
      data: { defaultPlatformId: 'p-windows-x86' },
    })
  })

  it('defaults explicit SteamOS-edition naming to linux-x86', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-legion-go-s-steamos',
        modelName: 'Legion Go S (SteamOS)',
        brand: { name: 'Lenovo' },
        soc: { name: 'Ryzen Z2 Go', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-legion-go-s-steamos' },
      data: { defaultPlatformId: 'p-linux-x86' },
    })
  })

  it('defaults Lenovo Legion Go S 8APU1 Z1 Extreme / 32GB SKU to linux-x86 (SteamOS edition)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-legion-go-s-8apu1',
        modelName: 'Legion Go S 8APU1 Z1 Extreme / 32GB',
        brand: { name: 'Lenovo' },
        soc: { name: 'Ryzen Z1 Extreme', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-legion-go-s-8apu1' },
      data: { defaultPlatformId: 'p-linux-x86' },
    })
  })

  it('defaults Zotac Zone 2 to linux-x86 (Manjaro Linux)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-zotac',
        modelName: 'Zone 2',
        brand: { name: 'Zotac' },
        soc: { name: 'Ryzen AI 9 HX 370', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-zotac' },
      data: { defaultPlatformId: 'p-linux-x86' },
    })
  })

  it('classifies Steam Deck (Aerith APU) as dual-boot defaulting to linux-x86', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-deck',
        modelName: 'Steam Deck',
        brand: { name: 'Valve' },
        soc: { name: 'Custom APU (Aerith)', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-linux-x86', 'p-windows-x86'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-deck' },
      data: { defaultPlatformId: 'p-linux-x86' },
    })
  })

  it('skips Microsoft Xbox One consoles entirely (no matching platform slug)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-xbox-one',
        modelName: 'Xbox One',
        brand: { name: 'Microsoft' },
        soc: { name: 'Durango (Xbox One)', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.devicePlatform.create).not.toHaveBeenCalled()
    expect(prisma.device.update).not.toHaveBeenCalled()
  })

  it('skips Sony PlayStation consoles entirely', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-ps',
        modelName: 'Playstation',
        brand: { name: 'Sony' },
        soc: { name: 'Jaguar', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.devicePlatform.create).not.toHaveBeenCalled()
    expect(prisma.device.update).not.toHaveBeenCalled()
  })

  it('classifies Anbernic + Allwinner H700 as linux-arm-only (RG35XX series)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rg35xx',
        modelName: 'RG35XX H',
        brand: { name: 'Anbernic' },
        soc: { name: 'H700', manufacturer: 'Allwinner', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma)).toEqual(['p-linux-arm'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-rg35xx' },
      data: { defaultPlatformId: 'p-linux-arm' },
    })
  })

  it('matches the Allwinner H700 rule even when local seed data prefixes the SoC name', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rg35xx-local',
        modelName: 'RG35XX H',
        brand: { name: 'Anbernic' },
        soc: {
          name: 'Allwinner H700',
          manufacturer: 'Allwinner',
          architecture: 'ARM64',
        },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma)).toEqual(['p-linux-arm'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-rg35xx-local' },
      data: { defaultPlatformId: 'p-linux-arm' },
    })
  })

  it('classifies Anbernic + Tiger T-series as android-primary', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rg556',
        modelName: 'RG556',
        brand: { name: 'Anbernic' },
        soc: { name: 'Tiger T820', manufacturer: 'Unisoc', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-android', 'p-linux-arm'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-rg556' },
      data: { defaultPlatformId: 'p-android' },
    })
  })

  it('classifies Anbernic + RK3568 as android-primary (RG DS)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rg-ds',
        modelName: 'RG DS',
        brand: { name: 'Anbernic' },
        soc: { name: 'RK3568', manufacturer: 'Rockchip', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-rg-ds' },
      data: { defaultPlatformId: 'p-android' },
    })
  })

  it('classifies Anbernic + RK3566 as linux-arm-primary (RG353 series)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rg353',
        modelName: 'RG353',
        brand: { name: 'Anbernic' },
        soc: { name: 'RK3566', manufacturer: 'Rockchip', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-android', 'p-linux-arm'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-rg353' },
      data: { defaultPlatformId: 'p-linux-arm' },
    })
  })

  it('classifies Trimui devices as linux-arm-only regardless of SoC', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-trimui-brick',
        modelName: 'Brick',
        brand: { name: 'Trimui' },
        soc: { name: 'A133P', manufacturer: 'Allwinner', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma)).toEqual(['p-linux-arm'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-trimui-brick' },
      data: { defaultPlatformId: 'p-linux-arm' },
    })
  })

  it('classifies Khadas + RK3588S as linux-arm-primary (SBC)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-edge2',
        modelName: 'Edge2',
        brand: { name: 'Khadas' },
        soc: { name: 'RK3588S', manufacturer: 'Rockchip', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-edge2' },
      data: { defaultPlatformId: 'p-linux-arm' },
    })
  })

  it('classifies RK3326 (any brand) as linux-arm-only', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rg351',
        modelName: 'GameMT E6',
        brand: { name: 'GameMT' },
        soc: { name: 'RK3326', manufacturer: 'Rockchip', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma)).toEqual(['p-linux-arm'])
  })

  it('classifies PowKiddy + RK3566 as linux-arm-primary (RGB30)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rgb30',
        modelName: 'RGB30',
        brand: { name: 'PowKiddy' },
        soc: { name: 'RK3566', manufacturer: 'Rockchip', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-rgb30' },
      data: { defaultPlatformId: 'p-linux-arm' },
    })
  })

  it('classifies Allwinner A527 as android-primary (RGB50, GameMT E6 Max)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rgb50',
        modelName: 'RGB50',
        brand: { name: 'PowKiddy' },
        soc: { name: 'A527', manufacturer: 'Allwinner', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-android', 'p-linux-arm'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-rgb50' },
      data: { defaultPlatformId: 'p-android' },
    })
  })

  it('classifies generic ARM64 phones as Android-only', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-rog-phone',
        modelName: 'ROG Phone 7',
        brand: { name: 'ASUS' },
        soc: { name: 'Snapdragon 8 Gen 2', manufacturer: 'Qualcomm', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma)).toEqual(['p-android'])
  })

  it('adds linux-arm support for Retroid devices on ARM SoCs (default android)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-retroid',
        modelName: 'Pocket 5',
        brand: { name: 'Retroid' },
        soc: { name: 'Snapdragon 865', manufacturer: 'Qualcomm', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-android', 'p-linux-arm'])
    expect(prisma.device.update).toHaveBeenCalledWith({
      where: { id: 'd-retroid' },
      data: { defaultPlatformId: 'p-android' },
    })
  })

  it('adds linux-arm support for AYN devices on ARM SoCs (default android)', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-odin',
        modelName: 'Odin 2',
        brand: { name: 'AYN' },
        soc: { name: 'Snapdragon 8 Gen 2', manufacturer: 'Qualcomm', architecture: 'ARM64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-android', 'p-linux-arm'])
  })

  it('does NOT add linux-arm for Retroid/AYN on x86 SoCs', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-ayn-x86',
        modelName: 'Hypothetical x86',
        brand: { name: 'AYN' },
        soc: { name: 'Ryzen 7 7840U', manufacturer: 'AMD', architecture: 'x86_64' },
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma).sort()).toEqual(['p-linux-x86', 'p-windows-x86'])
  })

  it('falls back to Android when the device has no SoC linked', async () => {
    const prisma = createMockPrisma([
      {
        id: 'd-unknown',
        modelName: 'Mystery Device',
        brand: { name: 'Unknown' },
        soc: null,
      },
    ])

    await devicePlatformsSeeder(prisma)

    expect(createdPlatformIds(prisma)).toEqual(['p-android'])
  })

  it('filters the device query to those with no platforms and no default (production-safe re-run)', async () => {
    const prisma = createMockPrisma([])

    await devicePlatformsSeeder(prisma)

    expect(prisma.device.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ platforms: { none: {} } }, { defaultPlatformId: null }],
        },
      }),
    )
    expect(prisma.devicePlatform.create).not.toHaveBeenCalled()
    expect(prisma.device.update).not.toHaveBeenCalled()
  })

  it('short-circuits with a warning if required platforms are missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const prisma = createMockPrisma([
      {
        id: 'd1',
        modelName: 'Test',
        brand: { name: 'Test' },
        soc: { name: 'Test SoC', manufacturer: 'Test', architecture: 'ARM64' },
      },
    ])
    vi.mocked(prisma.platform.findMany).mockResolvedValueOnce([])

    await devicePlatformsSeeder(prisma)

    expect(prisma.devicePlatform.create).not.toHaveBeenCalled()
    expect(prisma.device.update).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Required platforms not found'))
  })
})
