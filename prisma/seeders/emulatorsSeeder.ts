import { type PrismaClient } from '@orm'

type EmulatorData = {
  name: string
}

const emulators: EmulatorData[] = [
  { name: 'AetherSX2' },
  { name: 'Cemu' },
  { name: 'Citra' },
  { name: 'Citron' },
  { name: 'Dolphin' },
  { name: 'DraStic' },
  { name: 'DuckStation' },
  { name: 'Eden' },
  { name: 'GameFusion - GameHub' },
  { name: 'MiceWine' },
  { name: 'PCSX2' },
  { name: 'PPSSPP' },
  { name: 'Pluvia' },
  { name: 'RPCS3' },
  { name: 'RetroArch' },
  { name: 'Ryujinx' },
  { name: 'ShadPS4' },
  { name: 'Snes9x' },
  { name: 'Sudachi' },
  { name: 'Winlator Afeimod Glibc' },
  { name: 'Winlator Afeimod Proot' },
  { name: 'Winlator Ajay Glibc' },
  { name: 'Winlator Ajay Proot' },
  { name: 'Winlator Cmod Bionic' },
  { name: 'Winlator Cmod Glibc' },
  { name: 'Winlator Cmod Proot' },
  { name: 'Winlator Frost Glibc' },
  { name: 'Winlator Frost Proot' },
  { name: 'Winlator Official Glibc' },
  { name: 'Winlator Official Proot' },
  { name: 'Winlator Official' },
  { name: 'Winlator WinMali' },
  { name: 'Winlator longjunyu' },
  { name: 'Xemu' },
  { name: 'Yuzu' },
  { name: 'mGBA' },
  { name: 'melonDS' },
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
