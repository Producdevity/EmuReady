import { type PrismaClient, type Emulator } from '@orm'

// take only id and name from System
type EmulatorData = Pick<Emulator, 'name'>

const emulators: EmulatorData[] = [
  { name: 'RetroArch' },
  { name: 'Dolphin' },
  { name: 'Cemu' },
  { name: 'RPCS3' },
  { name: 'PCSX2' },
  { name: 'Yuzu' },
  { name: 'Ryujinx' },
  { name: 'Eden' },
  { name: 'Eden' },
  { name: 'Citra' },
  { name: 'DuckStation' },
  { name: 'Xemu' },
  { name: 'XQEMU' },
  { name: 'Redream' },
  { name: 'Flycast' },
  { name: 'Winlator Official' },
  { name: 'Winlator Glibc' },
  { name: 'Winlator Proot' },
  { name: 'Winlator Bionic' },
  { name: 'Winlator Cmod' },
  { name: 'Winlator Frost' },
  { name: 'Winlator Afeimod' },
  { name: 'Winlator Ajay' },
  { name: 'Winlator Longjunyu' },
  { name: 'Winlator WinMali' },
]

// Playable Ingame  Intro  Loadable  Nothing
async function emulatorsSeeder(prisma: PrismaClient) {
  await prisma.emulator.deleteMany()

  for (const emulator of emulators) {
    await prisma.emulator.upsert({
      where: { name: emulator.name },
      update: {},
      create: emulator,
    })
  }

  console.log('Emulators seeded successfully.')
}

export default emulatorsSeeder
