import { type Prisma } from '@orm'
import { calculateWilsonScore } from './wilson-score'

/**
 * Updates vote counts on a listing when a vote is created, updated, or deleted
 * This maintains materialized vote statistics for efficient sorting
 * Uses Wilson Score for confidence-weighted ranking
 */
export async function updateListingVoteCounts(
  tx: Prisma.TransactionClient,
  listingId: string,
  operation: 'create' | 'update' | 'delete',
  newValue?: boolean,
  oldValue?: boolean,
) {
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
  if (upvoteDelta === 0 && downvoteDelta === 0 && voteCountDelta === 0) {
    return
  }

  // Update counts atomically
  const listing = await tx.listing.update({
    where: { id: listingId },
    data: {
      upvoteCount: { increment: upvoteDelta },
      downvoteCount: { increment: downvoteDelta },
      voteCount: { increment: voteCountDelta },
    },
  })

  // Calculate and update Wilson score
  const wilsonScore = calculateWilsonScore(listing.upvoteCount, listing.downvoteCount)

  await tx.listing.update({
    where: { id: listingId },
    data: { successRate: wilsonScore },
  })
}

/**
 * Updates vote counts on a PC listing when a vote is created, updated, or deleted
 * This maintains materialized vote statistics for efficient sorting
 * Uses Wilson Score for confidence-weighted ranking
 */
export async function updatePcListingVoteCounts(
  tx: Prisma.TransactionClient,
  pcListingId: string,
  operation: 'create' | 'update' | 'delete',
  newValue?: boolean,
  oldValue?: boolean,
) {
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
  if (upvoteDelta === 0 && downvoteDelta === 0 && voteCountDelta === 0) {
    return
  }

  // Update counts atomically
  const pcListing = await tx.pcListing.update({
    where: { id: pcListingId },
    data: {
      upvoteCount: { increment: upvoteDelta },
      downvoteCount: { increment: downvoteDelta },
      voteCount: { increment: voteCountDelta },
    },
  })

  // Calculate and update Wilson score
  const wilsonScore = calculateWilsonScore(pcListing.upvoteCount, pcListing.downvoteCount)

  await tx.pcListing.update({
    where: { id: pcListingId },
    data: { successRate: wilsonScore },
  })
}
