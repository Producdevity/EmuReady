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
  {
    name: 'Azahar',
    supportedSystemNames: ['Nintendo 3DS'],
    logo: 'azahar.png',
  },
  { name: 'Cemu', supportedSystemNames: ['Nintendo Wii U'], logo: 'cemu.png' },
  { name: 'Citra', supportedSystemNames: ['Nintendo 3DS'], logo: 'citra.png' },
  {
    name: 'Citron',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'citron.png',
  },
  {
    name: 'Cxbx-Reloaded',
    supportedSystemNames: ['Microsoft Xbox'],
    logo: 'cxbx.png',
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
    name: 'ExaGear',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'exagear.png',
  },
  {
    name: 'Flycast',
    supportedSystemNames: ['Sega Dreamcast'],
    logo: 'flycast.png',
  },
  {
    name: 'GameHub',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'gamefusion.png',
  },
  {
    name: 'GameNative',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'gamenative.png',
  },
  {
    name: 'Horizon',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'horizon.png',
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
    name: 'Mobox',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'mobox.png',
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
    name: 'Skyline',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'skyline.png',
  },
  {
    name: 'Sudachi',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'sudachi.png',
  },
  {
    name: 'Torzu',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'torzu.png',
  },
  {
    name: 'UTM',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'utm.png',
  },
  {
    name: 'Vita3K',
    supportedSystemNames: ['Sony PlayStation Vita'],
    logo: 'vita3k.png',
  },
  {
    name: 'Winlator',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.png',
  },
  {
    name: 'XBSX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'xbsx2.png',
  },
  {
    name: 'Xenia',
    supportedSystemNames: ['Microsoft Xbox 360'],
    logo: 'xenia.png',
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
  {
    name: 'MeloNX',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'melonx.png',
  },
  {
    name: 'Lime3DS',
    supportedSystemNames: ['Nintendo 3DS'],
    logo: 'lime3ds.png',
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
