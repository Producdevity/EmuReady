import { type PrismaClient, type System } from '@orm'

type SystemData = Pick<System, 'name'>

const systems: SystemData[] = [
  { name: 'Nintendo Switch' },
  { name: 'Nintendo GameCube' },
  { name: 'Nintendo Wii' },
  { name: 'Nintendo Wii U' },
  { name: 'Nintendo DS' },
  { name: 'Nintendo 3DS' },
  { name: 'Sony PlayStation' },
  { name: 'Sony PlayStation 2' },
  { name: 'Sony PlayStation 3' },
  { name: 'Sony PlayStation 4' },
  { name: 'Sony PlayStation 5' },
  { name: 'Microsoft Xbox' },
  { name: 'Microsoft Xbox 360' },
  { name: 'Microsoft Xbox One' },
  { name: 'Microsoft Xbox Series X/S' },
  { name: 'Microsoft Windows' },
  { name: 'Sega Dreamcast' },
  { name: 'Sega Genesis' },
  { name: 'Sega Saturn' },
  { name: 'Sega Game Gear' },
  { name: 'Atari Jaguar' },
  { name: 'Atari Lynx' },
  { name: 'Atari 2600' },
  { name: 'Atari 7800' },
  { name: 'Neo Geo AES' },
  { name: 'Neo Geo CD' },
  { name: 'Neo Geo MVS' },
  { name: 'Neo Geo Pocket' },
  { name: 'Neo Geo Pocket Color' },
  { name: 'TurboGrafx-16' },
  { name: 'TurboGrafx-CD' },
  { name: 'PC Engine' },
  { name: 'PC Engine CD' },
  { name: 'Commodore Amiga' },
  { name: 'Commodore 64' },
  { name: 'MS-DOS' },
]

async function systemsSeeder(prisma: PrismaClient) {
  await prisma.system.deleteMany()

  for (const system of systems) {
    await prisma.system.upsert({
      where: { name: system.name },
      update: {},
      create: system,
    })
  }

  console.log('Systems seeded successfully.')
}

export default systemsSeeder
