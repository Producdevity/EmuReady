import { startOfMonth, subDays } from 'date-fns'
import { ApprovalStatus, type PrismaClient } from '@orm'

export type ContributorTimeframe = 'all_time' | 'this_month' | 'this_week'

export interface ContributionBreakdown {
  listings: number
  pcListings: number
  games: number
  total: number
  lastContributionAt: Date | null
}

interface AggregateOptions {
  startDate?: Date
  userIds?: string[]
  excludeBanned?: boolean
}

interface AggregateResult {
  [userId: string]: ContributionBreakdown
}

export function getActiveBanFilter(now: Date) {
  return {
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  }
}

export function resolveContributorTimeframe(timeframe: ContributorTimeframe): Date | undefined {
  if (timeframe === 'all_time') return undefined

  const now = new Date()

  if (timeframe === 'this_week') return subDays(now, 7)

  return startOfMonth(now)
}

function initializeContribution(userId: string, map: AggregateResult): ContributionBreakdown {
  if (!map[userId]) {
    map[userId] = {
      listings: 0,
      pcListings: 0,
      games: 0,
      total: 0,
      lastContributionAt: null,
    }
  }

  return map[userId]
}

function mergeContribution(
  map: AggregateResult,
  userId: string | null,
  contribution: Partial<ContributionBreakdown> & { lastContributionAt?: Date | null },
) {
  if (!userId) return
  const entry = initializeContribution(userId, map)

  if (typeof contribution.listings === 'number') {
    entry.listings += contribution.listings
    entry.total += contribution.listings
  }

  if (typeof contribution.pcListings === 'number') {
    entry.pcListings += contribution.pcListings
    entry.total += contribution.pcListings
  }

  if (typeof contribution.games === 'number') {
    entry.games += contribution.games
    entry.total += contribution.games
  }

  if (contribution.lastContributionAt) {
    if (!entry.lastContributionAt || contribution.lastContributionAt > entry.lastContributionAt) {
      entry.lastContributionAt = contribution.lastContributionAt
    }
  }
}

export async function aggregateContributions(
  prisma: PrismaClient,
  options: AggregateOptions = {},
): Promise<AggregateResult> {
  const { startDate, userIds } = options
  const contributionMap: AggregateResult = {}

  const listingWhere = {
    status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING] },
    ...(startDate ? { createdAt: { gte: startDate } } : {}),
    ...(userIds ? { authorId: { in: userIds } } : {}),
  }

  const pcListingWhere = {
    status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING] },
    ...(startDate ? { createdAt: { gte: startDate } } : {}),
    ...(userIds ? { authorId: { in: userIds } } : {}),
  }

  const gameWhere = {
    status: { not: ApprovalStatus.REJECTED },
    submittedBy: { not: null, ...(userIds ? { in: userIds } : {}) },
    ...(startDate
      ? {
          OR: [
            { approvedAt: { gte: startDate } },
            { AND: [{ approvedAt: null }, { submittedAt: { gte: startDate } }] },
          ],
        }
      : {}),
  }

  const [listingGroups, pcListingGroups, gameGroups] = await Promise.all([
    prisma.listing.groupBy({
      by: ['authorId'],
      where: listingWhere,
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.pcListing.groupBy({
      by: ['authorId'],
      where: pcListingWhere,
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.game.groupBy({
      by: ['submittedBy'],
      where: gameWhere,
      _count: { _all: true },
      _max: { approvedAt: true, submittedAt: true },
    }),
  ])

  listingGroups.forEach((group) => {
    mergeContribution(contributionMap, group.authorId, {
      listings: group._count._all,
      lastContributionAt: group._max.createdAt,
    })
  })

  pcListingGroups.forEach((group) => {
    mergeContribution(contributionMap, group.authorId, {
      pcListings: group._count._all,
      lastContributionAt: group._max.createdAt,
    })
  })

  gameGroups.forEach((group) => {
    const latest = group._max.approvedAt ?? group._max.submittedAt ?? null
    mergeContribution(contributionMap, group.submittedBy, {
      games: group._count._all,
      lastContributionAt: latest,
    })
  })

  return contributionMap
}

export async function getTopContributorsRaw(
  prisma: PrismaClient,
  timeframe: ContributorTimeframe,
  limit: number,
): Promise<{ userId: string; breakdown: ContributionBreakdown }[]> {
  const startDate = resolveContributorTimeframe(timeframe)
  const aggregates = await aggregateContributions(prisma, { startDate })

  const sorted = Object.entries(aggregates)
    .filter(([, breakdown]) => breakdown.total > 0)
    .sort(([, a], [, b]) => {
      if (b.total !== a.total) return b.total - a.total
      const timeA = a.lastContributionAt?.getTime() ?? 0
      const timeB = b.lastContributionAt?.getTime() ?? 0
      return timeB - timeA
    })

  return sorted.slice(0, limit).map(([userId, breakdown]) => ({ userId, breakdown }))
}

export async function getUserContributionBreakdown(
  prisma: PrismaClient,
  userId: string,
): Promise<ContributionBreakdown> {
  const contributions = await aggregateContributions(prisma, { userIds: [userId] })
  return (
    contributions[userId] ?? {
      listings: 0,
      pcListings: 0,
      games: 0,
      total: 0,
      lastContributionAt: null,
    }
  )
}
