import { calculateWilsonScore } from '@/utils/wilson-score'
import { ApprovalStatus, PcOs, Role, type PrismaClient } from '@orm/client'
import {
  createCustomFieldDefinitionCache,
  seedPcListingCustomFieldValues,
} from './customFieldValueSeederUtils'

type SeedUser = { id: string; role: Role }

const pcListingFixtures = [
  {
    emulatorName: 'Eden',
    gameTitle: 'Hades',
    systemName: 'Nintendo Switch',
    cpuModelName: 'Core i7-12700K',
    gpuModelName: 'GeForce RTX 4070',
    performanceLabel: 'Great',
    memorySize: 16,
    os: PcOs.LINUX,
    osVersion: 'SteamOS 3.6',
    notes: 'Seeded PC report for Eden with categorized graphics, CPU, and Eden Veil values.',
  },
  {
    emulatorName: 'Azahar',
    gameTitle: 'The Legend of Zelda: Ocarina of Time 3D',
    systemName: 'Nintendo 3DS',
    cpuModelName: 'Core i5-12400',
    gpuModelName: 'Radeon RX 7800 XT',
    performanceLabel: 'Perfect',
    memorySize: 32,
    os: PcOs.WINDOWS,
    osVersion: 'Windows 11 24H2',
    notes: 'Seeded PC report for Azahar with categorized graphics and CPU values.',
  },
] as const

export default async function pcListingsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding PC listings...')

  const users = await prisma.user.findMany({ select: { id: true, role: true } })
  const adminUsers = users.filter(
    (user) => user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN,
  )
  const author = users[0]
  const processor = adminUsers[0]

  if (!author || !processor) {
    console.warn('No seed users or admin users found, skipping PC listings seeding')
    return
  }

  const customFieldDefinitionCache = createCustomFieldDefinitionCache()
  let pcListingsCreated = 0
  let customFieldValuesSynced = 0
  let votesCreated = 0
  let commentsCreated = 0

  for (const fixture of pcListingFixtures) {
    const [game, emulator, cpu, gpu, performance] = await Promise.all([
      prisma.game.findFirst({
        where: { title: fixture.gameTitle, system: { name: fixture.systemName } },
        select: { id: true },
      }),
      prisma.emulator.findUnique({
        where: { name: fixture.emulatorName },
        select: { id: true },
      }),
      prisma.cpu.findFirst({
        where: { modelName: fixture.cpuModelName },
        select: { id: true },
      }),
      prisma.gpu.findFirst({
        where: { modelName: fixture.gpuModelName },
        select: { id: true },
      }),
      prisma.performanceScale.findUnique({
        where: { label: fixture.performanceLabel },
        select: { id: true },
      }),
    ])

    if (!game || !emulator || !cpu || !gpu || !performance) {
      console.warn(`Skipping PC listing fixture for ${fixture.gameTitle}; missing dependency`)
      continue
    }

    const pcListing = await prisma.pcListing.create({
      data: {
        gameId: game.id,
        emulatorId: emulator.id,
        cpuId: cpu.id,
        gpuId: gpu.id,
        performanceId: performance.id,
        memorySize: fixture.memorySize,
        os: fixture.os,
        osVersion: fixture.osVersion,
        notes: fixture.notes,
        authorId: author.id,
        status: ApprovalStatus.APPROVED,
        processedAt: new Date(),
        processedNotes: 'Seeded PC report fixture.',
        processedByUserId: processor.id,
      },
    })

    pcListingsCreated += 1
    customFieldValuesSynced += await seedPcListingCustomFieldValues(
      prisma,
      customFieldDefinitionCache,
      pcListing.id,
      emulator.id,
      pcListingsCreated,
    )

    const engagement = await createPcListingEngagement(prisma, pcListing.id, users)
    votesCreated += engagement.votesCreated
    commentsCreated += engagement.commentsCreated
  }

  console.info('✅ PC listings seeding completed!')
  console.info(`📈 PC listing statistics:`)
  console.info(`   🖥️ ${pcListingsCreated} PC listings created`)
  console.info(`   ⚙️ ${customFieldValuesSynced} custom field values synced`)
  console.info(`   👍 ${votesCreated} votes added`)
  console.info(`   💬 ${commentsCreated} comments added`)
}

async function createPcListingEngagement(
  prisma: PrismaClient,
  pcListingId: string,
  users: SeedUser[],
) {
  let votesCreated = 0
  let commentsCreated = 0
  let upvotesCreated = 0
  let downvotesCreated = 0
  const voters = users.slice(0, 4)

  for (const [index, voter] of voters.entries()) {
    const isUpvote = index !== voters.length - 1
    await prisma.pcListingVote.create({
      data: {
        pcListingId,
        userId: voter.id,
        value: isUpvote,
      },
    })
    votesCreated += 1
    if (isUpvote) {
      upvotesCreated += 1
    } else {
      downvotesCreated += 1
    }
  }

  await prisma.pcListing.update({
    where: { id: pcListingId },
    data: {
      upvoteCount: upvotesCreated,
      downvoteCount: downvotesCreated,
      voteCount: votesCreated,
      successRate: calculateWilsonScore(upvotesCreated, downvotesCreated),
    },
  })

  const commenter = users[1] ?? users[0]
  if (commenter) {
    await prisma.pcListingComment.create({
      data: {
        pcListingId,
        userId: commenter.id,
        content: 'Seeded PC report comment for local testing.',
        score: 2,
      },
    })
    commentsCreated += 1
  }

  return { votesCreated, commentsCreated }
}
