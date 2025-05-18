import { type PrismaClient } from '@orm'

type ListingData = {
  gameTitle: string
  systemName: string
  deviceBrand: string
  deviceModel: string
  emulatorName: string
  performanceLabel: string
  notes: string
}

const listings: ListingData[] = [
  {
    gameTitle: 'The Legend of Zelda: Breath of the Wild',
    systemName: 'Nintendo Switch',
    deviceBrand: 'AYANEO',
    deviceModel: 'Kun',
    emulatorName: 'Yuzu',
    performanceLabel: 'Great',
    notes:
      'Runs at 30-40 FPS with occasional dips in demanding areas. No major graphical glitches.',
  },
  {
    gameTitle: 'Animal Crossing: New Horizons',
    systemName: 'Nintendo Switch',
    deviceBrand: 'AYANEO',
    deviceModel: 'Air Plus',
    emulatorName: 'Yuzu',
    performanceLabel: 'Perfect',
    notes: 'Runs at full speed (30 FPS) with no issues at all.',
  },
  {
    gameTitle: 'Super Mario Odyssey',
    systemName: 'Nintendo Switch',
    deviceBrand: 'GPD',
    deviceModel: 'Win 4',
    emulatorName: 'Yuzu',
    performanceLabel: 'Perfect',
    notes: 'Solid 60 FPS throughout the game. Excellent experience.',
  },
  {
    gameTitle: 'Final Fantasy X',
    systemName: 'Sony PlayStation 2',
    deviceBrand: 'ASUS',
    deviceModel: 'ROG Ally RC71L',
    emulatorName: 'PCSX2',
    performanceLabel: 'Perfect',
    notes: 'Perfect emulation at 60 FPS with enhanced resolution.',
  },
  {
    gameTitle: 'Monster Hunter Freedom Unite',
    systemName: 'Sony PlayStation Portable',
    deviceBrand: 'Retroid',
    deviceModel: 'Pocket 4',
    emulatorName: 'PPSSPP',
    performanceLabel: 'Perfect',
    notes: 'Runs at full speed with enhanced textures. Great experience.',
  },
  {
    gameTitle: 'Pokémon X/Y',
    systemName: 'Nintendo 3DS',
    deviceBrand: 'AYN',
    deviceModel: 'Odin 2',
    emulatorName: 'Citra',
    performanceLabel: 'Playable',
    notes:
      'Generally runs at full speed but has some frame drops during battles.',
  },
]

async function listingsSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding listings...')

  // Get an admin user for authoring the listings
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!adminUser) {
    console.warn('No admin user found, skipping listings seeding')
    return
  }

  // Get all the lookups we need
  const games = await prisma.game.findMany({
    include: { system: true },
  })
  const gameMap = new Map()
  games.forEach((game) => {
    gameMap.set(`${game.title}-${game.system.name}`, game.id)
  })

  const devices = await prisma.device.findMany({
    include: { brand: true },
  })
  const deviceMap = new Map()
  devices.forEach((device) => {
    deviceMap.set(`${device.brand.name}-${device.modelName}`, device.id)
  })

  const emulators = await prisma.emulator.findMany()
  const emulatorMap = new Map(
    emulators.map((emulator) => [emulator.name, emulator.id]),
  )

  const performanceScales = await prisma.performanceScale.findMany()
  const performanceMap = new Map(
    performanceScales.map((scale) => [scale.label, scale.id]),
  )

  // Create listings
  for (const listing of listings) {
    // Find the game ID
    const gameId = gameMap.get(`${listing.gameTitle}-${listing.systemName}`)
    if (!gameId) {
      console.warn(
        `Game "${listing.gameTitle}" for system "${listing.systemName}" not found, skipping listing`,
      )
      continue
    }

    // Find the device ID
    const deviceId = deviceMap.get(
      `${listing.deviceBrand}-${listing.deviceModel}`,
    )
    if (!deviceId) {
      console.warn(
        `Device "${listing.deviceBrand} ${listing.deviceModel}" not found, skipping listing`,
      )
      continue
    }

    // Find the emulator ID
    const emulatorId = emulatorMap.get(listing.emulatorName)
    if (!emulatorId) {
      console.warn(
        `Emulator "${listing.emulatorName}" not found, skipping listing`,
      )
      continue
    }

    // Find the performance scale ID
    const performanceId = performanceMap.get(listing.performanceLabel)
    if (!performanceId) {
      console.warn(
        `Performance scale "${listing.performanceLabel}" not found, skipping listing`,
      )
      continue
    }

    // Create or update the listing
    await prisma.listing.upsert({
      where: {
        gameId_deviceId_emulatorId: {
          gameId,
          deviceId,
          emulatorId,
        },
      },
      update: {
        performanceId,
        notes: listing.notes,
      },
      create: {
        gameId,
        deviceId,
        emulatorId,
        performanceId,
        notes: listing.notes,
        authorId: adminUser.id,
      },
    })
  }

  console.log('✅ Listings seeded successfully')
}

export default listingsSeeder
