import { type PrismaClient } from '@orm'

const systems = {
  windows: 'Microsoft Windows',
  xbox360: 'Microsoft Xbox 360',
  xbox: 'Microsoft Xbox',
  n3ds: 'Nintendo 3DS',
  n64: 'Nintendo 64',
  nds: 'Nintendo DS',
  gc: 'Nintendo GameCube',
  switch: 'Nintendo Switch',
  wiiu: 'Nintendo Wii U',
  wii: 'Nintendo Wii',
  dc: 'Sega Dreamcast',
  saturn: 'Sega Saturn',
  ps: 'Sony PlayStation',
  ps2: 'Sony PlayStation 2',
  ps3: 'Sony PlayStation 3',
  ps4: 'Sony PlayStation 4',
  ps5: 'Sony PlayStation 5',
  psp: 'Sony PlayStation Portable',
  psvita: 'Sony PlayStation Vita',
}

type GameData = {
  title: string
  systemName: string // We'll use this to look up the system ID
}

const games: GameData[] = [
  // Nintendo GameCube
  { title: "Luigi's Mansion", systemName: systems.gc },
  { title: 'Animal Crossing', systemName: systems.gc },
  { title: 'Metroid Prime', systemName: systems.gc },
  { title: 'Pikmin', systemName: systems.gc },
  { title: 'Super Mario Sunshine', systemName: systems.gc },
  { title: 'Super Smash Bros. Melee', systemName: systems.gc },
  { title: 'The Legend of Zelda: Twilight Princess', systemName: systems.gc },
  { title: 'The Legend of Zelda: Wind Waker', systemName: systems.gc },

  // Nintendo 3DS
  { title: "Luigi's Mansion: Dark Moon", systemName: systems.n3ds },
  { title: "The Legend of Zelda: Majora's Mask 3D", systemName: systems.n3ds },
  { title: 'Fire Emblem: Awakening', systemName: systems.n3ds },
  { title: 'Mario Kart 7', systemName: systems.n3ds },
  { title: 'Mario Kart 8 Deluxe', systemName: systems.switch },
  { title: 'New Super Mario Bros. 2', systemName: systems.n3ds },
  { title: 'Pokémon X/Y', systemName: systems.n3ds },
  { title: 'Super Mario 3D Land', systemName: systems.n3ds },
  { title: 'Super Mario Maker for Nintendo 3DS', systemName: systems.n3ds },
  { title: 'Super Mario Maker for Nintendo 3DS', systemName: systems.n3ds },
  {
    title: 'The Legend of Zelda: A Link Between Worlds',
    systemName: systems.n3ds,
  },
  {
    title: 'The Legend of Zelda: Ocarina of Time 3D',
    systemName: systems.n3ds,
  },
  {
    title: 'The Legend of Zelda: Phantom Hourglass',
    systemName: systems.n3ds,
  },
  { title: 'The Legend of Zelda: Spirit Tracks', systemName: systems.n3ds },
  {
    title: 'The Legend of Zelda: Tri Force Heroes',
    systemName: systems.n3ds,
  },

  // Nintendo Wii
  { title: 'Super Mario Galaxy 2', systemName: systems.wii },
  { title: 'Super Mario Galaxy', systemName: systems.wii },
  { title: 'The Legend of Zelda: Skyward Sword', systemName: systems.wii },
  {
    title: 'The Legend of Zelda: Twilight Princess',
    systemName: systems.wii,
  },
  { title: 'The Legend of Zelda: Wind Waker HD', systemName: systems.wiiu },

  // Nintendo Wii U
  { title: 'Mario Kart 8', systemName: systems.wiiu },
  { title: 'Splatoon', systemName: systems.wiiu },
  { title: 'Super Mario 3D World', systemName: systems.wiiu },
  { title: 'Super Mario Maker', systemName: systems.wiiu },
  {
    title: 'The Legend of Zelda: Breath of the Wild',
    systemName: systems.wiiu,
  },
  {
    title: 'The Legend of Zelda: The Wind Waker HD',
    systemName: systems.wiiu,
  },
  {
    title: 'The Legend of Zelda: Twilight Princess HD',
    systemName: systems.wiiu,
  },

  // Nintendo Switch
  { title: "Luigi's Mansion 2", systemName: systems.switch },
  { title: "Luigi's Mansion 3", systemName: systems.switch },
  {
    title: "Super Mario 3D World + Bowser's Fury",
    systemName: systems.switch,
  },
  { title: 'Animal Crossing: New Horizons', systemName: systems.switch },
  { title: 'Bayonetta 3', systemName: systems.switch },
  { title: 'DAVE THE DIVER', systemName: systems.switch },
  { title: 'Fire Emblem: Three Houses', systemName: systems.switch },
  { title: 'Hades', systemName: systems.switch },
  { title: 'Mario Kart 8 Deluxe', systemName: systems.switch },
  { title: 'Metroid Dread', systemName: systems.switch },
  { title: 'Monster Hunter Rise', systemName: systems.switch },
  { title: 'Monster Hunter Rise: Sunbreak', systemName: systems.switch },
  { title: 'Octopath Traveler', systemName: systems.switch },
  { title: 'Splatoon 2', systemName: systems.switch },
  { title: 'Splatoon 3', systemName: systems.switch },
  { title: 'Super Mario Maker 2', systemName: systems.switch },
  { title: 'Super Mario Odyssey', systemName: systems.switch },
  { title: 'Super Mario Party', systemName: systems.switch },
  { title: 'Super Smash Bros. Ultimate', systemName: systems.switch },
  {
    title: 'The Legend of Zelda: Breath of the Wild',
    systemName: systems.switch,
  },
  {
    title: 'The Legend of Zelda: Skyward Sword HD',
    systemName: systems.switch,
  },
  {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    systemName: systems.switch,
  },
  { title: 'Xenoblade Chronicles 2', systemName: systems.switch },
  { title: 'Xenoblade Chronicles 3', systemName: systems.switch },

  // Sony PlayStation 1
  { title: 'Final Fantasy VII', systemName: systems.ps },
  { title: 'Metal Gear Solid', systemName: systems.ps },
  { title: 'Castlevania: Symphony of the Night', systemName: systems.ps },
  { title: 'Resident Evil', systemName: systems.ps },
  { title: 'Final Fantasy IX', systemName: systems.ps },
  { title: 'Tekken 3', systemName: systems.ps },
  { title: 'Crash Bandicoot', systemName: systems.ps },
  { title: 'Spyro the Dragon', systemName: systems.ps },

  // Sony PlayStation 2
  { title: 'Final Fantasy X', systemName: systems.ps2 },
  { title: 'Final Fantasy XII', systemName: systems.ps2 },
  { title: 'God of War II', systemName: systems.ps2 },
  { title: 'Grand Theft Auto: San Andreas', systemName: systems.ps2 },
  { title: 'Metal Gear Solid 2: Sons of Liberty', systemName: systems.ps2 },
  { title: 'Shadow of the Colossus', systemName: systems.ps2 },

  // Sony PlayStation Portable
  { title: 'Call of Duty: Roads to Victory', systemName: systems.psp },
  { title: 'Crisis Core: Final Fantasy VII', systemName: systems.psp },
  { title: 'Daxter', systemName: systems.psp },
  { title: 'God of War: Ghost of Sparta', systemName: systems.psp },
  { title: 'LocoRoco', systemName: systems.psp },
  { title: 'Monster Hunter Freedom Unite', systemName: systems.psp },
  { title: 'Patapon', systemName: systems.psp },

  // Sony PlayStation Vita
  { title: 'Persona 4 Golden', systemName: systems.psvita },
  { title: 'Uncharted: Golden Abyss', systemName: systems.psvita },
  { title: 'Killzone: Mercenary', systemName: systems.psvita },
  { title: 'Gravity Rush', systemName: systems.psvita },
  { title: 'Danganronpa: Trigger Happy Havoc', systemName: systems.psvita },
  { title: 'Tales of Hearts R', systemName: systems.psvita },

  // Sony PlayStation 3
  { title: 'The Last of Us', systemName: systems.ps3 },
  { title: 'Uncharted 2: Among Thieves', systemName: systems.ps3 },
  { title: 'Metal Gear Solid V: The Phantom Pain', systemName: systems.ps3 },

  // Sony Playstation 4
  { title: 'Bloodborne', systemName: systems.ps4 },
  { title: 'The Last of Us Part II', systemName: systems.ps4 },
  { title: 'God of War (2018)', systemName: systems.ps4 },

  // Microsoft Xbox 360
  { title: 'Halo 3', systemName: systems.xbox360 },
  { title: 'Gears of War', systemName: systems.xbox360 },
  { title: 'Forza Horizon', systemName: systems.xbox360 },

  // Microsoft Windows
  { title: 'Half-Life', systemName: systems.windows },
  { title: 'Half-Life 2', systemName: systems.windows },
  { title: 'The Witcher 2: Assassins of Kings', systemName: systems.windows },
  { title: 'The Witcher 3: Wild Hunt', systemName: systems.windows },
  { title: 'Dark Souls Remastered', systemName: systems.windows },
  { title: 'Dark Souls II', systemName: systems.windows },
  { title: 'Dark Souls III', systemName: systems.windows },
  { title: 'Sekiro: Shadows Die Twice', systemName: systems.windows },
  { title: 'Hades', systemName: systems.windows },
  { title: 'Hades II', systemName: systems.windows },
  { title: 'DAVE THE DIVER', systemName: systems.windows },
]

async function gamesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding games...')

  // Get all systems first
  const systems = await prisma.system.findMany()
  const systemMap = new Map(systems.map((system) => [system.name, system.id]))

  for (const game of games) {
    const systemId = systemMap.get(game.systemName)
    if (!systemId) {
      console.warn(
        `System "${game.systemName}" not found, skipping game "${game.title}"`,
      )
      continue
    }

    await prisma.game.upsert({
      where: {
        title_systemId: {
          title: game.title,
          systemId,
        },
      },
      update: {},
      create: {
        title: game.title,
        systemId,
      },
    })
  }

  console.log('✅ Games seeded successfully')
}

export default gamesSeeder
