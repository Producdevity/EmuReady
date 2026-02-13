import { type ListingType, type Severity } from '@/schemas/common'
import {
  type GetUserVotesInput,
  type GetVotesOnAuthorListingsInput,
} from '@/schemas/voteInvestigation'
import { paginate } from '@/server/utils/pagination'
import { type PrismaClient } from '@orm'

interface UnifiedVote {
  id: string
  value: boolean
  createdAt: Date
  nullifiedAt: Date | null
  type: ListingType
  listingId: string
  listingTitle: string
  authorId: string | null
  authorName: string | null
}

export type VotePatternFlagType =
  | 'RAPID_VOTING'
  | 'SINGLE_AUTHOR_TARGETING'
  | 'ALL_DOWNVOTES'
  | 'HIGH_VOLUME'

interface VotePatternFlag {
  type: VotePatternFlagType
  severity: Severity
  description: string
}

interface TargetedAuthor {
  authorId: string
  authorName: string | null
  totalVotes: number
  downvotes: number
  concentration: number
}

export interface VotePatternAnalysis {
  summary: {
    totalVotes: number
    upvotes: number
    downvotes: number
    downvotePercentage: number
    votesLast24h: number
    votesLast7d: number
    averageVotesPerDay: number
  }
  targetedAuthors: TargetedAuthor[]
  flags: VotePatternFlag[]
}

export async function getUserVotes(prisma: PrismaClient, params: GetUserVotesInput) {
  const { userId, page, limit, voteType, listingType, sortField, sortDirection, includeNullified } =
    params
  const offset = (page - 1) * limit

  const valueFilter = voteType === 'up' ? true : voteType === 'down' ? false : undefined
  const nullifiedFilter = includeNullified ? {} : { nullifiedAt: null }

  const results: UnifiedVote[] = []
  let totalHandheld = 0
  let totalPc = 0

  if (listingType === 'all' || listingType === 'handheld') {
    const where = {
      userId,
      ...(valueFilter !== undefined ? { value: valueFilter } : {}),
      ...nullifiedFilter,
    }

    const [count, votes] = await Promise.all([
      prisma.vote.count({ where }),
      prisma.vote.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              authorId: true,
              game: { select: { title: true } },
              author: { select: { name: true } },
            },
          },
        },
        orderBy: sortField === 'value' ? { value: sortDirection } : { createdAt: sortDirection },
        skip: listingType === 'handheld' ? offset : undefined,
        take: listingType === 'handheld' ? limit : undefined,
      }),
    ])

    totalHandheld = count
    for (const v of votes) {
      results.push({
        id: v.id,
        value: v.value,
        createdAt: v.createdAt,
        nullifiedAt: v.nullifiedAt,
        type: 'handheld',
        listingId: v.listingId,
        listingTitle: v.listing.game.title,
        authorId: v.listing.authorId,
        authorName: v.listing.author?.name ?? null,
      })
    }
  }

  if (listingType === 'all' || listingType === 'pc') {
    const where = {
      userId,
      ...(valueFilter !== undefined ? { value: valueFilter } : {}),
      ...nullifiedFilter,
    }

    const [count, votes] = await Promise.all([
      prisma.pcListingVote.count({ where }),
      prisma.pcListingVote.findMany({
        where,
        include: {
          pcListing: {
            select: {
              id: true,
              authorId: true,
              game: { select: { title: true } },
              author: { select: { name: true } },
            },
          },
        },
        orderBy: sortField === 'value' ? { value: sortDirection } : { createdAt: sortDirection },
        skip: listingType === 'pc' ? offset : undefined,
        take: listingType === 'pc' ? limit : undefined,
      }),
    ])

    totalPc = count
    for (const v of votes) {
      results.push({
        id: v.id,
        value: v.value,
        createdAt: v.createdAt,
        nullifiedAt: v.nullifiedAt,
        type: 'pc',
        listingId: v.pcListingId,
        listingTitle: v.pcListing.game.title,
        authorId: v.pcListing.authorId,
        authorName: v.pcListing.author?.name ?? null,
      })
    }
  }

  // Sort combined results
  results.sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1
    if (sortField === 'listingTitle') {
      return a.listingTitle.localeCompare(b.listingTitle) * dir
    }
    if (sortField === 'value') {
      return (Number(a.value) - Number(b.value)) * dir
    }
    return (a.createdAt.getTime() - b.createdAt.getTime()) * dir
  })

  const total =
    listingType === 'all'
      ? totalHandheld + totalPc
      : listingType === 'handheld'
        ? totalHandheld
        : totalPc

  // For combined results, apply pagination manually
  const paginatedResults = listingType === 'all' ? results.slice(offset, offset + limit) : results

  return {
    items: paginatedResults,
    pagination: paginate({ total, page, limit }),
  }
}

export async function getVotesOnAuthorListings(
  prisma: PrismaClient,
  params: GetVotesOnAuthorListingsInput,
) {
  const { authorId, voterId, page, limit } = params
  const offset = (page - 1) * limit

  const voterFilter = voterId ? { userId: voterId } : {}

  const [handheldVotes, pcVotes] = await Promise.all([
    prisma.vote.findMany({
      where: {
        listing: { authorId },
        nullifiedAt: null,
        ...voterFilter,
      },
      include: {
        user: { select: { id: true, name: true } },
        listing: {
          select: {
            id: true,
            game: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pcListingVote.findMany({
      where: {
        pcListing: { authorId },
        nullifiedAt: null,
        ...voterFilter,
      },
      include: {
        user: { select: { id: true, name: true } },
        pcListing: {
          select: {
            id: true,
            game: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Group by voter
  const voterMap = new Map<
    string,
    {
      voterId: string
      voterName: string | null
      totalVotes: number
      upvotes: number
      downvotes: number
      votes: {
        id: string
        value: boolean
        createdAt: Date
        type: ListingType
        listingTitle: string
      }[]
    }
  >()

  for (const v of handheldVotes) {
    const existing = voterMap.get(v.userId) ?? {
      voterId: v.userId,
      voterName: v.user.name,
      totalVotes: 0,
      upvotes: 0,
      downvotes: 0,
      votes: [],
    }
    existing.totalVotes++
    if (v.value) existing.upvotes++
    else existing.downvotes++
    existing.votes.push({
      id: v.id,
      value: v.value,
      createdAt: v.createdAt,
      type: 'handheld',
      listingTitle: v.listing.game.title,
    })
    voterMap.set(v.userId, existing)
  }

  for (const v of pcVotes) {
    const existing = voterMap.get(v.userId) ?? {
      voterId: v.userId,
      voterName: v.user.name,
      totalVotes: 0,
      upvotes: 0,
      downvotes: 0,
      votes: [],
    }
    existing.totalVotes++
    if (v.value) existing.upvotes++
    else existing.downvotes++
    existing.votes.push({
      id: v.id,
      value: v.value,
      createdAt: v.createdAt,
      type: 'pc',
      listingTitle: v.pcListing.game.title,
    })
    voterMap.set(v.userId, existing)
  }

  const allVoters = [...voterMap.values()].sort((a, b) => b.downvotes - a.downvotes)
  const total = allVoters.length
  const paginatedVoters = allVoters.slice(offset, offset + limit)

  return {
    items: paginatedVoters,
    pagination: paginate({ total, page, limit }),
  }
}

export async function analyzeVotePatterns(
  prisma: PrismaClient,
  userId: string,
): Promise<VotePatternAnalysis> {
  const [handheldVotes, pcVotes] = await Promise.all([
    prisma.vote.findMany({
      where: { userId, nullifiedAt: null },
      include: {
        listing: {
          select: {
            authorId: true,
            author: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.pcListingVote.findMany({
      where: { userId, nullifiedAt: null },
      include: {
        pcListing: {
          select: {
            authorId: true,
            author: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Unify votes for analysis
  const allVotes: {
    value: boolean
    createdAt: Date
    authorId: string | null
    authorName: string | null
  }[] = []

  for (const v of handheldVotes) {
    allVotes.push({
      value: v.value,
      createdAt: v.createdAt,
      authorId: v.listing.authorId,
      authorName: v.listing.author?.name ?? null,
    })
  }
  for (const v of pcVotes) {
    allVotes.push({
      value: v.value,
      createdAt: v.createdAt,
      authorId: v.pcListing.authorId,
      authorName: v.pcListing.author?.name ?? null,
    })
  }

  // Sort by creation time
  allVotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const totalVotes = allVotes.length
  const upvotes = allVotes.filter((v) => v.value).length
  const downvotes = totalVotes - upvotes
  const votesLast24h = allVotes.filter((v) => v.createdAt >= oneDayAgo).length
  const votesLast7d = allVotes.filter((v) => v.createdAt >= sevenDaysAgo).length

  // Calculate average votes per day
  let averageVotesPerDay = 0
  if (totalVotes > 0) {
    const firstVoteDate = allVotes[0].createdAt
    const daysSinceFirst = Math.max(
      1,
      (now.getTime() - firstVoteDate.getTime()) / (24 * 60 * 60 * 1000),
    )
    averageVotesPerDay = Math.round((totalVotes / daysSinceFirst) * 100) / 100
  }

  // Analyze targeted authors
  const authorVoteMap = new Map<
    string,
    { authorName: string | null; total: number; downvotes: number }
  >()
  for (const v of allVotes) {
    if (!v.authorId) continue
    const existing = authorVoteMap.get(v.authorId) ?? {
      authorName: v.authorName,
      total: 0,
      downvotes: 0,
    }
    existing.total++
    if (!v.value) existing.downvotes++
    authorVoteMap.set(v.authorId, existing)
  }

  const targetedAuthors: TargetedAuthor[] = [...authorVoteMap.entries()]
    .map(([authorId, data]) => ({
      authorId,
      authorName: data.authorName,
      totalVotes: data.total,
      downvotes: data.downvotes,
      concentration: totalVotes > 0 ? Math.round((data.total / totalVotes) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.downvotes - a.downvotes)
    .slice(0, 20)

  // Detect patterns
  const flags: VotePatternFlag[] = []

  // RAPID_VOTING: >10 votes in a 5-minute window
  if (allVotes.length > 10) {
    const WINDOW_MS = 5 * 60 * 1000
    for (let i = 0; i <= allVotes.length - 11; i++) {
      const windowEnd = allVotes[i].createdAt.getTime() + WINDOW_MS
      let count = 0
      for (let j = i; j < allVotes.length && allVotes[j].createdAt.getTime() <= windowEnd; j++) {
        count++
      }
      if (count > 10) {
        flags.push({
          type: 'RAPID_VOTING',
          severity: count > 20 ? 'high' : 'medium',
          description: `${count} votes within a 5-minute window`,
        })
        break
      }
    }
  }

  // SINGLE_AUTHOR_TARGETING: >50% of downvotes on one author
  if (downvotes > 2) {
    for (const author of targetedAuthors) {
      const downvoteConcentration = downvotes > 0 ? author.downvotes / downvotes : 0
      if (downvoteConcentration > 0.5) {
        flags.push({
          type: 'SINGLE_AUTHOR_TARGETING',
          severity: downvoteConcentration > 0.8 ? 'high' : 'medium',
          description: `${Math.round(downvoteConcentration * 100)}% of downvotes target ${author.authorName ?? 'unknown user'} (${author.downvotes}/${downvotes})`,
        })
        break
      }
    }
  }

  // ALL_DOWNVOTES: >90% downvotes AND total > 5
  if (totalVotes > 5) {
    const downvotePercentage = downvotes / totalVotes
    if (downvotePercentage > 0.9) {
      flags.push({
        type: 'ALL_DOWNVOTES',
        severity: downvotePercentage > 0.95 ? 'high' : 'medium',
        description: `${Math.round(downvotePercentage * 100)}% of all votes are downvotes (${downvotes}/${totalVotes})`,
      })
    }
  }

  // HIGH_VOLUME: >30 votes in 24 hours
  if (votesLast24h > 30) {
    flags.push({
      type: 'HIGH_VOLUME',
      severity: votesLast24h > 50 ? 'high' : 'medium',
      description: `${votesLast24h} votes in the last 24 hours`,
    })
  }

  return {
    summary: {
      totalVotes,
      upvotes,
      downvotes,
      downvotePercentage: totalVotes > 0 ? Math.round((downvotes / totalVotes) * 10000) / 100 : 0,
      votesLast24h,
      votesLast7d,
      averageVotesPerDay,
    },
    targetedAuthors,
    flags,
  }
}
