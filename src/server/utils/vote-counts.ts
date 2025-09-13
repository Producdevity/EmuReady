import { calculateWilsonScore } from '@/utils/wilson-score'
import { type Prisma } from '@orm'

type UpdateVoteOperation = 'create' | 'update' | 'delete'

type VoteCounts = { upvoteCount: number; downvoteCount: number }

type VoteUpdateData = {
  upvoteCount?: { increment: number }
  downvoteCount?: { increment: number }
  voteCount?: { increment: number }
  successRate?: number
}

type VoteModelDelegate = {
  findUnique: (args: {
    where: { id: string }
    select: { upvoteCount: true; downvoteCount: true }
  }) => Promise<VoteCounts | null>
  update: (args: { where: { id: string }; data: VoteUpdateData }) => Promise<unknown>
}

const UPDATE_VOTE_OPERATIONS: UpdateVoteOperation[] = ['create', 'update', 'delete']

/**
 * Generic function to update vote counts on any voteable entity
 * Maintains materialized vote statistics for efficient sorting
 * Uses Wilson Score for confidence-weighted ranking
 */
async function updateVoteCounts(
  model: VoteModelDelegate,
  entityId: string,
  operation: UpdateVoteOperation,
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
  if (!UPDATE_VOTE_OPERATIONS.includes(operation)) {
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

  // Calculate new counts and clamp at 0 to avoid negative values
  const nextUpvoteCount = Math.max(0, current.upvoteCount + upvoteDelta)
  const nextDownvoteCount = Math.max(0, current.downvoteCount + downvoteDelta)

  // Adjust deltas to reflect clamped values
  const adjustedUpvoteDelta = nextUpvoteCount - current.upvoteCount
  const adjustedDownvoteDelta = nextDownvoteCount - current.downvoteCount
  let adjustedVoteCountDelta = voteCountDelta
  if (voteCountDelta < 0 && adjustedUpvoteDelta === 0 && adjustedDownvoteDelta === 0) {
    adjustedVoteCountDelta = 0
  }

  await model.update({
    where: { id: entityId },
    data: {
      upvoteCount: { increment: adjustedUpvoteDelta },
      downvoteCount: { increment: adjustedDownvoteDelta },
      voteCount: { increment: adjustedVoteCountDelta },
      successRate: calculateWilsonScore(nextUpvoteCount, nextDownvoteCount),
    },
  })
}

/**
 * Updates vote counts on a listing when a vote is created, updated, or deleted
 */
export async function updateListingVoteCounts(
  tx: Prisma.TransactionClient,
  listingId: string,
  operation: UpdateVoteOperation,
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
  operation: UpdateVoteOperation,
  newValue?: boolean,
  oldValue?: boolean,
): Promise<void> {
  return updateVoteCounts(tx.pcListing, pcListingId, operation, newValue, oldValue)
}
