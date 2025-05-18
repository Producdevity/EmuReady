import { type PrismaClient } from '@orm'

type GameData = {
  title: string
  systemName: string // We'll use this to look up the system ID
}

const games: GameData[] = [
  // Nintendo GameCube
  { title: "Luigi's Mansion", systemName: 'Nintendo GameCube' },
  { title: 'Animal Crossing', systemName: 'Nintendo GameCube' },
  { title: 'Metroid Prime', systemName: 'Nintendo GameCube' },
  { title: 'Pikmin', systemName: 'Nintendo GameCube' },
  { title: 'Super Mario Sunshine', systemName: 'Nintendo GameCube' },
  { title: 'Super Smash Bros. Melee', systemName: 'Nintendo GameCube' },
  {
    title: 'The Legend of Zelda: Twilight Princess',
    systemName: 'Nintendo GameCube',
  },
  { title: 'The Legend of Zelda: Wind Waker', systemName: 'Nintendo GameCube' },

  // Nintendo 3DS
  { title: "Luigi's Mansion: Dark Moon", systemName: 'Nintendo 3DS' },
  {
    title: "The Legend of Zelda: Majora's Mask 3D",
    systemName: 'Nintendo 3DS',
  },
  { title: 'Fire Emblem: Awakening', systemName: 'Nintendo 3DS' },
  { title: 'Mario Kart 7', systemName: 'Nintendo 3DS' },
  { title: 'Mario Kart 8 Deluxe', systemName: 'Nintendo Switch' },
  { title: 'New Super Mario Bros. 2', systemName: 'Nintendo 3DS' },
  { title: 'Pokémon X/Y', systemName: 'Nintendo 3DS' },
  { title: 'Super Mario 3D Land', systemName: 'Nintendo 3DS' },
  { title: 'Super Mario Maker for Nintendo 3DS', systemName: 'Nintendo 3DS' },
  { title: 'Super Mario Maker for Nintendo 3DS', systemName: 'Nintendo 3DS' },
  {
    title: 'The Legend of Zelda: A Link Between Worlds',
    systemName: 'Nintendo 3DS',
  },
  {
    title: 'The Legend of Zelda: Ocarina of Time 3D',
    systemName: 'Nintendo 3DS',
  },
  {
    title: 'The Legend of Zelda: Phantom Hourglass',
    systemName: 'Nintendo 3DS',
  },
  { title: 'The Legend of Zelda: Spirit Tracks', systemName: 'Nintendo 3DS' },
  {
    title: 'The Legend of Zelda: Tri Force Heroes',
    systemName: 'Nintendo 3DS',
  },

  // Nintendo Wii
  { title: 'Super Mario Galaxy 2', systemName: 'Nintendo Wii' },
  { title: 'Super Mario Galaxy', systemName: 'Nintendo Wii' },
  { title: 'The Legend of Zelda: Skyward Sword', systemName: 'Nintendo Wii' },
  {
    title: 'The Legend of Zelda: Twilight Princess',
    systemName: 'Nintendo Wii',
  },
  { title: 'The Legend of Zelda: Wind Waker HD', systemName: 'Nintendo Wii U' },

  // Nintendo Wii U
  { title: 'Mario Kart 8', systemName: 'Nintendo Wii U' },
  { title: 'Splatoon', systemName: 'Nintendo Wii U' },
  { title: 'Super Mario 3D World', systemName: 'Nintendo Wii U' },
  { title: 'Super Mario Maker', systemName: 'Nintendo Wii U' },
  {
    title: 'The Legend of Zelda: Breath of the Wild',
    systemName: 'Nintendo Wii U',
  },
  {
    title: 'The Legend of Zelda: The Wind Waker HD',
    systemName: 'Nintendo Wii U',
  },
  {
    title: 'The Legend of Zelda: Twilight Princess HD',
    systemName: 'Nintendo Wii U',
  },

  // Nintendo Switch
  { title: "Luigi's Mansion 2", systemName: 'Nintendo Switch' },
  { title: "Luigi's Mansion 3", systemName: 'Nintendo Switch' },
  {
    title: "Super Mario 3D World + Bowser's Fury",
    systemName: 'Nintendo Switch',
  },
  { title: 'Animal Crossing: New Horizons', systemName: 'Nintendo Switch' },
  { title: 'Bayonetta 3', systemName: 'Nintendo Switch' },
  { title: 'Fire Emblem: Three Houses', systemName: 'Nintendo Switch' },
  { title: 'Hades', systemName: 'Nintendo Switch' },
  { title: 'Mario Kart 8 Deluxe', systemName: 'Nintendo Switch' },
  { title: 'Metroid Dread', systemName: 'Nintendo Switch' },
  { title: 'Monster Hunter Rise', systemName: 'Nintendo Switch' },
  { title: 'Monster Hunter Rise: Sunbreak', systemName: 'Nintendo Switch' },
  { title: 'Octopath Traveler', systemName: 'Nintendo Switch' },
  { title: 'Splatoon 2', systemName: 'Nintendo Switch' },
  { title: 'Splatoon 3', systemName: 'Nintendo Switch' },
  { title: 'Super Mario Maker 2', systemName: 'Nintendo Switch' },
  { title: 'Super Mario Odyssey', systemName: 'Nintendo Switch' },
  { title: 'Super Mario Party', systemName: 'Nintendo Switch' },
  { title: 'Super Smash Bros. Ultimate', systemName: 'Nintendo Switch' },
  {
    title: 'The Legend of Zelda: Breath of the Wild',
    systemName: 'Nintendo Switch',
  },
  {
    title: 'The Legend of Zelda: Skyward Sword HD',
    systemName: 'Nintendo Switch',
  },
  {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    systemName: 'Nintendo Switch',
  },
  { title: 'Xenoblade Chronicles 2', systemName: 'Nintendo Switch' },
  { title: 'Xenoblade Chronicles 3', systemName: 'Nintendo Switch' },

  // Sony PlayStation 1
  { title: 'Final Fantasy VII', systemName: 'Sony PlayStation' },
  { title: 'Metal Gear Solid', systemName: 'Sony PlayStation' },
  {
    title: 'Castlevania: Symphony of the Night',
    systemName: 'Sony PlayStation',
  },
  { title: 'Resident Evil', systemName: 'Sony PlayStation' },
  { title: 'Final Fantasy IX', systemName: 'Sony PlayStation' },
  { title: 'Tekken 3', systemName: 'Sony PlayStation' },
  { title: 'Crash Bandicoot', systemName: 'Sony PlayStation' },
  { title: 'Spyro the Dragon', systemName: 'Sony PlayStation' },

  // Sony PlayStation 2
  { title: 'Final Fantasy X', systemName: 'Sony PlayStation 2' },
  { title: 'Final Fantasy XII', systemName: 'Sony PlayStation 2' },
  { title: 'God of War II', systemName: 'Sony PlayStation 2' },
  { title: 'Grand Theft Auto: San Andreas', systemName: 'Sony PlayStation 2' },
  {
    title: 'Metal Gear Solid 2: Sons of Liberty',
    systemName: 'Sony PlayStation 2',
  },
  { title: 'Shadow of the Colossus', systemName: 'Sony PlayStation 2' },

  // Sony PlayStation Portable
  {
    title: 'Call of Duty: Roads to Victory',
    systemName: 'Sony PlayStation Portable',
  },
  {
    title: 'Crisis Core: Final Fantasy VII',
    systemName: 'Sony PlayStation Portable',
  },
  { title: 'Daxter', systemName: 'Sony PlayStation Portable' },
  {
    title: 'God of War: Ghost of Sparta',
    systemName: 'Sony PlayStation Portable',
  },
  { title: 'LocoRoco', systemName: 'Sony PlayStation Portable' },
  {
    title: 'Monster Hunter Freedom Unite',
    systemName: 'Sony PlayStation Portable',
  },
  { title: 'Patapon', systemName: 'Sony PlayStation Portable' },

  // Sony PlayStation Vita
  { title: 'Persona 4 Golden', systemName: 'Sony PlayStation Vita' },
  { title: 'Uncharted: Golden Abyss', systemName: 'Sony PlayStation Vita' },
  { title: 'Killzone: Mercenary', systemName: 'Sony PlayStation Vita' },
  { title: 'Gravity Rush', systemName: 'Sony PlayStation Vita' },
  {
    title: 'Danganronpa: Trigger Happy Havoc',
    systemName: 'Sony PlayStation Vita',
  },
  { title: 'Tales of Hearts R', systemName: 'Sony PlayStation Vita' },

  // Sony PlayStation 3
  { title: 'The Last of Us', systemName: 'Sony PlayStation 3' },
  { title: 'Uncharted 2: Among Thieves', systemName: 'Sony PlayStation 3' },
  {
    title: 'Metal Gear Solid V: The Phantom Pain',
    systemName: 'Sony PlayStation 3',
  },

  // Sony Playstation 4
  { title: 'Bloodborne', systemName: 'Sony PlayStation 4' },
  { title: 'The Last of Us Part II', systemName: 'Sony PlayStation 4' },
  { title: 'God of War (2018)', systemName: 'Sony PlayStation 4' },

  // Microsoft Xbox 360
  { title: 'Halo 3', systemName: 'Microsoft Xbox 360' },
  { title: 'Gears of War', systemName: 'Microsoft Xbox 360' },
  { title: 'Forza Horizon', systemName: 'Microsoft Xbox 360' },

  // Microsoft Windows
  { title: 'Half-Life', systemName: 'Microsoft Windows' },
  { title: 'Half-Life 2', systemName: 'Microsoft Windows' },
  {
    title: 'The Witcher 2: Assassins of Kings',
    systemName: 'Microsoft Windows',
  },
  { title: 'The Witcher 3: Wild Hunt', systemName: 'Microsoft Windows' },
  { title: 'Dark Souls Remastered', systemName: 'Microsoft Windows' },
  { title: 'Dark Souls II', systemName: 'Microsoft Windows' },
  { title: 'Dark Souls III', systemName: 'Microsoft Windows' },
  { title: 'Sekiro: Shadows Die Twice', systemName: 'Microsoft Windows' },
  { title: 'Hades', systemName: 'Microsoft Windows' },
  { title: 'Hades II', systemName: 'Microsoft Windows' },
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
