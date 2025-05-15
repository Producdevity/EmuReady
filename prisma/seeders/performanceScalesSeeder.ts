import { type PrismaClient, type PerformanceScale } from '@orm'

type PerformanceScaleData = Pick<
  PerformanceScale,
  'label' | 'rank' | 'description'
>

const performanceScales: PerformanceScaleData[] = [
  { label: 'Nothing', rank: 1, description: 'Does not work at all.' },
  { label: 'Loadable', rank: 2, description: 'Loads but does not play.' },
  { label: 'Intro', rank: 3, description: 'Does not play past intro or menu.' },
  { label: 'Ingame', rank: 4, description: 'Plays but has major issues.' },
  { label: 'Playable', rank: 5, description: 'Plays but has minor issues.' },
  { label: 'Perfect', rank: 6, description: 'Plays perfectly.' },
]

async function performanceScalesSeeder(prisma: PrismaClient) {
  await prisma.performanceScale.deleteMany()

  for (const performanceScale of performanceScales) {
    await prisma.performanceScale.upsert({
      where: { label: performanceScale.label },
      update: {},
      create: performanceScale,
    })
  }

  console.log('PerformanceScales seeded successfully.')
}

export default performanceScalesSeeder
