import { type PrismaClient } from '@orm'

type EmulatorData = {
  name: string
}

const emulators: EmulatorData[] = [
  { name: 'Dolphin' },
  { name: 'PPSSPP' },
  { name: 'Citra' },
  { name: 'DuckStation' },
  { name: 'AetherSX2' },
  { name: 'Yuzu' },
  { name: 'Ryujinx' },
  { name: 'RetroArch' },
  { name: 'DraStic' },
  { name: 'Cemu' },
  { name: 'PCSX2' },
  { name: 'RPCS3' },
  { name: 'Xemu' },
  { name: 'melonDS' },
  { name: 'mGBA' },
  { name: 'Snes9x' },
]

async function emulatorsSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding emulators...')

  for (const emulator of emulators) {
    await prisma.emulator.upsert({
      where: { name: emulator.name },
      update: {},
      create: emulator,
    })
  }

  console.log('✅ Emulators seeded successfully')
}

export default emulatorsSeeder
