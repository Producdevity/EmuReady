import { Role, ApprovalStatus, type PrismaClient } from '@orm/client'
import {
  createCustomFieldDefinitionCache,
  seedListingCustomFieldValues,
} from './customFieldValueSeederUtils'

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomUniqueElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

const sampleNotes = {
  Perfect: [
    'Runs flawlessly at full speed with no issues.',
    'Perfect emulation with enhanced graphics.',
    'Solid 60 FPS throughout the entire game.',
    'No graphical glitches or audio issues.',
    'Enhanced resolution and textures work great.',
  ],
  Great: [
    'Runs at near full speed with minor occasional dips.',
    'Great performance with very few non-game-breaking issues.',
    'Mostly stable with occasional frame drops in demanding areas.',
    'Audio and video sync perfectly most of the time.',
    'Enhanced settings work well with minor adjustments.',
  ],
  Playable: [
    'Generally playable but has some frame drops.',
    'Runs well enough to complete the game.',
    'Some minor graphical glitches but nothing game-breaking.',
    'Performance varies depending on the area.',
    'Requires tweaking settings for optimal experience.',
  ],
  Poor: [
    'Runs but with significant performance issues.',
    'Single digit FPS in most areas.',
    'Playable but not enjoyable due to poor performance.',
    'Requires lowest settings and still struggles.',
    'Better to wait for emulator improvements.',
  ],
  Ingame: [
    'Loads and plays but has major issues.',
    'Frequent crashes and graphical corruption.',
    'Audio issues make it barely playable.',
    'Many game mechanics do not work correctly.',
    'Needs significant work from emulator developers.',
  ],
  Intro: [
    'Only gets past the intro screen.',
    'Crashes after initial loading.',
    'Menu works but gameplay does not start.',
    'Unable to progress beyond character selection.',
    'Emulator compatibility issues prevent gameplay.',
  ],
  Loadable: [
    'Game loads but does not start properly.',
    'Stuck on loading screen.',
    'Shows title screen but nothing else.',
    'Emulator recognizes the game but cannot run it.',
    'Compatibility layer needs work.',
  ],
  Nothing: [
    'Does not work at all.',
    'Emulator does not recognize the game.',
    'Immediate crash on loading.',
    'Complete incompatibility.',
    'Requires different emulator or major updates.',
  ],
}

const sampleComments = [
  'Thanks for this report! Very helpful.',
  'I can confirm this works on my device too.',
  'Did you try adjusting the graphics settings?',
  'What driver version are you using?',
  'This helped me get the game running perfectly!',
  "I'm getting different results, might be device specific.",
  'Great detailed report, thanks for sharing.',
  'Any tips for improving performance?',
  'Works even better with the latest emulator update.',
  'I had similar issues until I updated my drivers.',
  'This game runs amazing on this device!',
  'Performance improved significantly after tweaking settings.',
  'Confirmed working on the same setup.',
  'Thanks for the detailed performance notes.',
  'Anyone tried this with different emulator versions?',
]

const customFieldListingFixtures = [
  {
    emulatorName: 'Azahar',
    systemName: 'Nintendo 3DS',
    notes: 'Azahar fixture with custom graphics and CPU field values.',
  },
  {
    emulatorName: 'Eden',
    systemName: 'Nintendo Switch',
    notes: 'Eden fixture with categorized graphics, CPU, and Eden Veil values.',
  },
  {
    emulatorName: 'GameNative',
    systemName: 'Microsoft Windows',
    notes: 'GameNative fixture with runtime and graphics compatibility values.',
  },
] as const

type SeedUser = { id: string; role: Role }
type SeedDevice = { id: string; brand: { name: string }; modelName: string }
type SeedGame = {
  id: string
  title: string
  systemId: string
  system: { id: string; name: string }
}
type SeedEmulator = { id: string; name: string; systems: { id: string }[] }
type SeedPerformanceScale = { id: number; label: string }

async function createVotesAndComments(prisma: PrismaClient, listingId: string, users: SeedUser[]) {
  // Add some random votes (60% upvotes, 40% downvotes)
  const votersCount = Math.floor(Math.random() * 8) + 2 // 2-9 voters
  const voters = getRandomUniqueElements(users, votersCount)

  for (const voter of voters) {
    const isUpvote = Math.random() > 0.4 // 60% chance of upvote

    await prisma.vote.create({
      data: {
        value: isUpvote,
        userId: voter.id,
        listingId,
      },
    })
  }

  // Add some random comments (30% chance per listing)
  if (Math.random() < 0.3) {
    const commenterCount = Math.floor(Math.random() * 3) + 1 // 1-3 comments
    const commenters = getRandomUniqueElements(users, commenterCount)

    for (const commenter of commenters) {
      const content = getRandomElement(sampleComments)

      await prisma.comment.create({
        data: {
          content,
          userId: commenter.id,
          listingId,
          score: Math.floor(Math.random() * 10) - 2, // -2 to 7 score
        },
      })
    }
  }
}

async function listingsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding listings with comprehensive test data...')

  // Get all required data
  const users = await prisma.user.findMany()
  const adminUsers = users.filter(
    (user) => user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN,
  )

  if (adminUsers.length === 0) {
    console.warn('No admin/super admin users found, skipping listings seeding')
    return
  }

  const devices = await prisma.device.findMany({
    include: { brand: true },
  })

  const games = await prisma.game.findMany({
    include: { system: true },
  })

  const emulators = await prisma.emulator.findMany({
    include: { systems: true },
  })

  const performanceScales = await prisma.performanceScale.findMany()
  const customFieldDefinitionCache = createCustomFieldDefinitionCache()

  console.info(
    `📊 Found ${devices.length} devices, ${games.length} games, ${emulators.length} emulators`,
  )

  let totalListingsCreated = 0
  let totalVotesCreated = 0
  let totalCommentsCreated = 0
  let totalCustomFieldValuesSynced = 0

  // Create 2 listings per device
  for (const device of devices) {
    console.info(`Creating listings for ${device.brand.name} ${device.modelName}...`)

    // Find compatible games (games that have emulators supporting their system)
    const compatibleGames = games.filter((game) =>
      emulators.some((emulator) => emulator.systems.some((system) => system.id === game.systemId)),
    )

    if (compatibleGames.length < 2) {
      console.warn(
        `Not enough compatible games for ${device.brand.name} ${device.modelName}, skipping`,
      )
      continue
    }

    // Pick 2 different games for this device
    const selectedGames = getRandomUniqueElements(compatibleGames, 2)

    for (let i = 0; i < selectedGames.length; i++) {
      const game = selectedGames[i]

      // Find compatible emulators for this game's system
      const compatibleEmulators = emulators.filter((emulator) =>
        emulator.systems.some((system) => system.id === game.systemId),
      )

      if (compatibleEmulators.length === 0) {
        console.warn(`No compatible emulators for ${game.title} on ${game.system.name}`)
        continue
      }

      const selectedEmulator = getRandomElement(compatibleEmulators)
      const selectedPerformance = getRandomElement(performanceScales)
      const author = getRandomElement(users)

      // Get sample notes for this performance level
      const notesForLevel = sampleNotes[selectedPerformance.label as keyof typeof sampleNotes]
      const notes = getRandomElement(notesForLevel)

      // First listing per device: PENDING
      // Second listing per device: APPROVED
      const isApproved = i === 1
      const processor = isApproved ? getRandomElement(adminUsers) : null

      const processedAt = isApproved
        ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date in last 30 days
        : null

      const processedNotes =
        isApproved && Math.random() > 0.7
          ? ['Verified and approved.', 'Looks good, approved!', 'Testing confirmed, approved.'][
              Math.floor(Math.random() * 3)
            ]
          : null

      try {
        const listing = await prisma.listing.create({
          data: {
            gameId: game.id,
            deviceId: device.id,
            emulatorId: selectedEmulator.id,
            performanceId: selectedPerformance.id,
            notes,
            authorId: author.id,
            status: isApproved ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
            processedAt,
            processedNotes,
            processedByUserId: processor?.id,
          },
        })

        totalListingsCreated++
        totalCustomFieldValuesSynced += await seedListingCustomFieldValues(
          prisma,
          customFieldDefinitionCache,
          listing.id,
          selectedEmulator.id,
          totalListingsCreated,
        )

        // Add votes and comments to this listing
        const votesBefore = await prisma.vote.count()
        const commentsBefore = await prisma.comment.count()

        await createVotesAndComments(prisma, listing.id, users)

        const votesAfter = await prisma.vote.count()
        const commentsAfter = await prisma.comment.count()

        totalVotesCreated += votesAfter - votesBefore
        totalCommentsCreated += commentsAfter - commentsBefore

        console.info(
          `  ✅ Created ${isApproved ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING} listing: ${game.title} (${selectedEmulator.name}) - ${selectedPerformance.label}`,
        )
      } catch (error) {
        console.error(
          `  ❌ Failed to create listing for ${game.title} on ${device.brand.name} ${device.modelName}:`,
          error,
        )
      }
    }
  }

  const fixtureResult = await createCustomFieldListingFixtures({
    prisma,
    users,
    adminUsers,
    devices,
    games,
    emulators,
    performanceScales,
    customFieldDefinitionCache,
    seedIndexStart: totalListingsCreated,
  })
  totalListingsCreated += fixtureResult.listingsCreated
  totalCustomFieldValuesSynced += fixtureResult.customFieldValuesSynced

  console.info('✅ Listings seeding completed!')
  console.info(`📈 Statistics:`)
  console.info(`   📝 ${totalListingsCreated} listings created`)
  console.info(`   ⚙️ ${totalCustomFieldValuesSynced} custom field values synced`)
  console.info(`   👍 ${totalVotesCreated} votes added`)
  console.info(`   💬 ${totalCommentsCreated} comments added`)
  console.info(`   ✅ ~50% of listings are auto-approved for testing`)
}

interface CustomFieldListingFixtureInput {
  prisma: PrismaClient
  users: SeedUser[]
  adminUsers: SeedUser[]
  devices: SeedDevice[]
  games: SeedGame[]
  emulators: SeedEmulator[]
  performanceScales: SeedPerformanceScale[]
  customFieldDefinitionCache: ReturnType<typeof createCustomFieldDefinitionCache>
  seedIndexStart: number
}

async function createCustomFieldListingFixtures(input: CustomFieldListingFixtureInput) {
  let listingsCreated = 0
  let customFieldValuesSynced = 0

  const approvedPerformance =
    input.performanceScales.find((scale) => scale.label === 'Great') ?? input.performanceScales[0]
  const processor = input.adminUsers[0]
  const author = input.users[0]
  const device = input.devices[0]

  if (!approvedPerformance || !processor || !author || !device) {
    console.warn('Missing fixture dependencies, skipping custom field listing fixtures')
    return { listingsCreated, customFieldValuesSynced }
  }

  for (const fixture of customFieldListingFixtures) {
    const emulator = input.emulators.find((candidate) => candidate.name === fixture.emulatorName)
    const game = input.games.find((candidate) => candidate.system.name === fixture.systemName)

    if (!emulator || !game) {
      console.warn(`Skipping ${fixture.emulatorName} fixture, missing emulator or game data`)
      continue
    }

    const listing = await input.prisma.listing.create({
      data: {
        gameId: game.id,
        deviceId: device.id,
        emulatorId: emulator.id,
        performanceId: approvedPerformance.id,
        notes: fixture.notes,
        authorId: author.id,
        status: ApprovalStatus.APPROVED,
        processedAt: new Date(),
        processedNotes: 'Seeded custom field fixture.',
        processedByUserId: processor.id,
      },
    })

    listingsCreated += 1
    customFieldValuesSynced += await seedListingCustomFieldValues(
      input.prisma,
      input.customFieldDefinitionCache,
      listing.id,
      emulator.id,
      input.seedIndexStart + listingsCreated,
    )
  }

  return { listingsCreated, customFieldValuesSynced }
}

export default listingsSeeder
