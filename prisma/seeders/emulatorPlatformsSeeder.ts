import { type PrismaClient } from '@orm'

type EmulatorPlatformMapping = {
  emulatorName: string
  platformSlugs: string[]
}

const EMULATOR_PLATFORMS: EmulatorPlatformMapping[] = [
  { emulatorName: 'AetherSX2', platformSlugs: ['android'] },
  { emulatorName: 'APS3E', platformSlugs: ['android'] },
  { emulatorName: 'ARMSX2', platformSlugs: ['android'] },
  {
    emulatorName: 'Azahar',
    platformSlugs: ['windows-x86', 'linux-x86', 'macos-x86', 'macos-arm', 'android'],
  },
  { emulatorName: 'Cemu', platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm', 'android'] },
  {
    emulatorName: 'Citra',
    platformSlugs: ['windows-x86', 'linux-x86', 'macos-x86', 'macos-arm', 'android'],
  },
  { emulatorName: 'Citron', platformSlugs: ['windows-x86', 'linux-x86', 'android'] },
  { emulatorName: 'Cxbx-Reloaded', platformSlugs: ['windows-x86'] },
  {
    emulatorName: 'Dolphin',
    platformSlugs: ['windows-x86', 'linux-x86', 'macos-x86', 'macos-arm', 'android'],
  },
  { emulatorName: 'DraStic', platformSlugs: ['android'] },
  {
    emulatorName: 'DuckStation',
    platformSlugs: ['windows-x86', 'linux-x86', 'macos-x86', 'macos-arm', 'android'],
  },
  { emulatorName: 'Eden', platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm', 'android'] },
  { emulatorName: 'ExaGear', platformSlugs: ['android'] },
  {
    emulatorName: 'Flycast',
    platformSlugs: ['windows-x86', 'linux-x86', 'macos-x86', 'macos-arm', 'android', 'ios'],
  },
  { emulatorName: 'GameHub', platformSlugs: ['android'] },
  { emulatorName: 'GameNative', platformSlugs: ['android'] },
  { emulatorName: 'Horizon', platformSlugs: ['android'] },
  {
    emulatorName: 'Kenji-NX',
    platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm', 'android'],
  },
  { emulatorName: 'Lemuroid', platformSlugs: ['android'] },
  { emulatorName: 'Lime3DS', platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm', 'android'] },
  { emulatorName: 'MeloNX', platformSlugs: ['ios'] },
  { emulatorName: 'MiceWine', platformSlugs: ['android'] },
  { emulatorName: 'Mobox', platformSlugs: ['android'] },
  { emulatorName: 'NethersX2', platformSlugs: ['android'] },
  { emulatorName: 'PCSX2', platformSlugs: ['windows-x86', 'linux-x86', 'macos-x86'] },
  {
    emulatorName: 'PPSSPP',
    platformSlugs: [
      'windows-x86',
      'linux-x86',
      'linux-arm',
      'macos-x86',
      'macos-arm',
      'android',
      'ios',
    ],
  },
  { emulatorName: 'Pluvia', platformSlugs: ['android'] },
  {
    emulatorName: 'RPCS3',
    platformSlugs: ['windows-x86', 'linux-x86', 'linux-arm', 'macos-arm'],
  },
  { emulatorName: 'RPCSX', platformSlugs: ['linux-x86'] },
  {
    emulatorName: 'Redream',
    platformSlugs: ['windows-x86', 'linux-x86', 'linux-arm', 'macos-x86', 'android'],
  },
  {
    emulatorName: 'RetroArch',
    platformSlugs: [
      'android',
      'ios',
      'windows-x86',
      'windows-arm',
      'linux-x86',
      'linux-arm',
      'macos-x86',
      'macos-arm',
      'freebsd',
    ],
  },
  { emulatorName: 'Ryujinx', platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm'] },
  { emulatorName: 'ShadPS4', platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm'] },
  { emulatorName: 'Skyline', platformSlugs: ['android'] },
  { emulatorName: 'Sudachi', platformSlugs: ['windows-x86', 'linux-x86', 'android'] },
  { emulatorName: 'Sumi', platformSlugs: ['windows-x86', 'linux-x86', 'android'] },
  { emulatorName: 'Torzu', platformSlugs: ['windows-x86', 'linux-x86', 'android'] },
  { emulatorName: 'UTM', platformSlugs: ['ios', 'macos-arm', 'macos-x86'] },
  { emulatorName: 'Vita3K', platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm', 'android'] },
  { emulatorName: 'Winlator', platformSlugs: ['android'] },
  { emulatorName: 'XBSX2', platformSlugs: ['windows-x86'] },
  { emulatorName: 'Xemu', platformSlugs: ['windows-x86', 'linux-x86', 'macos-x86'] },
  { emulatorName: 'Xenia', platformSlugs: ['windows-x86'] },
  {
    emulatorName: 'Yaba Sanshiro',
    platformSlugs: ['android', 'ios', 'windows-x86', 'linux-x86', 'linux-arm'],
  },
  { emulatorName: 'Yuzu', platformSlugs: ['windows-x86', 'linux-x86', 'android'] },
  { emulatorName: 'melonDS', platformSlugs: ['windows-x86', 'linux-x86', 'macos-arm', 'android'] },
]

async function emulatorPlatformsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding emulator platforms...')

  // Production-safe: only seed emulators that currently have zero
  // platform rows. An emulator with any existing EmulatorPlatform has
  // either been seeded before or been edited by a super-admin; in
  // either case we must not append / re-add rows.
  const emulators = await prisma.emulator.findMany({
    where: { platforms: { none: {} } },
    select: { id: true, name: true },
  })
  const emulatorByName = new Map(emulators.map((e) => [e.name, e.id]))

  const platforms = await prisma.platform.findMany({ select: { id: true, slug: true } })
  const platformBySlug = new Map(platforms.map((p) => [p.slug, p.id]))

  let linked = 0
  const missingPlatforms = new Set<string>()
  const skipped: string[] = []

  for (const mapping of EMULATOR_PLATFORMS) {
    const emulatorId = emulatorByName.get(mapping.emulatorName)
    if (!emulatorId) {
      skipped.push(mapping.emulatorName)
      continue
    }

    for (const slug of mapping.platformSlugs) {
      const platformId = platformBySlug.get(slug)
      if (!platformId) {
        missingPlatforms.add(slug)
        continue
      }

      await prisma.emulatorPlatform.create({
        data: { emulatorId, platformId },
      })
      linked += 1
    }
  }

  if (skipped.length > 0) {
    console.info(
      `ℹ️  Skipped ${skipped.length} emulator(s) that are missing or already have platforms: ${skipped.join(', ')}`,
    )
  }
  if (missingPlatforms.size > 0) {
    console.warn(
      `⚠️  Platforms not found (skipped): ${Array.from(missingPlatforms).join(', ')}. Run platforms seeder first.`,
    )
  }

  console.info(`✅ Emulator platforms seeded successfully (${linked} links)`)
}

export default emulatorPlatformsSeeder
