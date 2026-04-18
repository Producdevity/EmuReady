import { TrustService } from '@/lib/trust/service'
import { type ListingType } from '@/schemas/common'
import { TrustAction, type PrismaClient, type Prisma } from '@orm'

type VoteAction = 'created' | 'updated' | 'deleted'

type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

interface ListingVoteTrustParams {
  tx: PrismaTransactionClient | Prisma.TransactionClient
  action: VoteAction
  currentValue: boolean
  previousValue: boolean | null
  userId: string
  listingId: string
  listingType: ListingType
  authorId: string | null
}

/**
 * Applies or reverses trust effects when a listing vote is created, updated, or deleted.
 * Works for both handheld and PC listings. Must be called within a transaction — pass `tx`.
 */
export async function handleListingVoteTrustEffects(params: ListingVoteTrustParams): Promise<void> {
  const { tx, action, currentValue, previousValue, userId, listingId, listingType, authorId } =
    params

  const contextKey = listingType === 'handheld' ? 'listingId' : 'pcListingId'
  const context = { [contextKey]: listingId }
  const trustService = new TrustService(tx)

  const applyVoterTrust = (value: boolean) =>
    trustService.logAction({
      userId,
      action: value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
      metadata: context,
    })

  const reverseVoterTrust = (value: boolean) =>
    trustService.reverseLogAction({
      userId,
      originalAction: value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
      metadata: context,
    })

  const applyAuthorTrust = (value: boolean) => {
    if (!authorId || authorId === userId) return Promise.resolve()
    return trustService.logAction({
      userId: authorId,
      action: value ? TrustAction.LISTING_RECEIVED_UPVOTE : TrustAction.LISTING_RECEIVED_DOWNVOTE,
      metadata: { ...context, voterId: userId },
    })
  }

  const reverseAuthorTrust = (value: boolean) => {
    if (!authorId || authorId === userId) return Promise.resolve()
    return trustService.reverseLogAction({
      userId: authorId,
      originalAction: value
        ? TrustAction.LISTING_RECEIVED_UPVOTE
        : TrustAction.LISTING_RECEIVED_DOWNVOTE,
      metadata: { ...context, voterId: userId },
    })
  }

  if (action === 'created') {
    await applyVoterTrust(currentValue)
    await applyAuthorTrust(currentValue)
    return
  }

  if (action === 'updated' && previousValue !== null) {
    await reverseVoterTrust(previousValue)
    await reverseAuthorTrust(previousValue)
    await applyVoterTrust(currentValue)
    await applyAuthorTrust(currentValue)
    return
  }

  if (action === 'deleted' && previousValue !== null) {
    await reverseVoterTrust(previousValue)
    await reverseAuthorTrust(previousValue)
  }
}

type CommentVoteTrustAction = 'upvote' | 'downvote' | 'change' | 'remove'

interface CommentVoteTrustParams {
  tx: PrismaTransactionClient | Prisma.TransactionClient
  trustAction: CommentVoteTrustAction
  newValue: boolean
  previousValue: boolean | null
  commentAuthorId: string
  voterId: string
  commentId: string
  parentEntityId: string
  listingType: ListingType
  updatedScore: number
  scoreChange: number
}

const HELPFUL_THRESHOLD = 5

/**
 * Applies trust effects when a comment vote is created, changed, or removed.
 * Works for both handheld and PC listing comments.
 */
export async function handleCommentVoteTrustEffects(params: CommentVoteTrustParams): Promise<void> {
  const {
    tx,
    trustAction,
    newValue,
    previousValue,
    commentAuthorId,
    voterId,
    commentId,
    parentEntityId,
    listingType,
    updatedScore,
    scoreChange,
  } = params

  if (commentAuthorId === voterId) return

  const trustService = new TrustService(tx)
  const parentKey = listingType === 'handheld' ? 'listingId' : 'pcListingId'
  const baseMeta = { commentId, voterId, [parentKey]: parentEntityId }

  if (trustAction === 'upvote') {
    await trustService.logAction({
      userId: commentAuthorId,
      action: TrustAction.COMMENT_RECEIVED_UPVOTE,
      targetUserId: voterId,
      metadata: baseMeta,
    })
  } else if (trustAction === 'downvote') {
    await trustService.logAction({
      userId: commentAuthorId,
      action: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
      targetUserId: voterId,
      metadata: baseMeta,
    })
  } else if (trustAction === 'change') {
    if (newValue) {
      // Changed from downvote to upvote: reverse downvote, apply upvote
      await trustService.reverseLogAction({
        userId: commentAuthorId,
        originalAction: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
        targetUserId: voterId,
        metadata: baseMeta,
      })
      await trustService.logAction({
        userId: commentAuthorId,
        action: TrustAction.COMMENT_RECEIVED_UPVOTE,
        targetUserId: voterId,
        metadata: baseMeta,
      })
    } else {
      // Changed from upvote to downvote: reverse upvote, apply downvote
      await trustService.reverseLogAction({
        userId: commentAuthorId,
        originalAction: TrustAction.COMMENT_RECEIVED_UPVOTE,
        targetUserId: voterId,
        metadata: baseMeta,
      })
      await trustService.logAction({
        userId: commentAuthorId,
        action: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
        targetUserId: voterId,
        metadata: baseMeta,
      })
    }
  } else if (trustAction === 'remove' && previousValue !== null) {
    const originalAction = previousValue
      ? TrustAction.COMMENT_RECEIVED_UPVOTE
      : TrustAction.COMMENT_RECEIVED_DOWNVOTE
    await trustService.reverseLogAction({
      userId: commentAuthorId,
      originalAction,
      targetUserId: voterId,
      metadata: baseMeta,
    })
  }

  // Helpful comment bonus when crossing the threshold
  const previousScore = updatedScore - scoreChange
  if (previousScore < HELPFUL_THRESHOLD && updatedScore >= HELPFUL_THRESHOLD) {
    await trustService.logAction({
      userId: commentAuthorId,
      action: TrustAction.HELPFUL_COMMENT,
      metadata: {
        commentId,
        [parentKey]: parentEntityId,
        score: updatedScore,
        threshold: HELPFUL_THRESHOLD,
      },
    })
  }
}
