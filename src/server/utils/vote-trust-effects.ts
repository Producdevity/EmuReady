import { applyTrustAction, reverseTrustAction } from '@/lib/trust/service'
import { TrustAction } from '@orm'

type VoteAction = 'created' | 'updated' | 'deleted'

interface VoteTrustEffectsParams {
  action: VoteAction
  currentValue: boolean
  previousValue: boolean | null
  userId: string
  listingId: string
  authorId: string | null
}

export async function handleVoteTrustEffects(params: VoteTrustEffectsParams): Promise<void> {
  const { action, currentValue, previousValue, userId, listingId, authorId } = params

  if (action === 'created' || action === 'updated') {
    await applyTrustAction({
      userId,
      action: currentValue ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
      context: { listingId },
    })

    if (authorId && authorId !== userId) {
      await applyTrustAction({
        userId: authorId,
        action: currentValue
          ? TrustAction.LISTING_RECEIVED_UPVOTE
          : TrustAction.LISTING_RECEIVED_DOWNVOTE,
        context: { listingId, voterId: userId },
      })
    }
  }

  if (action === 'deleted' && previousValue !== null) {
    await reverseTrustAction({
      userId,
      originalAction: previousValue ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
      context: { listingId },
    })

    if (authorId && authorId !== userId) {
      await reverseTrustAction({
        userId: authorId,
        originalAction: previousValue
          ? TrustAction.LISTING_RECEIVED_UPVOTE
          : TrustAction.LISTING_RECEIVED_DOWNVOTE,
        context: { listingId, voterId: userId },
      })
    }
  }
}
