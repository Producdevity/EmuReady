import { PLATFORM_MAPPINGS } from '@/data/constants'
import { type PrismaClient } from '@orm'

type SystemData = {
  name: string
  key?: string
  tgdbPlatformId?: number | null
}

const systems: SystemData[] = [
  {
    name: 'Microsoft Windows',
    key: 'microsoft_windows',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.microsoft_windows ?? undefined,
  },
  {
    name: 'Microsoft Xbox 360',
    key: 'microsoft_xbox_360',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.microsoft_xbox_360 ?? undefined,
  },
  {
    name: 'Microsoft Xbox',
    key: 'microsoft_xbox',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.microsoft_xbox ?? undefined,
  },
  {
    name: 'Nintendo 3DS',
    key: 'nintendo_3ds',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.nintendo_3ds ?? undefined,
  },
  {
    name: 'Nintendo 64',
    key: 'nintendo_64',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.nintendo_n64 ?? undefined,
  },
  {
    name: 'Nintendo DS',
    key: 'nintendo_ds',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.nintendo_ds ?? undefined,
  },
  {
    name: 'Nintendo GameCube',
    key: 'nintendo_gamecube',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.nintendo_gamecube ?? undefined,
  },
  {
    name: 'Nintendo Switch',
    key: 'nintendo_switch',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.nintendo_switch ?? undefined,
  },
  {
    name: 'Nintendo Wii U',
    key: 'nintendo_wii_u',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.nintendo_wii_u ?? undefined,
  },
  {
    name: 'Nintendo Wii',
    key: 'nintendo_wii',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.nintendo_wii ?? undefined,
  },
  {
    name: 'Sega Dreamcast',
    key: 'sega_dreamcast',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sega_dreamcast ?? undefined,
  },
  {
    name: 'Sega Saturn',
    key: 'sega_saturn',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sega_saturn ?? undefined,
  },
  {
    name: 'Sony PlayStation 2',
    key: 'sony_playstation_2',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sony_playstation_2 ?? undefined,
  },
  {
    name: 'Sony PlayStation 3',
    key: 'sony_playstation_3',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sony_playstation_3 ?? undefined,
  },
  {
    name: 'Sony PlayStation 4',
    key: 'sony_playstation_4',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sony_playstation_4 ?? undefined,
  },
  {
    name: 'Sony PlayStation 5',
    key: 'sony_playstation_5',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sony_playstation_5 ?? undefined,
  },
  {
    name: 'Sony PlayStation Portable',
    key: 'sony_playstation_portable',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sony_playstation_portable ?? undefined,
  },
  {
    name: 'Sony PlayStation Vita',
    key: 'sony_playstation_vita',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sony_playstation_vita ?? undefined,
  },
  {
    name: 'Sony PlayStation',
    key: 'sony_playstation',
    tgdbPlatformId: PLATFORM_MAPPINGS.tgdb.sony_playstation ?? undefined,
  },
]

async function systemsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding systems...')

  for (const system of systems) {
    await prisma.system.upsert({
      where: { name: system.name },
      update: {
        ...(system.key ? { key: system.key } : {}),
        ...(system.tgdbPlatformId !== undefined ? { tgdbPlatformId: system.tgdbPlatformId } : {}),
      },
      create: system,
    })
  }

  console.info('✅ Systems seeded successfully')
}

export default systemsSeeder
