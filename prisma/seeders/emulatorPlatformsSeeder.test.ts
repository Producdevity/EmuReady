import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type PrismaClient } from '@orm'
import emulatorPlatformsSeeder from './emulatorPlatformsSeeder'

function createMockPrisma(
  emulators: { id: string; name: string }[],
  platforms: { id: string; slug: string }[],
) {
  return {
    emulator: {
      findMany: vi.fn().mockResolvedValue(emulators),
    },
    platform: {
      findMany: vi.fn().mockResolvedValue(platforms),
    },
    emulatorPlatform: {
      create: vi.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaClient
}

describe('emulatorPlatformsSeeder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('links AetherSX2 exclusively to the Android platform', async () => {
    const prisma = createMockPrisma(
      [{ id: 'emu-aethersx2', name: 'AetherSX2' }],
      [
        { id: 'p-android', slug: 'android' },
        { id: 'p-windows-x86', slug: 'windows-x86' },
      ],
    )

    await emulatorPlatformsSeeder(prisma)

    const calls = vi.mocked(prisma.emulatorPlatform.create).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toEqual({
      data: { emulatorId: 'emu-aethersx2', platformId: 'p-android' },
    })
  })

  it('links RetroArch to 9 platforms covering desktop, mobile, and universal scopes', async () => {
    const platformSlugs = [
      'android',
      'ios',
      'windows-x86',
      'windows-arm',
      'linux-x86',
      'linux-arm',
      'macos-x86',
      'macos-arm',
      'freebsd',
    ]

    const prisma = createMockPrisma(
      [{ id: 'emu-retroarch', name: 'RetroArch' }],
      platformSlugs.map((slug, i) => ({ id: `p-${i}`, slug })),
    )

    await emulatorPlatformsSeeder(prisma)

    expect(prisma.emulatorPlatform.create).toHaveBeenCalledTimes(9)
  })

  it('filters the emulator query to those without any existing platform rows', async () => {
    const prisma = createMockPrisma([], [{ id: 'p1', slug: 'android' }])

    await emulatorPlatformsSeeder(prisma)

    expect(prisma.emulator.findMany).toHaveBeenCalledWith({
      where: { platforms: { none: {} } },
      select: { id: true, name: true },
    })
  })

  it('never calls create when no fresh emulators exist (production-safe re-run)', async () => {
    const prisma = createMockPrisma(
      [], // every mapped emulator was filtered out by `platforms: { none: {} }`
      [{ id: 'p-android', slug: 'android' }],
    )

    await emulatorPlatformsSeeder(prisma)

    expect(prisma.emulatorPlatform.create).not.toHaveBeenCalled()
  })

  it('skips mappings whose platform slug is missing but still links known ones', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const prisma = createMockPrisma(
      [{ id: 'emu-dolphin', name: 'Dolphin' }],
      [{ id: 'p-android', slug: 'android' }],
    )

    await emulatorPlatformsSeeder(prisma)

    expect(prisma.emulatorPlatform.create).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Platforms not found'))
  })

  it('links PC-only emulators like Xenia to a single Windows platform', async () => {
    const prisma = createMockPrisma(
      [{ id: 'emu-xenia', name: 'Xenia' }],
      [
        { id: 'p-android', slug: 'android' },
        { id: 'p-windows-x86', slug: 'windows-x86' },
      ],
    )

    await emulatorPlatformsSeeder(prisma)

    expect(prisma.emulatorPlatform.create).toHaveBeenCalledTimes(1)
    expect(vi.mocked(prisma.emulatorPlatform.create).mock.calls[0][0]).toEqual({
      data: { emulatorId: 'emu-xenia', platformId: 'p-windows-x86' },
    })
  })

  it('links iOS-only emulators like MeloNX exclusively to iOS', async () => {
    const prisma = createMockPrisma(
      [{ id: 'emu-melonx', name: 'MeloNX' }],
      [
        { id: 'p-ios', slug: 'ios' },
        { id: 'p-android', slug: 'android' },
      ],
    )

    await emulatorPlatformsSeeder(prisma)

    expect(prisma.emulatorPlatform.create).toHaveBeenCalledTimes(1)
    expect(vi.mocked(prisma.emulatorPlatform.create).mock.calls[0][0]).toEqual({
      data: { emulatorId: 'emu-melonx', platformId: 'p-ios' },
    })
  })
})
