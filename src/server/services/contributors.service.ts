import { startOfMonth, subDays } from 'date-fns'
import { Prisma, ApprovalStatus, type PrismaClient, type Role } from '@orm'

export type ContributorTimeframe = 'all_time' | 'this_month' | 'this_week'

export interface ContributionBreakdown {
  listings: number
  pcListings: number
  games: number
  total: number // listings + pcListings
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

export interface RawContributor {
  userId: string
  breakdown: ContributionBreakdown
}

export interface ContributorSummary {
  rank: number
  id: string
  name: string | null
  profileImage: string | null
  role: Role
  trustScore: number
  bio: string | null
  joinedAt: Date
  contributions: ContributionBreakdown
  lifetime: ContributionBreakdown
}

export interface TopContributorsSummary {
  allTime: ContributorSummary[]
  thisMonth: ContributorSummary[]
  thisWeek: ContributorSummary[]
}

export const EMPTY_TOP_CONTRIBUTORS_SUMMARY: TopContributorsSummary = {
  allTime: [],
  thisMonth: [],
  thisWeek: [],
}

export interface ContributorUserDetails {
  id: string
  name: string | null
  profileImage: string | null
  role: Role
  trustScore: number
  bio: string | null
  createdAt: Date
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

/**
 * Get top contributors using optimized raw SQL.
 * Aggregates listings + pcListings for ranking (games tracked separately).
 * Excludes banned users at the database level.
 */
export async function getTopContributorsRaw(
  prisma: PrismaClient,
  timeframe: ContributorTimeframe,
  limit: number,
): Promise<RawContributor[]> {
  const startDate = resolveContributorTimeframe(timeframe)

  // Build date filter SQL fragments - use Prisma.sql`` for empty to avoid issues with Prisma.empty
  const listingDateFilter = startDate ? Prisma.sql`AND l."createdAt" >= ${startDate}` : Prisma.sql``
  const pcListingDateFilter = startDate
    ? Prisma.sql`AND pc."createdAt" >= ${startDate}`
    : Prisma.sql``
  const gameDateFilter = startDate
    ? Prisma.sql`AND (g."approvedAt" >= ${startDate} OR (g."approvedAt" IS NULL AND g."submittedAt" >= ${startDate}))`
    : Prisma.sql``

  const results = await prisma.$queryRaw<
    {
      userId: string
      listings: bigint
      pcListings: bigint
      games: bigint
      total: bigint
      lastContributionAt: Date | null
    }[]
  >(Prisma.sql`
    WITH listing_counts AS (
      SELECT
        l."authorId" as "userId",
        COUNT(*) as count,
        MAX(l."createdAt") as "lastDate"
      FROM "Listing" l
      WHERE l.status IN ('APPROVED', 'PENDING')
        ${listingDateFilter}
      GROUP BY l."authorId"
    ),
    pc_listing_counts AS (
      SELECT
        pc."authorId" as "userId",
        COUNT(*) as count,
        MAX(pc."createdAt") as "lastDate"
      FROM "pc_listings" pc
      WHERE pc.status IN ('APPROVED', 'PENDING')
        ${pcListingDateFilter}
      GROUP BY pc."authorId"
    ),
    game_counts AS (
      SELECT
        g."submittedBy" as "userId",
        COUNT(*) as count,
        MAX(COALESCE(g."approvedAt", g."submittedAt")) as "lastDate"
      FROM "Game" g
      WHERE g.status != 'REJECTED'
        AND g."submittedBy" IS NOT NULL
        ${gameDateFilter}
      GROUP BY g."submittedBy"
    ),
    active_bans AS (
      SELECT DISTINCT "userId"
      FROM "user_bans"
      WHERE "isActive" = true
        AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
    ),
    combined AS (
      SELECT
        COALESCE(l."userId", pc."userId", g."userId") as "userId",
        COALESCE(l.count, 0) as listings,
        COALESCE(pc.count, 0) as "pcListings",
        COALESCE(g.count, 0) as games,
        COALESCE(l.count, 0) + COALESCE(pc.count, 0) as total,
        GREATEST(l."lastDate", pc."lastDate", g."lastDate") as "lastContributionAt"
      FROM listing_counts l
      FULL OUTER JOIN pc_listing_counts pc ON l."userId" = pc."userId"
      FULL OUTER JOIN game_counts g ON COALESCE(l."userId", pc."userId") = g."userId"
    )
    SELECT
      c."userId",
      c.listings,
      c."pcListings",
      c.games,
      c.total,
      c."lastContributionAt"
    FROM combined c
    WHERE c.total > 0
      AND c."userId" NOT IN (SELECT "userId" FROM active_bans)
    ORDER BY c.total DESC, c."lastContributionAt" DESC NULLS LAST
    LIMIT ${limit}
  `)

  return results.map((row) => ({
    userId: row.userId,
    breakdown: {
      listings: Number(row.listings),
      pcListings: Number(row.pcListings),
      games: Number(row.games),
      total: Number(row.total),
      lastContributionAt: row.lastContributionAt,
    },
  }))
}

export function formatContributors(
  entries: RawContributor[],
  limit: number,
  userMap: Map<string, ContributorUserDetails>,
  lifetimeMap: Map<string, ContributionBreakdown>,
): ContributorSummary[] {
  const formatted: ContributorSummary[] = []

  for (const entry of entries) {
    const user = userMap.get(entry.userId)
    if (!user) continue

    formatted.push({
      rank: formatted.length + 1,
      id: user.id,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
      trustScore: user.trustScore,
      bio: user.bio,
      joinedAt: user.createdAt,
      contributions: entry.breakdown,
      lifetime: lifetimeMap.get(entry.userId) ?? entry.breakdown,
    })

    if (formatted.length === limit) break
  }

  return formatted
}

export function buildTopContributorsSummary(
  rawResults: RawContributor[][],
  limit: number,
  userMap: Map<string, ContributorUserDetails>,
  lifetimeMap: Map<string, ContributionBreakdown>,
): TopContributorsSummary {
  const getList = (index: number) =>
    formatContributors(rawResults[index] ?? [], limit, userMap, lifetimeMap)

  return {
    allTime: getList(0),
    thisMonth: getList(1),
    thisWeek: getList(2),
  }
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
