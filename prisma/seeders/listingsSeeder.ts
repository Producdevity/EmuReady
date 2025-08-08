import { Role, ApprovalStatus, type PrismaClient } from '@orm'

// Helper function to get random element from array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to get random elements from array (without duplicates)
function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

// Sample notes for different performance levels
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

// Sample comment content
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

async function createVotesAndComments(
  prisma: PrismaClient,
  listingId: string,
  users: Array<{ id: string; role: Role }>,
) {
  // Add some random votes (60% upvotes, 40% downvotes)
  const votersCount = Math.floor(Math.random() * 8) + 2 // 2-9 voters
  const voters = getRandomElements(users, votersCount)

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
    const commenters = getRandomElements(users, commenterCount)

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

  console.info(
    `📊 Found ${devices.length} devices, ${games.length} games, ${emulators.length} emulators`,
  )

  let totalListingsCreated = 0
  let totalVotesCreated = 0
  let totalCommentsCreated = 0

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
    const selectedGames = getRandomElements(compatibleGames, 2)

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

  console.info('✅ Listings seeding completed!')
  console.info(`📈 Statistics:`)
  console.info(`   📝 ${totalListingsCreated} listings created`)
  console.info(`   👍 ${totalVotesCreated} votes added`)
  console.info(`   💬 ${totalCommentsCreated} comments added`)
  console.info(`   ✅ ~50% of listings are auto-approved for testing`)
}

export default listingsSeeder
