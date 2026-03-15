import {
  RISK_SIGNAL_TYPES,
  type AuthorRiskProfile,
  type AuthorRiskSignal,
  type RiskSignalType,
} from '@/schemas/authorRisk'
import { type Severity } from '@/schemas/common'
import { TIME_CONSTANTS } from '@/utils/time'
import { ApprovalStatus, type PrismaClient } from '@orm'
import { getAuthorReportStats, getAuthorVoteStats, getAuthorsWithApprovedListings } from '@orm/sql'

interface ExistingBan {
  reason: string
}

const SEVERITY_ORDER: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

function createSignal(
  type: RiskSignalType,
  severity: Severity,
  label: string,
  description: string,
): AuthorRiskSignal {
  return { type, severity, label, description }
}

function highestSeverity(signals: AuthorRiskSignal[]): Severity | null {
  if (signals.length === 0) return null
  let max: Severity = signals[0].severity
  for (const signal of signals) {
    if (SEVERITY_ORDER[signal.severity] > SEVERITY_ORDER[max]) {
      max = signal.severity
    }
  }
  return max
}

interface VoteStats {
  totalVotes: number
  downvoteRatio: number
  votesLast24h: number
}

/**
 * Counts active reports (PENDING or UNDER_REVIEW) per author across both
 * handheld and PC listing types using a TypedSQL query.
 */
async function batchGetAuthorReportStats(
  prisma: PrismaClient,
  authorIds: string[],
): Promise<Map<string, number>> {
  const rows = await prisma.$queryRawTyped(getAuthorReportStats(authorIds))

  const reportCountMap = new Map<string, number>()
  for (const row of rows) {
    if (row.authorId && row.reportCount) {
      reportCountMap.set(row.authorId, row.reportCount)
    }
  }
  return reportCountMap
}

/**
 * Computes vote statistics per author (total votes, downvote ratio, 24h volume)
 * across both handheld and PC listing votes using a TypedSQL query with
 * FILTER clauses for conditional aggregation.
 */
async function batchCheckVoteFlags(
  prisma: PrismaClient,
  authorIds: string[],
): Promise<Map<string, VoteStats>> {
  const twentyFourHoursAgo = new Date(Date.now() - TIME_CONSTANTS.ONE_DAY)

  const rows = await prisma.$queryRawTyped(getAuthorVoteStats(authorIds, twentyFourHoursAgo))

  const voteStatsMap = new Map<string, VoteStats>()
  for (const row of rows) {
    if (!row.userId) continue
    const totalVotes = row.totalVotes ?? 0
    const downvotes = row.downvotes ?? 0
    const downvoteRatio = totalVotes > 0 ? downvotes / totalVotes : 0
    voteStatsMap.set(row.userId, {
      totalVotes,
      downvoteRatio,
      votesLast24h: row.votesLast24h ?? 0,
    })
  }
  return voteStatsMap
}

/**
 * Identifies authors with no approved listings across both handheld and PC
 * listing types using a TypedSQL query.
 */
async function batchCheckNewAuthors(
  prisma: PrismaClient,
  authorIds: string[],
): Promise<Set<string>> {
  const rows = await prisma.$queryRawTyped(getAuthorsWithApprovedListings(authorIds))

  const authorsWithApproved = new Set(rows.map((r) => r.authorId).filter(Boolean) as string[])
  return new Set(authorIds.filter((id) => !authorsWithApproved.has(id)))
}

async function batchGetTrustScores(
  prisma: PrismaClient,
  authorIds: string[],
): Promise<Map<string, number>> {
  const users = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, trustScore: true },
  })

  const trustScoreMap = new Map<string, number>()
  for (const user of users) {
    trustScoreMap.set(user.id, user.trustScore)
  }
  return trustScoreMap
}

async function batchGetRejectionCounts(
  prisma: PrismaClient,
  authorIds: string[],
): Promise<Map<string, number>> {
  const [listingRejections, pcListingRejections] = await Promise.all([
    prisma.listing.groupBy({
      by: ['authorId'],
      where: { authorId: { in: authorIds }, status: ApprovalStatus.REJECTED },
      _count: true,
    }),
    prisma.pcListing.groupBy({
      by: ['authorId'],
      where: { authorId: { in: authorIds }, status: ApprovalStatus.REJECTED },
      _count: true,
    }),
  ])

  const rejectionMap = new Map<string, number>()
  for (const row of listingRejections) {
    rejectionMap.set(row.authorId, (rejectionMap.get(row.authorId) ?? 0) + row._count)
  }
  for (const row of pcListingRejections) {
    rejectionMap.set(row.authorId, (rejectionMap.get(row.authorId) ?? 0) + row._count)
  }
  return rejectionMap
}

export async function computeAuthorRiskProfiles(
  prisma: PrismaClient,
  authorIds: string[],
  existingBans: Map<string, ExistingBan[]>,
): Promise<Map<string, AuthorRiskProfile>> {
  const profileMap = new Map<string, AuthorRiskProfile>()

  if (authorIds.length === 0) return profileMap

  const uniqueIds = [...new Set(authorIds)]

  const [reportStats, voteStats, newAuthors, trustScores, rejectionCounts] = await Promise.all([
    batchGetAuthorReportStats(prisma, uniqueIds),
    batchCheckVoteFlags(prisma, uniqueIds),
    batchCheckNewAuthors(prisma, uniqueIds),
    batchGetTrustScores(prisma, uniqueIds),
    batchGetRejectionCounts(prisma, uniqueIds),
  ])

  for (const authorId of uniqueIds) {
    const signals: AuthorRiskSignal[] = []

    // ACTIVE_BAN
    const bans = existingBans.get(authorId)
    if (bans && bans.length > 0) {
      const reason = bans[0].reason
      const truncatedReason = reason.length > 80 ? `${reason.slice(0, 80)}...` : reason
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.ACTIVE_BAN,
          'high',
          'Active Ban',
          `Banned for: ${truncatedReason}`,
        ),
      )
    }

    // ACTIVE_REPORTS
    const reportCount = reportStats.get(authorId) ?? 0
    if (reportCount >= 6) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
          'high',
          'Active Reports',
          `${reportCount} active reports across listings`,
        ),
      )
    } else if (reportCount >= 3) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
          'medium',
          'Active Reports',
          `${reportCount} active reports across listings`,
        ),
      )
    } else if (reportCount >= 1) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
          'low',
          'Active Reports',
          `${reportCount} active report${reportCount > 1 ? 's' : ''} across listings`,
        ),
      )
    }

    // SUSPICIOUS_VOTING
    const votes = voteStats.get(authorId)
    if (votes) {
      if (votes.totalVotes > 5) {
        if (votes.downvoteRatio > 0.95) {
          signals.push(
            createSignal(
              RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING,
              'high',
              'Suspicious Voting',
              `${Math.round(votes.downvoteRatio * 100)}% downvote rate (${votes.totalVotes} total votes)`,
            ),
          )
        } else if (votes.downvoteRatio > 0.9) {
          signals.push(
            createSignal(
              RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING,
              'medium',
              'Suspicious Voting',
              `${Math.round(votes.downvoteRatio * 100)}% downvote rate (${votes.totalVotes} total votes)`,
            ),
          )
        }
      }

      if (votes.votesLast24h > 50) {
        signals.push(
          createSignal(
            RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING,
            'high',
            'High Vote Volume',
            `${votes.votesLast24h} votes in the last 24 hours`,
          ),
        )
      } else if (votes.votesLast24h > 30) {
        signals.push(
          createSignal(
            RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING,
            'medium',
            'High Vote Volume',
            `${votes.votesLast24h} votes in the last 24 hours`,
          ),
        )
      }
    }

    // NEW_AUTHOR
    if (newAuthors.has(authorId)) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.NEW_AUTHOR,
          'low',
          'New Author',
          'No previously approved listings',
        ),
      )
    }

    // NEGATIVE_TRUST_SCORE
    const trustScore = trustScores.get(authorId) ?? 0
    if (trustScore < -50) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.NEGATIVE_TRUST_SCORE,
          'high',
          'Negative Trust',
          `Trust score: ${trustScore}`,
        ),
      )
    } else if (trustScore < -20) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.NEGATIVE_TRUST_SCORE,
          'medium',
          'Negative Trust',
          `Trust score: ${trustScore}`,
        ),
      )
    } else if (trustScore < 0) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.NEGATIVE_TRUST_SCORE,
          'low',
          'Negative Trust',
          `Trust score: ${trustScore}`,
        ),
      )
    }

    // PREVIOUSLY_REJECTED
    const rejectedCount = rejectionCounts.get(authorId) ?? 0
    if (rejectedCount >= 6) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.PREVIOUSLY_REJECTED,
          'high',
          'Previously Rejected',
          `${rejectedCount} rejected listings`,
        ),
      )
    } else if (rejectedCount >= 3) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.PREVIOUSLY_REJECTED,
          'medium',
          'Previously Rejected',
          `${rejectedCount} rejected listings`,
        ),
      )
    } else if (rejectedCount >= 1) {
      signals.push(
        createSignal(
          RISK_SIGNAL_TYPES.PREVIOUSLY_REJECTED,
          'low',
          'Previously Rejected',
          `${rejectedCount} rejected listing${rejectedCount > 1 ? 's' : ''}`,
        ),
      )
    }

    profileMap.set(authorId, {
      authorId,
      signals,
      highestSeverity: highestSeverity(signals),
    })
  }

  return profileMap
}
