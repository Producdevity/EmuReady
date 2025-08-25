import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

async function verifyVoteCounts() {
  console.log('🔍 Verifying vote count data integrity...\n')

  try {
    // Check regular listings
    console.log('=== REGULAR LISTINGS ===')

    // Get a few listings with votes
    const listingsWithVotes = await prisma.listing.findMany({
      where: { voteCount: { gt: 0 } },
      take: 5,
      select: {
        id: true,
        upvoteCount: true,
        downvoteCount: true,
        voteCount: true,
        successRate: true,
        _count: {
          select: { votes: true },
        },
        votes: {
          select: { value: true },
        },
      },
    })

    let allCorrect = true

    for (const listing of listingsWithVotes) {
      const actualUpvotes = listing.votes.filter((v) => v.value).length
      const actualDownvotes = listing.votes.filter((v) => !v.value).length
      const actualTotal = listing.votes.length

      const upvoteMatch = listing.upvoteCount === actualUpvotes
      const downvoteMatch = listing.downvoteCount === actualDownvotes
      const totalMatch = listing.voteCount === actualTotal

      console.log(`Listing ${listing.id.substring(0, 8)}:`)
      console.log(
        `  Upvotes: ${listing.upvoteCount} (actual: ${actualUpvotes}) ${upvoteMatch ? '✅' : '❌'}`,
      )
      console.log(
        `  Downvotes: ${listing.downvoteCount} (actual: ${actualDownvotes}) ${downvoteMatch ? '✅' : '❌'}`,
      )
      console.log(
        `  Total: ${listing.voteCount} (actual: ${actualTotal}) ${totalMatch ? '✅' : '❌'}`,
      )
      console.log(`  Success Rate: ${listing.successRate.toFixed(4)}`)

      if (!upvoteMatch || !downvoteMatch || !totalMatch) {
        allCorrect = false
      }
    }

    // Check PC listings
    console.log('\n=== PC LISTINGS ===')

    const pcListingsWithVotes = await prisma.pcListing.findMany({
      where: { voteCount: { gt: 0 } },
      take: 5,
      select: {
        id: true,
        upvoteCount: true,
        downvoteCount: true,
        voteCount: true,
        successRate: true,
        _count: {
          select: { votes: true },
        },
        votes: {
          select: { value: true },
        },
      },
    })

    for (const pcListing of pcListingsWithVotes) {
      const actualUpvotes = pcListing.votes.filter((v) => v.value).length
      const actualDownvotes = pcListing.votes.filter((v) => !v.value).length
      const actualTotal = pcListing.votes.length

      const upvoteMatch = pcListing.upvoteCount === actualUpvotes
      const downvoteMatch = pcListing.downvoteCount === actualDownvotes
      const totalMatch = pcListing.voteCount === actualTotal

      console.log(`PC Listing ${pcListing.id.substring(0, 8)}:`)
      console.log(
        `  Upvotes: ${pcListing.upvoteCount} (actual: ${actualUpvotes}) ${upvoteMatch ? '✅' : '❌'}`,
      )
      console.log(
        `  Downvotes: ${pcListing.downvoteCount} (actual: ${actualDownvotes}) ${downvoteMatch ? '✅' : '❌'}`,
      )
      console.log(
        `  Total: ${pcListing.voteCount} (actual: ${actualTotal}) ${totalMatch ? '✅' : '❌'}`,
      )
      console.log(`  Success Rate: ${pcListing.successRate.toFixed(4)}`)

      if (!upvoteMatch || !downvoteMatch || !totalMatch) {
        allCorrect = false
      }
    }

    // Summary statistics
    console.log('\n=== SUMMARY STATISTICS ===')

    const listingStats = await prisma.listing.aggregate({
      _sum: {
        upvoteCount: true,
        downvoteCount: true,
        voteCount: true,
      },
      _count: true,
      _avg: {
        successRate: true,
      },
    })

    const pcListingStats = await prisma.pcListing.aggregate({
      _sum: {
        upvoteCount: true,
        downvoteCount: true,
        voteCount: true,
      },
      _count: true,
      _avg: {
        successRate: true,
      },
    })

    const totalVotes = await prisma.vote.count()
    const totalPcVotes = await prisma.pcListingVote.count()

    console.log('Regular Listings:')
    console.log(`  Total listings: ${listingStats._count}`)
    console.log(`  Total upvotes: ${listingStats._sum.upvoteCount || 0}`)
    console.log(`  Total downvotes: ${listingStats._sum.downvoteCount || 0}`)
    console.log(`  Total vote count sum: ${listingStats._sum.voteCount || 0}`)
    console.log(`  Actual votes in DB: ${totalVotes}`)
    console.log(`  Average success rate: ${(listingStats._avg.successRate || 0).toFixed(4)}`)

    console.log('\nPC Listings:')
    console.log(`  Total PC listings: ${pcListingStats._count}`)
    console.log(`  Total upvotes: ${pcListingStats._sum.upvoteCount || 0}`)
    console.log(`  Total downvotes: ${pcListingStats._sum.downvoteCount || 0}`)
    console.log(`  Total vote count sum: ${pcListingStats._sum.voteCount || 0}`)
    console.log(`  Actual votes in DB: ${totalPcVotes}`)
    console.log(`  Average success rate: ${(pcListingStats._avg.successRate || 0).toFixed(4)}`)

    const voteSumMatch = (listingStats._sum.voteCount || 0) === totalVotes
    const pcVoteSumMatch = (pcListingStats._sum.voteCount || 0) === totalPcVotes

    console.log('\n=== VERIFICATION RESULT ===')
    if (allCorrect && voteSumMatch && pcVoteSumMatch) {
      console.log('✅ All vote counts are correctly populated!')
    } else {
      console.log('⚠️  Some discrepancies found in vote counts')
      if (!voteSumMatch) {
        console.log(
          `  - Listing vote sum mismatch: ${listingStats._sum.voteCount} vs ${totalVotes}`,
        )
      }
      if (!pcVoteSumMatch) {
        console.log(
          `  - PC listing vote sum mismatch: ${pcListingStats._sum.voteCount} vs ${totalPcVotes}`,
        )
      }
    }

    return allCorrect && voteSumMatch && pcVoteSumMatch
  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

verifyVoteCounts()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
