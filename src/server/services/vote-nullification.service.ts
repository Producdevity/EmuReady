import { TRUST_ACTIONS } from '@/lib/trust/config'
import { TrustService } from '@/lib/trust/service'
import { type ListingType } from '@/schemas/common'
import { logAudit } from '@/server/services/audit.service'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { AuditAction, AuditEntityType, TrustAction, type Prisma, type PrismaClient } from '@orm'

type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient

interface NullifyParams {
  userId: string
  adminUserId: string
  reason: string
  includeCommentVotes: boolean
  headers?: Headers | Record<string, string>
}

interface RestoreParams {
  userId: string
  adminUserId: string
  reason: string
  headers?: Headers | Record<string, string>
}

interface NullifyResult {
  handheldVotesNullified: number
  pcVotesNullified: number
  commentVotesNullified: number
  pcCommentVotesNullified: number
  listingsRecalculated: number
  commentsRecalculated: number
  trustAdjustments: number
}

interface RestoreResult {
  handheldVotesRestored: number
  pcVotesRestored: number
  commentVotesRestored: number
  pcCommentVotesRestored: number
  listingsRecalculated: number
  commentsRecalculated: number
  trustAdjustments: number
}

const BATCH_SIZE = 100

interface VoteIdentifier {
  id: string
}

interface NullifiableDelegate {
  updateMany: (args: {
    where: { id: { in: string[] } }
    data: { nullifiedAt: Date | null }
  }) => Promise<{ count: number }>
}

/**
 * Updates `nullifiedAt` on a set of votes in serial batches of `BATCH_SIZE`.
 * Batching is serial within one delegate (avoids exhausting the connection pool);
 * the caller can run multiple `batchUpdateNullifiedAt` invocations in parallel
 * across different delegates (different tables) via `Promise.all`.
 */
async function batchUpdateNullifiedAt<T extends VoteIdentifier>(
  delegate: NullifiableDelegate,
  votes: readonly T[],
  nullifiedAt: Date | null,
): Promise<void> {
  for (let i = 0; i < votes.length; i += BATCH_SIZE) {
    const batch = votes.slice(i, i + BATCH_SIZE)
    await delegate.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt },
    })
  }
}

interface VoteScoreEntry {
  up: number
  down: number
}

async function recalculateListingScores(
  prisma: PrismaClientOrTransaction,
  listingIds: Set<string>,
  type: ListingType,
): Promise<number> {
  if (listingIds.size === 0) return 0

  const ids = [...listingIds]
  const scoreMap = new Map<string, VoteScoreEntry>()
  for (const id of ids) scoreMap.set(id, { up: 0, down: 0 })

  if (type === 'handheld') {
    const counts = await prisma.vote.groupBy({
      by: ['listingId', 'value'],
      where: { listingId: { in: ids }, nullifiedAt: null },
      _count: { _all: true },
    })
    for (const row of counts) {
      const entry = scoreMap.get(row.listingId)
      if (entry) {
        if (row.value) entry.up = row._count._all
        else entry.down = row._count._all
      }
    }
    for (const [id, { up, down }] of scoreMap) {
      await prisma.listing.update({
        where: { id },
        data: {
          upvoteCount: up,
          downvoteCount: down,
          voteCount: up + down,
          successRate: calculateWilsonScore(up, down),
        },
      })
    }
  } else {
    const counts = await prisma.pcListingVote.groupBy({
      by: ['pcListingId', 'value'],
      where: { pcListingId: { in: ids }, nullifiedAt: null },
      _count: { _all: true },
    })
    for (const row of counts) {
      const entry = scoreMap.get(row.pcListingId)
      if (entry) {
        if (row.value) entry.up = row._count._all
        else entry.down = row._count._all
      }
    }
    for (const [id, { up, down }] of scoreMap) {
      await prisma.pcListing.update({
        where: { id },
        data: {
          upvoteCount: up,
          downvoteCount: down,
          voteCount: up + down,
          successRate: calculateWilsonScore(up, down),
        },
      })
    }
  }

  return listingIds.size
}

async function recalculateCommentScores(
  prisma: PrismaClientOrTransaction,
  commentIds: Set<string>,
  type: ListingType,
): Promise<number> {
  if (commentIds.size === 0) return 0

  const ids = [...commentIds]
  const scoreMap = new Map<string, VoteScoreEntry>()
  for (const id of ids) scoreMap.set(id, { up: 0, down: 0 })

  if (type === 'handheld') {
    const counts = await prisma.commentVote.groupBy({
      by: ['commentId', 'value'],
      where: { commentId: { in: ids }, nullifiedAt: null },
      _count: { _all: true },
    })
    for (const row of counts) {
      const entry = scoreMap.get(row.commentId)
      if (entry) {
        if (row.value) entry.up = row._count._all
        else entry.down = row._count._all
      }
    }
    for (const [id, { up, down }] of scoreMap) {
      await prisma.comment.update({
        where: { id },
        data: { score: up - down },
      })
    }
  } else {
    const counts = await prisma.pcListingCommentVote.groupBy({
      by: ['commentId', 'value'],
      where: { commentId: { in: ids }, nullifiedAt: null },
      _count: { _all: true },
    })
    for (const row of counts) {
      const entry = scoreMap.get(row.commentId)
      if (entry) {
        if (row.value) entry.up = row._count._all
        else entry.down = row._count._all
      }
    }
    for (const [id, { up, down }] of scoreMap) {
      await prisma.pcListingComment.update({
        where: { id },
        data: { score: up - down },
      })
    }
  }

  return commentIds.size
}

export async function nullifyUserVotes(
  prisma: PrismaClientOrTransaction,
  params: NullifyParams,
): Promise<NullifyResult> {
  const { userId, adminUserId, reason, includeCommentVotes, headers } = params

  // 1. Fetch all active votes by this user
  const [handheldVotes, pcVotes, commentVotes, pcCommentVotes] = await Promise.all([
    prisma.vote.findMany({
      where: { userId, nullifiedAt: null },
      include: {
        listing: { select: { authorId: true } },
      },
    }),
    prisma.pcListingVote.findMany({
      where: { userId, nullifiedAt: null },
      include: {
        pcListing: { select: { authorId: true } },
      },
    }),
    includeCommentVotes
      ? prisma.commentVote.findMany({
          where: { userId, nullifiedAt: null },
          include: {
            comment: { select: { userId: true } },
          },
        })
      : Promise.resolve([]),
    includeCommentVotes
      ? prisma.pcListingCommentVote.findMany({
          where: { userId, nullifiedAt: null },
          include: {
            comment: { select: { userId: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const totalVotes =
    handheldVotes.length + pcVotes.length + commentVotes.length + pcCommentVotes.length
  if (totalVotes === 0) {
    return {
      handheldVotesNullified: 0,
      pcVotesNullified: 0,
      commentVotesNullified: 0,
      pcCommentVotesNullified: 0,
      listingsRecalculated: 0,
      commentsRecalculated: 0,
      trustAdjustments: 0,
    }
  }

  const now = new Date()

  // 2. Batch nullify votes — across different vote types in parallel,
  //    serially batched within each type to keep connection-pool pressure bounded.
  await Promise.all([
    batchUpdateNullifiedAt(prisma.vote, handheldVotes, now),
    batchUpdateNullifiedAt(prisma.pcListingVote, pcVotes, now),
    batchUpdateNullifiedAt(prisma.commentVote, commentVotes, now),
    batchUpdateNullifiedAt(prisma.pcListingCommentVote, pcCommentVotes, now),
  ])

  // 3. Recalculate listing scores — parallel across distinct tables.
  const handheldListingIds = new Set(handheldVotes.map((v) => v.listingId))
  const pcListingIds = new Set(pcVotes.map((v) => v.pcListingId))
  const handheldCommentIds = new Set(commentVotes.map((v) => v.commentId))
  const pcCommentIds = new Set(pcCommentVotes.map((v) => v.commentId))

  const [handheldRecalc, pcRecalc, commentRecalc, pcCommentRecalc] = await Promise.all([
    recalculateListingScores(prisma, handheldListingIds, 'handheld'),
    recalculateListingScores(prisma, pcListingIds, 'pc'),
    recalculateCommentScores(prisma, handheldCommentIds, 'handheld'),
    recalculateCommentScores(prisma, pcCommentIds, 'pc'),
  ])

  // 4. Calculate and apply trust reversals
  // Trust adjustments map: userId -> total adjustment
  const trustAdjustments = new Map<string, number>()

  const addAdjustment = (targetUserId: string, amount: number) => {
    trustAdjustments.set(targetUserId, (trustAdjustments.get(targetUserId) ?? 0) + amount)
  }

  // Reverse listing vote trust for both handheld and PC
  for (const vote of handheldVotes) {
    const voterAction = vote.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE
    addAdjustment(userId, -TRUST_ACTIONS[voterAction].weight)
    if (vote.listing.authorId && vote.listing.authorId !== userId) {
      const action = vote.value
        ? TrustAction.LISTING_RECEIVED_UPVOTE
        : TrustAction.LISTING_RECEIVED_DOWNVOTE
      addAdjustment(vote.listing.authorId, -TRUST_ACTIONS[action].weight)
    }
  }

  for (const vote of pcVotes) {
    const voterAction = vote.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE
    addAdjustment(userId, -TRUST_ACTIONS[voterAction].weight)
    if (vote.pcListing.authorId && vote.pcListing.authorId !== userId) {
      const action = vote.value
        ? TrustAction.LISTING_RECEIVED_UPVOTE
        : TrustAction.LISTING_RECEIVED_DOWNVOTE
      addAdjustment(vote.pcListing.authorId, -TRUST_ACTIONS[action].weight)
    }
  }

  // Reverse comment vote trust for both handheld and PC
  for (const vote of commentVotes) {
    if (vote.comment.userId !== userId) {
      const action = vote.value
        ? TrustAction.COMMENT_RECEIVED_UPVOTE
        : TrustAction.COMMENT_RECEIVED_DOWNVOTE
      addAdjustment(vote.comment.userId, -TRUST_ACTIONS[action].weight)
    }
  }

  for (const vote of pcCommentVotes) {
    if (vote.comment.userId !== userId) {
      const action = vote.value
        ? TrustAction.COMMENT_RECEIVED_UPVOTE
        : TrustAction.COMMENT_RECEIVED_DOWNVOTE
      addAdjustment(vote.comment.userId, -TRUST_ACTIONS[action].weight)
    }
  }

  // Apply trust adjustments using TrustService for transaction participation
  const trustService = new TrustService(prisma)
  const trustAdjustmentCount = await trustService.applyBulkManualAdjustments({
    adjustments: trustAdjustments,
    reason: `Vote nullification: ${reason}`,
    adminUserId,
  })

  // 5. Audit log
  void logAudit(prisma, {
    actorId: adminUserId,
    action: AuditAction.NULLIFY_VOTES,
    entityType: AuditEntityType.VOTE,
    targetUserId: userId,
    metadata: {
      reason,
      handheldVotes: handheldVotes.length,
      pcVotes: pcVotes.length,
      commentVotes: commentVotes.length,
      pcCommentVotes: pcCommentVotes.length,
      listingsRecalculated: handheldRecalc + pcRecalc,
      commentsRecalculated: commentRecalc + pcCommentRecalc,
      trustAdjustments: trustAdjustmentCount,
    },
    headers,
  })

  return {
    handheldVotesNullified: handheldVotes.length,
    pcVotesNullified: pcVotes.length,
    commentVotesNullified: commentVotes.length,
    pcCommentVotesNullified: pcCommentVotes.length,
    listingsRecalculated: handheldRecalc + pcRecalc,
    commentsRecalculated: commentRecalc + pcCommentRecalc,
    trustAdjustments: trustAdjustmentCount,
  }
}

export async function restoreUserVotes(
  prisma: PrismaClientOrTransaction,
  params: RestoreParams,
): Promise<RestoreResult> {
  const { userId, adminUserId, reason, headers } = params

  // 1. Fetch all nullified votes by this user
  const [handheldVotes, pcVotes, commentVotes, pcCommentVotes] = await Promise.all([
    prisma.vote.findMany({
      where: { userId, nullifiedAt: { not: null } },
      include: {
        listing: { select: { authorId: true } },
      },
    }),
    prisma.pcListingVote.findMany({
      where: { userId, nullifiedAt: { not: null } },
      include: {
        pcListing: { select: { authorId: true } },
      },
    }),
    prisma.commentVote.findMany({
      where: { userId, nullifiedAt: { not: null } },
      include: {
        comment: { select: { userId: true } },
      },
    }),
    prisma.pcListingCommentVote.findMany({
      where: { userId, nullifiedAt: { not: null } },
      include: {
        comment: { select: { userId: true } },
      },
    }),
  ])

  const totalVotes =
    handheldVotes.length + pcVotes.length + commentVotes.length + pcCommentVotes.length
  if (totalVotes === 0) {
    return {
      handheldVotesRestored: 0,
      pcVotesRestored: 0,
      commentVotesRestored: 0,
      pcCommentVotesRestored: 0,
      listingsRecalculated: 0,
      commentsRecalculated: 0,
      trustAdjustments: 0,
    }
  }

  // 2. Clear nullifiedAt — parallel across vote types, serial batches within each type.
  await Promise.all([
    batchUpdateNullifiedAt(prisma.vote, handheldVotes, null),
    batchUpdateNullifiedAt(prisma.pcListingVote, pcVotes, null),
    batchUpdateNullifiedAt(prisma.commentVote, commentVotes, null),
    batchUpdateNullifiedAt(prisma.pcListingCommentVote, pcCommentVotes, null),
  ])

  // 3. Recalculate scores — parallel across distinct tables.
  const handheldListingIds = new Set(handheldVotes.map((v) => v.listingId))
  const pcListingIds = new Set(pcVotes.map((v) => v.pcListingId))
  const handheldCommentIds = new Set(commentVotes.map((v) => v.commentId))
  const pcCommentIds = new Set(pcCommentVotes.map((v) => v.commentId))

  const [handheldRecalc, pcRecalc, commentRecalc, pcCommentRecalc] = await Promise.all([
    recalculateListingScores(prisma, handheldListingIds, 'handheld'),
    recalculateListingScores(prisma, pcListingIds, 'pc'),
    recalculateCommentScores(prisma, handheldCommentIds, 'handheld'),
    recalculateCommentScores(prisma, pcCommentIds, 'pc'),
  ])

  // 4. Re-apply trust (inverse of nullification reversal = re-application)
  const trustAdjustments = new Map<string, number>()

  const addAdjustment = (targetUserId: string, amount: number) => {
    trustAdjustments.set(targetUserId, (trustAdjustments.get(targetUserId) ?? 0) + amount)
  }

  // Re-apply listing vote trust for both handheld and PC
  for (const vote of handheldVotes) {
    const voterAction = vote.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE
    addAdjustment(userId, TRUST_ACTIONS[voterAction].weight)
    if (vote.listing.authorId && vote.listing.authorId !== userId) {
      const action = vote.value
        ? TrustAction.LISTING_RECEIVED_UPVOTE
        : TrustAction.LISTING_RECEIVED_DOWNVOTE
      addAdjustment(vote.listing.authorId, TRUST_ACTIONS[action].weight)
    }
  }

  for (const vote of pcVotes) {
    const voterAction = vote.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE
    addAdjustment(userId, TRUST_ACTIONS[voterAction].weight)
    if (vote.pcListing.authorId && vote.pcListing.authorId !== userId) {
      const action = vote.value
        ? TrustAction.LISTING_RECEIVED_UPVOTE
        : TrustAction.LISTING_RECEIVED_DOWNVOTE
      addAdjustment(vote.pcListing.authorId, TRUST_ACTIONS[action].weight)
    }
  }

  // Re-apply comment vote trust for both handheld and PC
  for (const vote of commentVotes) {
    if (vote.comment.userId !== userId) {
      const action = vote.value
        ? TrustAction.COMMENT_RECEIVED_UPVOTE
        : TrustAction.COMMENT_RECEIVED_DOWNVOTE
      addAdjustment(vote.comment.userId, TRUST_ACTIONS[action].weight)
    }
  }

  for (const vote of pcCommentVotes) {
    if (vote.comment.userId !== userId) {
      const action = vote.value
        ? TrustAction.COMMENT_RECEIVED_UPVOTE
        : TrustAction.COMMENT_RECEIVED_DOWNVOTE
      addAdjustment(vote.comment.userId, TRUST_ACTIONS[action].weight)
    }
  }

  const trustService = new TrustService(prisma)
  const trustAdjustmentCount = await trustService.applyBulkManualAdjustments({
    adjustments: trustAdjustments,
    reason: `Vote restoration: ${reason}`,
    adminUserId,
  })

  // 5. Audit log
  void logAudit(prisma, {
    actorId: adminUserId,
    action: AuditAction.RESTORE_VOTES,
    entityType: AuditEntityType.VOTE,
    targetUserId: userId,
    metadata: {
      reason,
      handheldVotes: handheldVotes.length,
      pcVotes: pcVotes.length,
      commentVotes: commentVotes.length,
      pcCommentVotes: pcCommentVotes.length,
      listingsRecalculated: handheldRecalc + pcRecalc,
      commentsRecalculated: commentRecalc + pcCommentRecalc,
      trustAdjustments: trustAdjustmentCount,
    },
    headers,
  })

  return {
    handheldVotesRestored: handheldVotes.length,
    pcVotesRestored: pcVotes.length,
    commentVotesRestored: commentVotes.length,
    pcCommentVotesRestored: pcCommentVotes.length,
    listingsRecalculated: handheldRecalc + pcRecalc,
    commentsRecalculated: commentRecalc + pcCommentRecalc,
    trustAdjustments: trustAdjustmentCount,
  }
}
