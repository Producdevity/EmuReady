import type { Prisma } from '@orm'
import { prisma } from '@/server/db'
import { listingBasicInclude } from './fragments'
import { getUserVotesForListings } from '../votes/fragments'

// Helper to build listing include with optional user votes
export function getListingIncludeWithVotes(userId?: string) {
  return {
    ...listingBasicInclude,
    votes: getUserVotesForListings(userId),
  } satisfies Prisma.ListingInclude
}

// Helper to calculate listing success rate
export async function calculateListingSuccessRate(listingId: string) {
  const [upVotes, totalVotes] = await Promise.all([
    prisma.vote.count({
      where: { listingId, value: true },
    }),
    prisma.vote.count({
      where: { listingId },
    }),
  ])

  return totalVotes > 0 ? upVotes / totalVotes : 0
}

// Helper to get listing with success rate and user vote
export async function getListingWithStats(listingId: string, userId?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: getListingIncludeWithVotes(userId),
  })

  if (!listing) return null

  const successRate = await calculateListingSuccessRate(listingId)
  const userVote =
    userId && listing.votes.length > 0 ? listing.votes[0].value : null

  return {
    ...listing,
    successRate,
    userVote,
    votes: undefined, // Remove raw votes array
  }
}

// Helper for paginated listings with stats
export async function getListingsWithStats(
  where: Prisma.ListingWhereInput,
  orderBy: Prisma.ListingOrderByWithRelationInput[],
  skip: number,
  take: number,
  userId?: string,
) {
  const listings = await prisma.listing.findMany({
    where,
    include: getListingIncludeWithVotes(userId),
    orderBy,
    skip,
    take,
  })

  // Calculate success rates for all listings
  const listingsWithStats = await Promise.all(
    listings.map(async (listing) => {
      const successRate = await calculateListingSuccessRate(listing.id)
      const userVote =
        userId && listing.votes.length > 0 ? listing.votes[0].value : null

      return {
        ...listing,
        successRate,
        userVote,
        votes: undefined, // Remove raw votes array
      }
    }),
  )

  return listingsWithStats
}

// Advanced helper for the complex listings query with all filters and sorting
export async function getFilteredListings({
  where,
  orderBy,
  page,
  limit,
  userId,
}: {
  where: Prisma.ListingWhereInput
  orderBy: Prisma.ListingOrderByWithRelationInput[]
  page: number
  limit: number
  userId?: string
}) {
  const skip = (page - 1) * limit

  // Get total count for pagination
  const total = await prisma.listing.count({ where })

  // Get listings with stats
  const listingsWithStats = await getListingsWithStats(
    where,
    orderBy,
    skip,
    limit,
    userId,
  )

  return {
    listings: listingsWithStats,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  }
}
