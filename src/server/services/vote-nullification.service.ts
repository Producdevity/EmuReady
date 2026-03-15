import { logger } from '@/lib/logger'
import { TRUST_ACTIONS } from '@/lib/trust/config'
import { applyManualTrustAdjustment } from '@/lib/trust/service'
import { type ListingType } from '@/schemas/common'
import { logAudit } from '@/server/services/audit.service'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { AuditAction, AuditEntityType, TrustAction, type PrismaClient } from '@orm'

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

async function recalculateListingScores(
  prisma: PrismaClient,
  listingIds: Set<string>,
  type: ListingType,
): Promise<number> {
  let count = 0
  for (const listingId of listingIds) {
    if (type === 'handheld') {
      const [upvotes, downvotes] = await Promise.all([
        prisma.vote.count({ where: { listingId, value: true, nullifiedAt: null } }),
        prisma.vote.count({ where: { listingId, value: false, nullifiedAt: null } }),
      ])
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          upvoteCount: upvotes,
          downvoteCount: downvotes,
          voteCount: upvotes + downvotes,
          successRate: calculateWilsonScore(upvotes, downvotes),
        },
      })
    } else {
      const [upvotes, downvotes] = await Promise.all([
        prisma.pcListingVote.count({
          where: { pcListingId: listingId, value: true, nullifiedAt: null },
        }),
        prisma.pcListingVote.count({
          where: { pcListingId: listingId, value: false, nullifiedAt: null },
        }),
      ])
      await prisma.pcListing.update({
        where: { id: listingId },
        data: {
          upvoteCount: upvotes,
          downvoteCount: downvotes,
          voteCount: upvotes + downvotes,
          successRate: calculateWilsonScore(upvotes, downvotes),
        },
      })
    }
    count++
  }
  return count
}

async function recalculateCommentScores(
  prisma: PrismaClient,
  commentIds: Set<string>,
  type: ListingType,
): Promise<number> {
  let count = 0
  for (const commentId of commentIds) {
    if (type === 'handheld') {
      const [upvotes, downvotes] = await Promise.all([
        prisma.commentVote.count({ where: { commentId, value: true, nullifiedAt: null } }),
        prisma.commentVote.count({ where: { commentId, value: false, nullifiedAt: null } }),
      ])
      await prisma.comment.update({
        where: { id: commentId },
        data: { score: upvotes - downvotes },
      })
    } else {
      const [upvotes, downvotes] = await Promise.all([
        prisma.pcListingCommentVote.count({ where: { commentId, value: true, nullifiedAt: null } }),
        prisma.pcListingCommentVote.count({
          where: { commentId, value: false, nullifiedAt: null },
        }),
      ])
      await prisma.pcListingComment.update({
        where: { id: commentId },
        data: { score: upvotes - downvotes },
      })
    }
    count++
  }
  return count
}

export async function nullifyUserVotes(
  prisma: PrismaClient,
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

  // 2. Batch nullify votes
  for (let i = 0; i < handheldVotes.length; i += BATCH_SIZE) {
    const batch = handheldVotes.slice(i, i + BATCH_SIZE)
    await prisma.vote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: now },
    })
  }

  for (let i = 0; i < pcVotes.length; i += BATCH_SIZE) {
    const batch = pcVotes.slice(i, i + BATCH_SIZE)
    await prisma.pcListingVote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: now },
    })
  }

  for (let i = 0; i < commentVotes.length; i += BATCH_SIZE) {
    const batch = commentVotes.slice(i, i + BATCH_SIZE)
    await prisma.commentVote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: now },
    })
  }

  for (let i = 0; i < pcCommentVotes.length; i += BATCH_SIZE) {
    const batch = pcCommentVotes.slice(i, i + BATCH_SIZE)
    await prisma.pcListingCommentVote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: now },
    })
  }

  // 3. Recalculate listing scores
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

  // Handheld listing votes: reverse trust for voter and authors
  for (const vote of handheldVotes) {
    // Reverse voter trust: voter got +1 for either UPVOTE or DOWNVOTE
    addAdjustment(userId, -TRUST_ACTIONS[TrustAction.UPVOTE].weight)

    // Reverse author trust (skip self-votes)
    if (vote.listing.authorId && vote.listing.authorId !== userId) {
      if (vote.value) {
        // Was upvote: author got +2 (LISTING_RECEIVED_UPVOTE), reverse it
        addAdjustment(
          vote.listing.authorId,
          -TRUST_ACTIONS[TrustAction.LISTING_RECEIVED_UPVOTE].weight,
        )
      } else {
        // Was downvote: author got -1 (LISTING_RECEIVED_DOWNVOTE), reverse it
        addAdjustment(
          vote.listing.authorId,
          -TRUST_ACTIONS[TrustAction.LISTING_RECEIVED_DOWNVOTE].weight,
        )
      }
    }
  }

  // Handheld comment votes: reverse author trust (skip self-votes)
  for (const vote of commentVotes) {
    if (vote.comment.userId !== userId) {
      if (vote.value) {
        addAdjustment(
          vote.comment.userId,
          -TRUST_ACTIONS[TrustAction.COMMENT_RECEIVED_UPVOTE].weight,
        )
      } else {
        addAdjustment(
          vote.comment.userId,
          -TRUST_ACTIONS[TrustAction.COMMENT_RECEIVED_DOWNVOTE].weight,
        )
      }
    }
  }

  // PC votes: no trust reversal (trust was never applied for PC votes)
  // PC comment votes: no trust reversal (trust was never applied)

  // Apply trust adjustments
  let trustAdjustmentCount = 0
  for (const [targetUserId, adjustment] of trustAdjustments) {
    if (adjustment === 0) continue
    try {
      await applyManualTrustAdjustment({
        userId: targetUserId,
        adjustment,
        reason: `Vote nullification: ${reason}`,
        adminUserId,
      })
      trustAdjustmentCount++
    } catch (err) {
      logger.error(
        `[vote-nullification] Failed to apply trust adjustment for user ${targetUserId}:`,
        err,
      )
    }
  }

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
  prisma: PrismaClient,
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

  // 2. Clear nullifiedAt
  for (let i = 0; i < handheldVotes.length; i += BATCH_SIZE) {
    const batch = handheldVotes.slice(i, i + BATCH_SIZE)
    await prisma.vote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: null },
    })
  }

  for (let i = 0; i < pcVotes.length; i += BATCH_SIZE) {
    const batch = pcVotes.slice(i, i + BATCH_SIZE)
    await prisma.pcListingVote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: null },
    })
  }

  for (let i = 0; i < commentVotes.length; i += BATCH_SIZE) {
    const batch = commentVotes.slice(i, i + BATCH_SIZE)
    await prisma.commentVote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: null },
    })
  }

  for (let i = 0; i < pcCommentVotes.length; i += BATCH_SIZE) {
    const batch = pcCommentVotes.slice(i, i + BATCH_SIZE)
    await prisma.pcListingCommentVote.updateMany({
      where: { id: { in: batch.map((v) => v.id) } },
      data: { nullifiedAt: null },
    })
  }

  // 3. Recalculate scores
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

  for (const vote of handheldVotes) {
    // Re-apply voter trust
    addAdjustment(userId, TRUST_ACTIONS[TrustAction.UPVOTE].weight)

    // Re-apply author trust (skip self-votes)
    if (vote.listing.authorId && vote.listing.authorId !== userId) {
      if (vote.value) {
        addAdjustment(
          vote.listing.authorId,
          TRUST_ACTIONS[TrustAction.LISTING_RECEIVED_UPVOTE].weight,
        )
      } else {
        addAdjustment(
          vote.listing.authorId,
          TRUST_ACTIONS[TrustAction.LISTING_RECEIVED_DOWNVOTE].weight,
        )
      }
    }
  }

  for (const vote of commentVotes) {
    if (vote.comment.userId !== userId) {
      if (vote.value) {
        addAdjustment(
          vote.comment.userId,
          TRUST_ACTIONS[TrustAction.COMMENT_RECEIVED_UPVOTE].weight,
        )
      } else {
        addAdjustment(
          vote.comment.userId,
          TRUST_ACTIONS[TrustAction.COMMENT_RECEIVED_DOWNVOTE].weight,
        )
      }
    }
  }

  let trustAdjustmentCount = 0
  for (const [targetUserId, adjustment] of trustAdjustments) {
    if (adjustment === 0) continue
    try {
      await applyManualTrustAdjustment({
        userId: targetUserId,
        adjustment,
        reason: `Vote restoration: ${reason}`,
        adminUserId,
      })
      trustAdjustmentCount++
    } catch (err) {
      logger.error(
        `[vote-restoration] Failed to apply trust adjustment for user ${targetUserId}:`,
        err,
      )
    }
  }

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
