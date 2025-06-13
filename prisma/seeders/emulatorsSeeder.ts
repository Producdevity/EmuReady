import { type PrismaClient } from '@orm'

type EmulatorData = {
  name: string
  supportedSystemNames?: string[]
  logo: string
}

const emulators: EmulatorData[] = [
  {
    name: 'AetherSX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'aethersx2.png',
  },
  { name: 'Cemu', supportedSystemNames: ['Nintendo Wii U'], logo: 'cemu.png' },
  { name: 'Citra', supportedSystemNames: ['Nintendo 3DS'], logo: 'citra.png' },
  {
    name: 'Citron',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'citron.png',
  },
  {
    name: 'Dolphin',
    supportedSystemNames: ['Nintendo GameCube', 'Nintendo Wii'],
    logo: 'dolphin.png',
  },
  {
    name: 'DraStic',
    supportedSystemNames: ['Nintendo DS'],
    logo: 'drastic.png',
  },
  {
    name: 'DuckStation',
    supportedSystemNames: ['Sony PlayStation'],
    logo: 'duckstation.png',
  },
  { name: 'Eden', supportedSystemNames: ['Nintendo Switch'], logo: 'eden.png' },
  {
    name: 'Flycast',
    supportedSystemNames: ['Sega Dreamcast'],
    logo: 'flycast.png',
  },
  {
    name: 'GameFusion - GameHub',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'gamefusion.png',
  },
  {
    name: 'Lemuroid',
    supportedSystemNames: [
      'Nintendo DS',
      'Nintendo 64',
      'Sony PlayStation',
      'Sony PlayStation Portable',
    ],
    logo: 'lemuroid.png',
  },
  {
    name: 'MiceWine',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'micewine.png',
  },
  {
    name: 'NethersX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'nethersx2.png',
  },
  {
    name: 'PCSX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'pcsx2.png',
  },
  {
    name: 'PPSSPP',
    supportedSystemNames: ['Sony PlayStation Portable'],
    logo: 'ppsspp.png',
  },
  {
    name: 'Pluvia',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'pluvia.png',
  },
  {
    name: 'RPCS3',
    supportedSystemNames: ['Sony PlayStation 3'],
    logo: 'rpcs3.png',
  },
  {
    name: 'RPCSX',
    supportedSystemNames: ['Sony PlayStation 3', 'Sony PlayStation 4'],
    logo: 'rpcsx.png',
  },
  {
    name: 'Redream',
    supportedSystemNames: ['Sega Dreamcast'],
    logo: 'redream.png',
  },
  {
    name: 'RetroArch',
    supportedSystemNames: [
      'Microsoft Windows',
      'Nintendo 64',
      'Nintendo DS',
      'Sony PlayStation Portable',
      'Sony PlayStation',
    ],
    logo: 'retroarch.png',
  },
  {
    name: 'Ryujinx',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'ryujinx.png',
  },
  {
    name: 'ShadPS4',
    supportedSystemNames: ['Sony PlayStation 4'],
    logo: 'shadps4.png',
  },
  {
    name: 'Sudachi',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'sudachi.png',
  },
  {
    name: 'Vita3K',
    supportedSystemNames: ['Sony PlayStation Vita'],
    logo: 'vita3k.png',
  },
  {
    name: 'Winlator Afeimod Glibc',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Afeimod Proot',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Ajay Glibc',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Ajay Proot',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Cmod Bionic',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Cmod Glibc',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Cmod Proot',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Frost Glibc',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Frost Proot',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Official Glibc',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Official Proot',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator Official',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator WinMali',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'Winlator longjunyu',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  { name: 'Xemu', supportedSystemNames: ['Microsoft Xbox'], logo: 'xemu.png' },
  {
    name: 'Yaba Sanshiro',
    supportedSystemNames: ['Sega Saturn'],
    logo: 'yaba.png',
  },
  { name: 'Yuzu', supportedSystemNames: ['Nintendo Switch'], logo: 'yuzu.png' },
  {
    name: 'melonDS',
    supportedSystemNames: ['Nintendo DS'],
    logo: 'melonds.png',
  },
]

async function emulatorsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding emulators...')

  for (const emuData of emulators) {
    const { name, supportedSystemNames } = emuData
    let connectSystems = {}

    if (supportedSystemNames && supportedSystemNames.length > 0) {
      const systemsToConnect = await prisma.system.findMany({
        where: { name: { in: supportedSystemNames } },
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
      update: {
        logo: emuData.logo,
        ...connectSystems,
      },
      create: {
        name,
        logo: emuData.logo,
        ...connectSystems,
      },
    })
  }

  console.info('✅ Emulators seeded successfully')
}

export default emulatorsSeeder
