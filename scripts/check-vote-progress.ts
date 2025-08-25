#!/usr/bin/env tsx

import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

async function checkProgress() {
  try {
    // Count listings with populated vote counts
    const [totalListings, populatedListings, totalPcListings, populatedPcListings] =
      await Promise.all([
        prisma.listing.count(),
        prisma.listing.count({
          where: {
            OR: [
              { voteCount: { gt: 0 } },
              { upvoteCount: { gt: 0 } },
              { downvoteCount: { gt: 0 } },
            ],
          },
        }),
        prisma.pcListing.count(),
        prisma.pcListing.count({
          where: {
            OR: [
              { voteCount: { gt: 0 } },
              { upvoteCount: { gt: 0 } },
              { downvoteCount: { gt: 0 } },
            ],
          },
        }),
      ])

    console.log('=== MIGRATION PROGRESS ===')
    console.log(
      `Listings: ${populatedListings}/${totalListings} processed (${Math.round((populatedListings / totalListings) * 100)}%)`,
    )
    console.log(
      `PC Listings: ${populatedPcListings}/${totalPcListings} processed (${Math.round((populatedPcListings / totalPcListings) * 100)}%)`,
    )

    // Check if all listings that have votes are populated
    const [listingsWithVotes, listingsWithVotesPopulated] = await Promise.all([
      prisma.listing.count({
        where: {
          votes: { some: {} },
        },
      }),
      prisma.listing.count({
        where: {
          votes: { some: {} },
          voteCount: { gt: 0 },
        },
      }),
    ])

    console.log(
      `\nListings with votes: ${listingsWithVotesPopulated}/${listingsWithVotes} have counts populated`,
    )

    if (listingsWithVotes === listingsWithVotesPopulated) {
      console.log('✅ All listings with votes have been processed!')
    } else {
      console.log(
        `⏳ Still need to process ${listingsWithVotes - listingsWithVotesPopulated} listings with votes`,
      )
    }
  } catch (error) {
    console.error('Error checking progress:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProgress()
