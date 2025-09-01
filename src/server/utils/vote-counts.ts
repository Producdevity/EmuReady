import { type Prisma } from '@orm'
import { calculateWilsonScore } from './wilson-score'

/**
 * Generic function to update vote counts on any voteable entity
 * Maintains materialized vote statistics for efficient sorting
 * Uses Wilson Score for confidence-weighted ranking
 */
async function updateVoteCounts<T extends { upvoteCount: number; downvoteCount: number }>(
  model: {
    findUnique: (args: {
      where: { id: string }
      select: { upvoteCount: true; downvoteCount: true }
    }) => Promise<{ upvoteCount: number; downvoteCount: number } | null>
    update: (args: {
      where: { id: string }
      data: {
        upvoteCount?: { increment: number }
        downvoteCount?: { increment: number }
        voteCount?: { increment: number }
        successRate?: number
      }
    }) => Promise<T>
  },
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  newValue?: boolean,
  oldValue?: boolean,
): Promise<void> {
  // Validate parameters
  if (operation === 'create' && newValue === undefined) {
    throw new Error('Create operation requires a value')
  }
  if (operation === 'delete' && oldValue === undefined) {
    throw new Error('Delete operation requires oldValue')
  }
  if (operation === 'update' && (newValue === undefined || oldValue === undefined)) {
    throw new Error('Update operation requires both newValue and oldValue')
  }
  if (!['create', 'update', 'delete'].includes(operation)) {
    throw new Error(`Invalid operation: ${operation}`)
  }

  // Calculate deltas based on operation
  let upvoteDelta = 0
  let downvoteDelta = 0
  let voteCountDelta = 0

  if (operation === 'create' && newValue !== undefined) {
    // New vote
    voteCountDelta = 1
    if (newValue) {
      upvoteDelta = 1
    } else {
      downvoteDelta = 1
    }
  } else if (operation === 'update' && newValue !== undefined && oldValue !== undefined) {
    // Vote changed
    if (oldValue !== newValue) {
      if (newValue) {
        // Changed from downvote to upvote
        upvoteDelta = 1
        downvoteDelta = -1
      } else {
        // Changed from upvote to downvote
        upvoteDelta = -1
        downvoteDelta = 1
      }
    }
    // No delta if vote value didn't change
  } else if (operation === 'delete' && oldValue !== undefined) {
    // Vote removed
    voteCountDelta = -1
    if (oldValue) {
      upvoteDelta = -1
    } else {
      downvoteDelta = -1
    }
  }

  // Skip update if no changes
  if (upvoteDelta === 0 && downvoteDelta === 0 && voteCountDelta === 0) return

  // Get current counts to calculate the new Wilson score
  const current = await model.findUnique({
    where: { id: entityId },
    select: { upvoteCount: true, downvoteCount: true },
  })

  if (!current) throw new Error(`Entity ${entityId} not found`)

  // Calculate new counts
  const newUpvoteCount = current.upvoteCount + upvoteDelta
  const newDownvoteCount = current.downvoteCount + downvoteDelta

  // Calculate Wilson score based on the new counts
  const wilsonScore = calculateWilsonScore(newUpvoteCount, newDownvoteCount)

  await model.update({
    where: { id: entityId },
    data: {
      upvoteCount: { increment: upvoteDelta },
      downvoteCount: { increment: downvoteDelta },
      voteCount: { increment: voteCountDelta },
      successRate: wilsonScore,
    },
  })
}

/**
 * Updates vote counts on a listing when a vote is created, updated, or deleted
 */
export async function updateListingVoteCounts(
  tx: Prisma.TransactionClient,
  listingId: string,
  operation: 'create' | 'update' | 'delete',
  newValue?: boolean,
  oldValue?: boolean,
): Promise<void> {
  return updateVoteCounts(tx.listing, listingId, operation, newValue, oldValue)
}

/**
 * Updates vote counts on a PC listing when a vote is created, updated, or deleted
 */
export async function updatePcListingVoteCounts(
  tx: Prisma.TransactionClient,
  pcListingId: string,
  operation: 'create' | 'update' | 'delete',
  newValue?: boolean,
  oldValue?: boolean,
): Promise<void> {
  return updateVoteCounts(tx.pcListing, pcListingId, operation, newValue, oldValue)
}
