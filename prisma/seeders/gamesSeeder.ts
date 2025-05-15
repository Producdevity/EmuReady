import { type PrismaClient } from '../generated/client'

type GameData = {
  title: string
  systemName: string // We'll use this to look up the system ID
}

const games: GameData[] = [
  // Nintendo GameCube
  { title: 'Super Smash Bros. Melee', systemName: 'Nintendo GameCube' },
  { title: 'The Legend of Zelda: Wind Waker', systemName: 'Nintendo GameCube' },
  { title: 'Metroid Prime', systemName: 'Nintendo GameCube' },
  
  // Nintendo Switch
  { title: 'The Legend of Zelda: Breath of the Wild', systemName: 'Nintendo Switch' },
  { title: 'Super Mario Odyssey', systemName: 'Nintendo Switch' },
  { title: 'Animal Crossing: New Horizons', systemName: 'Nintendo Switch' },
  
  // Sony PlayStation 2
  { title: 'God of War II', systemName: 'Sony PlayStation 2' },
  { title: 'Final Fantasy X', systemName: 'Sony PlayStation 2' },
  { title: 'Grand Theft Auto: San Andreas', systemName: 'Sony PlayStation 2' },
  
  // Sony PlayStation Portable
  { title: 'God of War: Ghost of Sparta', systemName: 'Sony PlayStation Portable' },
  { title: 'Crisis Core: Final Fantasy VII', systemName: 'Sony PlayStation Portable' },
  { title: 'Monster Hunter Freedom Unite', systemName: 'Sony PlayStation Portable' },
  
  // Nintendo 3DS
  { title: 'The Legend of Zelda: Ocarina of Time 3D', systemName: 'Nintendo 3DS' },
  { title: 'Pokémon X/Y', systemName: 'Nintendo 3DS' },
  { title: 'Fire Emblem: Awakening', systemName: 'Nintendo 3DS' },
]

async function gamesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding games...')
  
  // Get all systems first
  const systems = await prisma.system.findMany()
  const systemMap = new Map(systems.map(system => [system.name, system.id]))
  
  for (const game of games) {
    const systemId = systemMap.get(game.systemName)
    if (!systemId) {
      console.warn(`System "${game.systemName}" not found, skipping game "${game.title}"`)
      continue
    }
    
    await prisma.game.upsert({
      where: {
        title_systemId: {
          title: game.title,
          systemId,
        }
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