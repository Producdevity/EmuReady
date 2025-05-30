import { type PrismaClient } from '@orm'

type SystemData = {
  name: string
  key: string
}

const systems: SystemData[] = [
  { name: 'Microsoft Windows', key: 'microsoft_windows' },
  { name: 'Microsoft Xbox 360', key: 'microsoft_xbox_360' },
  { name: 'Microsoft Xbox', key: 'microsoft_xbox' },
  { name: 'Nintendo 3DS', key: 'nintendo_3ds' },
  { name: 'Nintendo 64', key: 'nintendo_64' },
  { name: 'Nintendo DS', key: 'nintendo_ds' },
  { name: 'Nintendo GameCube', key: 'nintendo_gamecube' },
  { name: 'Nintendo Switch', key: 'nintendo_switch' },
  { name: 'Nintendo Wii U', key: 'nintendo_wii_u' },
  { name: 'Nintendo Wii', key: 'nintendo_wii' },
  { name: 'Sega Dreamcast', key: 'sega_dreamcast' },
  { name: 'Sega Saturn', key: 'sega_saturn' },
  { name: 'Sony PlayStation 2', key: 'sony_playstation_2' },
  { name: 'Sony PlayStation 3', key: 'sony_playstation_3' },
  { name: 'Sony PlayStation 4', key: 'sony_playstation_4' },
  { name: 'Sony PlayStation Portable', key: 'sony_playstation_portable' },
  { name: 'Sony PlayStation Vita', key: 'sony_playstation_vita' },
  { name: 'Sony PlayStation', key: 'sony_playstation' },
]

async function systemsSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding systems...')

  for (const system of systems) {
    await prisma.system.upsert({
      where: { name: system.name },
      update: {},
      create: system,
    })
  }

  console.log('✅ Systems seeded successfully')
}

export default systemsSeeder
