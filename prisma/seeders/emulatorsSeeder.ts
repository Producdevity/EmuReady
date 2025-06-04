import { type PrismaClient } from '@orm'

type EmulatorData = {
  name: string
  supportedSystemNames?: string[]
}

const emulators: EmulatorData[] = [
  { name: 'AetherSX2', supportedSystemNames: ['Sony PlayStation 2'] },
  { name: 'Cemu', supportedSystemNames: ['Nintendo Wii U'] },
  { name: 'Citra', supportedSystemNames: ['Nintendo 3DS'] },
  { name: 'Citron', supportedSystemNames: ['Nintendo Switch'] },
  {
    name: 'Dolphin',
    supportedSystemNames: ['Nintendo GameCube', 'Nintendo Wii'],
  },
  { name: 'DraStic', supportedSystemNames: ['Nintendo DS'] },
  { name: 'DuckStation', supportedSystemNames: ['Sony PlayStation'] },
  { name: 'Eden', supportedSystemNames: ['Nintendo Switch'] },
  { name: 'Flycast', supportedSystemNames: ['Sega Dreamcast'] },
  { name: 'GameFusion - GameHub', supportedSystemNames: ['Microsoft Windows'] },
  {
    name: 'Lemuroid',
    supportedSystemNames: [
      'Nintendo DS',
      'Nintendo 64',
      'Sony PlayStation',
      'Sony PlayStation Portable',
    ],
  },
  { name: 'MiceWine', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'NethersX2', supportedSystemNames: ['Sony PlayStation 2'] },
  { name: 'PCSX2', supportedSystemNames: ['Sony PlayStation 2'] },
  { name: 'PPSSPP', supportedSystemNames: ['Sony PlayStation Portable'] },
  { name: 'Pluvia', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'RPCS3', supportedSystemNames: ['Sony PlayStation 3'] },
  {
    name: 'RPCSX',
    supportedSystemNames: ['Sony PlayStation 3', 'Sony PlayStation 4'],
  },
  { name: 'Redream', supportedSystemNames: ['Sega Dreamcast'] },
  {
    name: 'RetroArch',
    supportedSystemNames: [
      'Nintendo 64',
      'Nintendo DS',
      'Sony PlayStation Portable',
      'Sony PlayStation',
    ],
  },
  { name: 'Ryujinx', supportedSystemNames: ['Nintendo Switch'] },
  { name: 'ShadPS4', supportedSystemNames: ['Sony PlayStation 4'] },
  { name: 'Sudachi', supportedSystemNames: ['Nintendo Switch'] },
  { name: 'Vita3K', supportedSystemNames: ['Sony PlayStation Vita'] },
  {
    name: 'Winlator Afeimod Glibc',
    supportedSystemNames: ['Microsoft Windows'],
  },
  {
    name: 'Winlator Afeimod Proot',
    supportedSystemNames: ['Microsoft Windows'],
  },
  { name: 'Winlator Ajay Glibc', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator Ajay Proot', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator Cmod Bionic', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator Cmod Glibc', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator Cmod Proot', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator Frost Glibc', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator Frost Proot', supportedSystemNames: ['Microsoft Windows'] },
  {
    name: 'Winlator Official Glibc',
    supportedSystemNames: ['Microsoft Windows'],
  },
  {
    name: 'Winlator Official Proot',
    supportedSystemNames: ['Microsoft Windows'],
  },
  { name: 'Winlator Official', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator WinMali', supportedSystemNames: ['Microsoft Windows'] },
  { name: 'Winlator longjunyu' },
  { name: 'Xemu', supportedSystemNames: ['Microsoft Xbox'] },
  { name: 'Yaba Sanshiro', supportedSystemNames: ['Sega Saturn'] },
  { name: 'Yuzu', supportedSystemNames: ['Nintendo Switch'] },
  { name: 'melonDS', supportedSystemNames: ['Nintendo DS'] },
]

async function emulatorsSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding emulators...')

  for (const emuData of emulators) {
    const { name, supportedSystemNames } = emuData
    let connectSystems = {}

    if (supportedSystemNames && supportedSystemNames.length > 0) {
      const systemsToConnect = await prisma.system.findMany({
        where: {
          name: { in: supportedSystemNames },
        },
        select: { id: true },
      })

      if (systemsToConnect.length > 0) {
        connectSystems = {
          systems: {
            connect: systemsToConnect.map((system) => ({ id: system.id })),
          },
        }
      }
    }

    await prisma.emulator.upsert({
      where: { name },
      update: { ...connectSystems },
      create: {
        name,
        ...connectSystems,
      },
    })
  }

  console.log('✅ Emulators seeded successfully')
}

export default emulatorsSeeder
