import { type PrismaClient } from '@orm/client'

type EmulatorData = {
  name: string
  supportedSystemNames?: string[]
  logo: string
}

const emulators: EmulatorData[] = [
  {
    name: 'AetherSX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'aethersx2.webp',
  },
  {
    name: 'APS3E',
    supportedSystemNames: ['Sony PlayStation 3'],
    logo: 'aps3e.webp',
  },
  {
    name: 'ARMSX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'armsx2.webp',
  },
  {
    name: 'ARMSX3',
    supportedSystemNames: ['Sony PlayStation 3'],
    logo: 'armsx3.webp',
  },
  {
    name: 'Azahar',
    supportedSystemNames: ['Nintendo 3DS'],
    logo: 'azahar.webp',
  },
  { name: 'Cemu', supportedSystemNames: ['Nintendo Wii U'], logo: 'cemu.webp' },
  { name: 'Citra', supportedSystemNames: ['Nintendo 3DS'], logo: 'citra.webp' },
  {
    name: 'Citron',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'citron.webp',
  },
  {
    name: 'Cxbx-Reloaded',
    supportedSystemNames: ['Microsoft Xbox'],
    logo: 'cxbx.webp',
  },
  {
    name: 'Dolphin',
    supportedSystemNames: ['Nintendo GameCube', 'Nintendo Wii'],
    logo: 'dolphin.webp',
  },
  {
    name: 'DraStic',
    supportedSystemNames: ['Nintendo DS'],
    logo: 'drastic.webp',
  },
  {
    name: 'DroidDeck',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'droiddeck.webp',
  },
  {
    name: 'DuckStation',
    supportedSystemNames: ['Sony PlayStation'],
    logo: 'duckstation.webp',
  },
  {
    name: 'Eden',
    supportedSystemNames: ['Nintendo Switch', 'Nintendo Switch 2'],
    logo: 'eden.webp',
  },
  {
    name: 'ExaGear',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'exagear.webp',
  },
  {
    name: 'Flycast',
    supportedSystemNames: ['Sega Dreamcast'],
    logo: 'flycast.webp',
  },
  {
    name: 'GameHub',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'gamefusion.webp',
  },
  {
    name: 'GameNative',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'gamenative.webp',
  },
  {
    name: 'Horizon',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'horizon.webp',
  },
  {
    name: 'HakuX',
    supportedSystemNames: ['Microsoft Xbox'],
    logo: 'hakux.webp',
  },
  {
    name: 'Kenji-NX',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'kenjinx.webp',
  },
  {
    name: 'Lemuroid',
    supportedSystemNames: [
      'Nintendo DS',
      'Nintendo 64',
      'Sony PlayStation',
      'Sony PlayStation Portable',
    ],
    logo: 'lemuroid.webp',
  },
  {
    name: 'MiceWine',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'micewine.webp',
  },
  {
    name: 'Mobox',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'mobox.webp',
  },
  {
    name: 'NethersX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'nethersx2.webp',
  },
  {
    name: 'NX',
    supportedSystemNames: ['Nintendo Switch', 'Nintendo Switch 2'],
    logo: 'nx.webp',
  },
  {
    name: 'PCSX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'pcsx2.webp',
  },
  {
    name: 'PPSSPP',
    supportedSystemNames: ['Sony PlayStation Portable'],
    logo: 'ppsspp.webp',
  },
  {
    name: 'Pluvia',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'pluvia.webp',
  },
  {
    name: 'RPCS3',
    supportedSystemNames: ['Sony PlayStation 3'],
    logo: 'rpcs3.webp',
  },
  {
    name: 'RPCSX',
    supportedSystemNames: ['Sony PlayStation 3', 'Sony PlayStation 4'],
    logo: 'rpcsx.webp',
  },
  {
    name: 'Redream',
    supportedSystemNames: ['Sega Dreamcast'],
    logo: 'redream.webp',
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
    logo: 'retroarch.webp',
  },
  {
    name: 'Ryujinx',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'ryujinx.webp',
  },
  {
    name: 'ShadPS4',
    supportedSystemNames: ['Sony PlayStation 4'],
    logo: 'shadps4.webp',
  },
  {
    name: 'Skyline',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'skyline.webp',
  },
  {
    name: 'Sudachi',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'sudachi.webp',
  },
  {
    name: 'Sumi',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'sumi.webp',
  },
  {
    name: 'Torzu',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'torzu.webp',
  },
  {
    name: 'touchHLE',
    supportedSystemNames: ['Apple iOS'],
    logo: 'touchhle.webp',
  },
  {
    name: 'UTM',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'utm.webp',
  },
  {
    name: 'Vita3K',
    supportedSystemNames: ['Sony PlayStation Vita'],
    logo: 'vita3k.webp',
  },
  {
    name: 'Winlator',
    supportedSystemNames: ['Microsoft Windows'],
    logo: 'winlator.webp',
  },
  {
    name: 'XBSX2',
    supportedSystemNames: ['Sony PlayStation 2'],
    logo: 'xbsx2.webp',
  },
  {
    name: 'Xenia',
    supportedSystemNames: ['Microsoft Xbox 360'],
    logo: 'xenia.webp',
  },
  { name: 'Xemu', supportedSystemNames: ['Microsoft Xbox'], logo: 'xemu.webp' },
  {
    name: 'Yaba Sanshiro',
    supportedSystemNames: ['Sega Saturn'],
    logo: 'yaba.webp',
  },
  { name: 'Yuzu', supportedSystemNames: ['Nintendo Switch'], logo: 'yuzu.webp' },
  {
    name: 'melonDS',
    supportedSystemNames: ['Nintendo DS'],
    logo: 'melonds.webp',
  },
  {
    name: 'MeloNX',
    supportedSystemNames: ['Nintendo Switch'],
    logo: 'melonx.webp',
  },
  {
    name: 'Lime3DS',
    supportedSystemNames: ['Nintendo 3DS'],
    logo: 'lime3ds.webp',
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
