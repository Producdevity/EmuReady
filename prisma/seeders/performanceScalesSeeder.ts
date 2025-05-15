import { type PrismaClient } from '@orm'

const performanceScales = [
  { label: 'Nothing', rank: 1, discription: 'Does not work at all.' },
  { label: 'Loadable', rank: 2, discription: 'Loads but does not play.' },
  { label: 'Intro', rank: 3, discription: 'Does not play past intro or menu.' },
  { label: 'Ingame', rank: 4, discription: 'Plays but has major issues.' },
  { label: 'Playable', rank: 5, discription: 'Plays but has minor issues.' },
  { label: 'Perfect', rank: 6, discription: 'Plays perfectly.' },
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
