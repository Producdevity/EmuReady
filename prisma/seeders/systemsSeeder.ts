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
  { name: 'Nintendo Entertainment System' },
  { name: 'Super Nintendo Entertainment System' },
  { name: 'Nintendo 64' },
  { name: 'Sony PlayStation' },
  { name: 'Sony PlayStation 2' },
  { name: 'Sony PlayStation 3' },
  { name: 'Sony PlayStation 4' },
  { name: 'Sony PlayStation Portable' },
  { name: 'Sony PlayStation Vita' },
  { name: 'Microsoft Windows' },
  { name: 'Microsoft Xbox' },
  { name: 'Microsoft Xbox 360' },
  { name: 'Sega Genesis/Mega Drive' },
  { name: 'Sega Saturn' },
  { name: 'Sega Dreamcast' },
  { name: 'Sega Game Gear' },
  { name: 'Sega Master System' },
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
