import { type PrismaClient } from '@orm'

type SystemData = {
  name: string
}

const systems: SystemData[] = [
  { name: 'Microsoft Windows' },
  { name: 'Microsoft Xbox 360' },
  { name: 'Microsoft Xbox' },
  { name: 'Nintendo 3DS' },
  { name: 'Nintendo 64' },
  { name: 'Nintendo DS' },
  { name: 'Nintendo Entertainment System' },
  { name: 'Nintendo GameCube' },
  { name: 'Nintendo Switch' },
  { name: 'Nintendo Wii U' },
  { name: 'Nintendo Wii' },
  { name: 'Sega Dreamcast' },
  { name: 'Sega Game Gear' },
  { name: 'Sega Genesis/Mega Drive' },
  { name: 'Sega Master System' },
  { name: 'Sega Saturn' },
  { name: 'Sony PlayStation 2' },
  { name: 'Sony PlayStation 3' },
  { name: 'Sony PlayStation 4' },
  { name: 'Sony PlayStation Portable' },
  { name: 'Sony PlayStation Vita' },
  { name: 'Sony PlayStation' },
  { name: 'Super Nintendo Entertainment System' },
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
