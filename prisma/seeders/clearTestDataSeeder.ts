import { type PrismaClient } from '@orm'

// These are the exact sample notes used in listingsSeeder.ts
// We'll use these to identify which listings were created by the seeder
const SEEDED_LISTING_NOTES = [
  // Perfect
  'Runs flawlessly at full speed with no issues.',
  'Perfect emulation with enhanced graphics.',
  'Solid 60 FPS throughout the entire game.',
  'No graphical glitches or audio issues.',
  'Enhanced resolution and textures work great.',

  // Great
  'Runs at near full speed with minor occasional dips.',
  'Great performance with very few non-game-breaking issues.',
  'Mostly stable with occasional frame drops in demanding areas.',
  'Audio and video sync perfectly most of the time.',
  'Enhanced settings work well with minor adjustments.',

  // Playable
  'Generally playable but has some frame drops.',
  'Runs well enough to complete the game.',
  'Some minor graphical glitches but nothing game-breaking.',
  'Performance varies depending on the area.',
  'Requires tweaking settings for optimal experience.',

  // Poor
  'Runs but with significant performance issues.',
  'Single digit FPS in most areas.',
  'Playable but not enjoyable due to poor performance.',
  'Requires lowest settings and still struggles.',
  'Better to wait for emulator improvements.',

  // Ingame
  'Loads and plays but has major issues.',
  'Frequent crashes and graphical corruption.',
  'Audio issues make it barely playable.',
  'Many game mechanics do not work correctly.',
  'Needs significant work from emulator developers.',

  // Intro
  'Only gets past the intro screen.',
  'Crashes after initial loading.',
  'Menu works but gameplay does not start.',
  'Unable to progress beyond character selection.',
  'Emulator compatibility issues prevent gameplay.',

  // Loadable
  'Game loads but does not start properly.',
  'Stuck on loading screen.',
  'Shows title screen but nothing else.',
  'Emulator recognizes the game but cannot run it.',
  'Compatibility layer needs work.',

  // Nothing
  'Does not work at all.',
  'Emulator does not recognize the game.',
  'Immediate crash on loading.',
  'Complete incompatibility.',
  'Requires different emulator or major updates.',
]

// Sample comments used in listingsSeeder.ts
const SEEDED_COMMENT_CONTENT = [
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

async function clearTestDataSeeder(prisma: PrismaClient) {
  console.info('🧹 Clearing test data created by listingsSeeder...')

  try {
    // First, find all listings that were created by the seeder
    // These can be identified by their notes content
    const seededListings = await prisma.listing.findMany({
      where: { notes: { in: SEEDED_LISTING_NOTES } },
      select: {
        id: true,
        notes: true,
        game: { select: { title: true } },
        device: {
          select: {
            brand: { select: { name: true } },
            modelName: true,
          },
        },
        emulator: { select: { name: true } },
      },
    })

    if (seededListings.length === 0) {
      console.info('✅ No seeded listings found to delete.')
      return
    }

    console.info(`🔍 Found ${seededListings.length} seeded listings to delete:`)
    seededListings.forEach((listing) => {
      console.info(
        `   - ${listing.game.title} on ${listing.device.brand.name} ${listing.device.modelName} (${listing.emulator.name})`,
      )
    })

    const listingIds = seededListings.map((listing) => listing.id)

    // Delete votes for these listings
    const deletedVotes = await prisma.vote.deleteMany({
      where: { listingId: { in: listingIds } },
    })

    console.info(`🗳️  Deleted ${deletedVotes.count} votes`)

    // Delete comments for these listings (and their votes)
    const seededComments = await prisma.comment.findMany({
      where: {
        listingId: { in: listingIds },
        content: { in: SEEDED_COMMENT_CONTENT },
      },
      select: { id: true },
    })

    if (seededComments.length > 0) {
      const commentIds = seededComments.map((comment) => comment.id)

      // Delete comment votes first
      const deletedCommentVotes = await prisma.commentVote.deleteMany({
        where: { commentId: { in: commentIds } },
      })

      console.info(`🗳️  Deleted ${deletedCommentVotes.count} comment votes`)

      // Delete the comments
      const deletedComments = await prisma.comment.deleteMany({
        where: { id: { in: commentIds } },
      })

      console.info(`💬 Deleted ${deletedComments.count} comments`)
    }

    // Delete custom field values for these listings
    const deletedCustomFieldValues =
      await prisma.listingCustomFieldValue.deleteMany({
        where: { listingId: { in: listingIds } },
      })

    console.info(
      `🔧 Deleted ${deletedCustomFieldValues.count} custom field values`,
    )

    // Finally, delete the listings themselves
    const deletedListings = await prisma.listing.deleteMany({
      where: { id: { in: listingIds } },
    })

    console.info(`📝 Deleted ${deletedListings.count} listings`)

    console.info('✅ Test data cleanup completed successfully!')
    console.info(`📊 Summary:`)
    console.info(`   📝 ${deletedListings.count} listings deleted`)
    console.info(`   👍 ${deletedVotes.count} votes deleted`)
    console.info(`   💬 ${seededComments.length} comments deleted`)
    console.info(
      `   🔧 ${deletedCustomFieldValues.count} custom field values deleted`,
    )
  } catch (error) {
    console.error('❌ Error during test data cleanup:', error)
    throw error
  }
}

export default clearTestDataSeeder
