import { TRUST_ACTIONS, TRUST_CONFIG } from '@/lib/trust/config'
import { PrismaRepository } from '@/server/persistence/prisma.repository'
import { isRetryableTransactionError } from '@/server/utils/prisma-errors'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { ApprovalStatus, Prisma, TrustAction, type PrismaClient } from '@orm/client'

type AccountIdentity = { id: string } | { clerkId: string }

export class AccountDeletionRepository extends PrismaRepository {
  constructor(private readonly client: PrismaClient) {
    super(client)
  }

  findClerkIdentity(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { clerkId: true } })
  }

  async deleteAccount(identity: AccountIdentity) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.client.$transaction(
          async (tx) => {
            const user = await tx.user.findUnique({
              where: identity,
              select: { id: true },
            })
            if (!user) return null

            const activeBan = await tx.userBan.findFirst({
              where: {
                userId: user.id,
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              select: { id: true },
            })
            if (activeBan) {
              // Removing the author must not publish reports previously hidden by their ban.
              await tx.listing.updateMany({
                where: { authorId: user.id, status: ApprovalStatus.APPROVED },
                data: { status: ApprovalStatus.PENDING },
              })
              await tx.pcListing.updateMany({
                where: { authorId: user.id, status: ApprovalStatus.APPROVED },
                data: { status: ApprovalStatus.PENDING },
              })
            }
            await removeVoteContributions(tx, user.id)
            await tx.notificationEvent.deleteMany({ where: { triggeredBy: user.id } })
            await tx.auditLog.updateMany({
              where: { OR: [{ actorId: user.id }, { targetUserId: user.id }] },
              data: { metadata: Prisma.DbNull, ipAddress: null, userAgent: null, requestId: null },
            })
            // Database SET NULL actions do not update Prisma-managed timestamps.
            await tx.pcListing.updateMany({
              where: { authorId: user.id },
              data: { updatedAt: new Date() },
            })
            await tx.user.delete({ where: { id: user.id } })
            return user
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 },
        )
      } catch (error) {
        if (attempt < 2 && isRetryableTransactionError(error)) continue
        throw error
      }
    }
  }
}

const voteCountsSelect = {
  id: true,
  authorId: true,
  upvoteCount: true,
  downvoteCount: true,
} satisfies Prisma.ListingSelect

async function removeVoteContributions(tx: Prisma.TransactionClient, userId: string) {
  const votes = await tx.vote.findMany({
    where: { userId, nullifiedAt: null },
    select: { value: true, listing: { select: voteCountsSelect } },
  })
  const pcVotes = await tx.pcListingVote.findMany({
    where: { userId, nullifiedAt: null },
    select: { value: true, pcListing: { select: voteCountsSelect } },
  })
  const commentVotes = await tx.commentVote.findMany({
    where: { userId, nullifiedAt: null, comment: { userId: { not: userId } } },
    select: {
      value: true,
      comment: { select: { id: true, userId: true, score: true, listingId: true } },
    },
  })
  const pcCommentVotes = await tx.pcListingCommentVote.findMany({
    where: { userId, nullifiedAt: null, comment: { userId: { not: userId } } },
    select: {
      value: true,
      comment: { select: { id: true, userId: true, score: true, pcListingId: true } },
    },
  })
  await updateReportVoteCounts(
    tx,
    'handheld',
    votes.map((vote) => voteRemovalRow(vote.listing, vote.value)),
  )
  await updateReportVoteCounts(
    tx,
    'pc',
    pcVotes.map((vote) => voteRemovalRow(vote.pcListing, vote.value)),
  )
  for (const value of [true, false]) {
    const where = {
      userId: { not: userId },
      votes: { some: { userId, nullifiedAt: null, value } },
    }
    const data = { score: { increment: value ? -1 : 1 } }
    await tx.comment.updateMany({ where, data })
    await tx.pcListingComment.updateMany({ where, data })
  }

  const trustAdjustments = new Map<string, number>()
  const trustLogs: Prisma.TrustActionLogCreateManyInput[] = []
  function reverseReceivedVote(authorId: string | null, action: TrustAction) {
    if (!authorId || authorId === userId) return
    trustAdjustments.set(
      authorId,
      (trustAdjustments.get(authorId) ?? 0) - TRUST_ACTIONS[action].weight,
    )
  }
  for (const vote of votes) {
    reverseReceivedVote(
      vote.listing.authorId,
      vote.value ? TrustAction.LISTING_RECEIVED_UPVOTE : TrustAction.LISTING_RECEIVED_DOWNVOTE,
    )
  }
  for (const vote of pcVotes) {
    reverseReceivedVote(
      vote.pcListing.authorId,
      vote.value ? TrustAction.LISTING_RECEIVED_UPVOTE : TrustAction.LISTING_RECEIVED_DOWNVOTE,
    )
  }
  for (const vote of [...commentVotes, ...pcCommentVotes]) {
    reverseReceivedVote(
      vote.comment.userId,
      vote.value ? TrustAction.COMMENT_RECEIVED_UPVOTE : TrustAction.COMMENT_RECEIVED_DOWNVOTE,
    )
    if (!vote.value && vote.comment.score === TRUST_CONFIG.HELPFUL_COMMENT_THRESHOLD - 1) {
      trustLogs.push({
        userId: vote.comment.userId,
        action: TrustAction.HELPFUL_COMMENT,
        weight: TRUST_ACTIONS[TrustAction.HELPFUL_COMMENT].weight,
        metadata: {
          commentId: vote.comment.id,
          ...('listingId' in vote.comment
            ? { listingId: vote.comment.listingId }
            : { pcListingId: vote.comment.pcListingId }),
          score: TRUST_CONFIG.HELPFUL_COMMENT_THRESHOLD,
          threshold: TRUST_CONFIG.HELPFUL_COMMENT_THRESHOLD,
        },
      })
    }
  }
  for (const [authorId, adjustment] of trustAdjustments) {
    if (adjustment === 0) continue
    trustLogs.push({
      userId: authorId,
      action: TrustAction.VOTE_CHANGE_REVERSAL,
      weight: adjustment,
      metadata: { reason: 'Account deletion vote removal', reversed: true },
    })
  }
  for (const log of trustLogs) {
    if (log.action !== TrustAction.HELPFUL_COMMENT) continue
    trustAdjustments.set(log.userId, (trustAdjustments.get(log.userId) ?? 0) + log.weight)
  }
  const authorsByAdjustment = new Map<number, string[]>()
  for (const [authorId, adjustment] of trustAdjustments) {
    if (adjustment === 0) continue
    const authorIds = authorsByAdjustment.get(adjustment) ?? []
    authorIds.push(authorId)
    authorsByAdjustment.set(adjustment, authorIds)
  }
  for (const [adjustment, authorIds] of authorsByAdjustment) {
    for (let offset = 0; offset < authorIds.length; offset += 500) {
      await tx.user.updateMany({
        where: { id: { in: authorIds.slice(offset, offset + 500) } },
        data: { trustScore: { increment: adjustment } },
      })
    }
  }
  for (let offset = 0; offset < trustLogs.length; offset += 500) {
    await tx.trustActionLog.createMany({ data: trustLogs.slice(offset, offset + 500) })
  }
}

function voteRemovalRow(
  report: Prisma.ListingGetPayload<{ select: typeof voteCountsSelect }>,
  value: boolean,
) {
  const upvotes = Math.max(0, report.upvoteCount - (value ? 1 : 0))
  const downvotes = Math.max(0, report.downvoteCount - (value ? 0 : 1))
  const removed = report.upvoteCount + report.downvoteCount - upvotes - downvotes
  const score = calculateWilsonScore(upvotes, downvotes)
  return Prisma.sql`(${report.id}, ${upvotes}::int, ${downvotes}::int, ${removed}::int, ${score}::double precision)`
}

async function updateReportVoteCounts(
  tx: Prisma.TransactionClient,
  reportType: 'handheld' | 'pc',
  rows: Prisma.Sql[],
) {
  const table = reportType === 'handheld' ? Prisma.sql`"Listing"` : Prisma.sql`"pc_listings"`
  const timestamp = reportType === 'pc' ? Prisma.sql`, "updatedAt" = NOW()` : Prisma.empty
  for (let offset = 0; offset < rows.length; offset += 500) {
    await tx.$executeRaw(Prisma.sql`
      UPDATE ${table} AS report
      SET "upvoteCount" = counts.upvotes, "downvoteCount" = counts.downvotes,
          "voteCount" = report."voteCount" - counts.removed, "successRate" = counts.score ${timestamp}
      FROM (VALUES ${Prisma.join(rows.slice(offset, offset + 500))})
        AS counts(id, upvotes, downvotes, removed, score)
      WHERE report."id" = counts.id
    `)
  }
}
