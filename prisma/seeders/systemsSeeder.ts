import { type PrismaClient } from '@orm'

type SystemData = {
  name: string
}

const systems: SystemData[] = [
  { name: 'Nintendo GameCube' },
  { name: 'Nintendo Wii' },
  { name: 'Nintendo Wii U' },
  { name: 'Nintendo Switch' },
  { name: 'Nintendo DS' },
  { name: 'Nintendo 3DS' },
  { name: 'Nintendo Game Boy Advance' },
  { name: 'Nintendo Game Boy Color' },
  { name: 'Nintendo Game Boy' },
  { name: 'Nintendo Entertainment System' },
  { name: 'Super Nintendo Entertainment System' },
  { name: 'Nintendo 64' },
  { name: 'Sony PlayStation' },
  { name: 'Sony PlayStation 2' },
  { name: 'Sony PlayStation 3' },
  { name: 'Sony PlayStation Portable' },
  { name: 'Sony PlayStation Vita' },
  { name: 'Microsoft Xbox' },
  { name: 'Microsoft Xbox 360' },
  { name: 'Sega Genesis/Mega Drive' },
  { name: 'Sega Saturn' },
  { name: 'Sega Dreamcast' },
  { name: 'Sega Game Gear' },
  { name: 'Sega Master System' },
  { name: 'Neo Geo Pocket Color' },
  { name: 'Neo Geo' },
  { name: 'Atari 2600' },
  { name: 'Atari 5200' },
  { name: 'Atari 7800' },
  { name: 'Atari Lynx' },
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
