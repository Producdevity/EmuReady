import { type PrismaClient } from '@orm'

type PerformanceScaleData = {
  label: string
  rank: number
  description?: string
}

const performanceScales: PerformanceScaleData[] = [
  { label: 'Perfect', rank: 8, description: 'Plays perfectly.' },
  {
    label: 'Great',
    rank: 7,
    description: 'Plays with very few non–game-breaking issues.',
  },
  {
    label: 'Playable',
    rank: 6,
    description: 'Plays but has minor issues or frame drops.',
  },
  {
    label: 'Poor',
    rank: 5,
    description: 'Plays, but FPS is in the single digits',
  },
  { label: 'Ingame', rank: 4, description: 'Plays but has major issues.' },
  { label: 'Intro', rank: 3, description: 'Does not play past intro or menu.' },
  { label: 'Loadable', rank: 2, description: 'Loads but does not play.' },
  { label: 'Nothing', rank: 1, description: 'Does not work at all.' },
]

async function performanceScalesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding performance scales...')

  for (const scale of performanceScales) {
    await prisma.performanceScale.upsert({
      where: { label: scale.label },
      update: { rank: scale.rank, description: scale.description },
      create: scale,
    })
  }

  console.log('✅ Performance scales seeded successfully')
}

export default performanceScalesSeeder
