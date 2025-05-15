import { type PrismaClient } from '@orm'

type PerformanceScaleData = {
  label: string
  rank: number
}

const performanceScales: PerformanceScaleData[] = [
  { label: 'Perfect', rank: 4 },
  { label: 'Great', rank: 3 },
  { label: 'Playable', rank: 2 },
  { label: 'Poor', rank: 1 },
  { label: 'Unplayable', rank: 0 },
  // { label: 'Nothing', rank: 1, description: 'Does not work at all.' },
  // { label: 'Loadable', rank: 2, description: 'Loads but does not play.' },
  // { label: 'Intro', rank: 3, description: 'Does not play past intro or menu.' },
  // { label: 'Ingame', rank: 4, description: 'Plays but has major issues.' },
  // { label: 'Playable', rank: 5, description: 'Plays but has minor issues.' },
  // { label: 'Perfect', rank: 6, description: 'Plays perfectly.' },
]

async function performanceScalesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding performance scales...')

  for (const scale of performanceScales) {
    await prisma.performanceScale.upsert({
      where: { label: scale.label },
      update: { rank: scale.rank },
      create: scale,
    })
  }

  console.log('✅ Performance scales seeded successfully')
}

export default performanceScalesSeeder
