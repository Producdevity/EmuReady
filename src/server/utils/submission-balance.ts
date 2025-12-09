/**
 * Utility functions for checking user submission balance.
 *
 * Users can only add a limited number of games compared to their total listings.
 * This encourages users to contribute compatibility reports rather than just adding games.
 * AUTHOR role and above are exempt from this limit.
 */

import { GAME_SUBMISSION_LIMITS } from '@/data/constants'
import { type PrismaClient } from '@orm'

export interface SubmissionBalance {
  gamesCount: number
  listingsCount: number
  pcListingsCount: number
  totalListingsCount: number
  buffer: number
  canSubmitGame: boolean
  reportsNeeded: number
}

/**
 * Gets the submission balance for a user.
 *
 * @param prisma - Prisma client instance
 * @param userId - The ID of the user to check
 * @returns Object containing counts and whether user can submit more games
 */
export async function getSubmissionBalance(
  prisma: PrismaClient,
  userId: string,
): Promise<SubmissionBalance> {
  const [gamesCount, listingsCount, pcListingsCount] = await Promise.all([
    prisma.game.count({ where: { submittedBy: userId } }),
    prisma.listing.count({ where: { authorId: userId } }),
    prisma.pcListing.count({ where: { authorId: userId } }),
  ])

  const totalListingsCount = listingsCount + pcListingsCount
  const buffer = GAME_SUBMISSION_LIMITS.BUFFER
  const difference = gamesCount - totalListingsCount

  // User can submit if their games count doesn't exceed listings + buffer
  const canSubmitGame = difference < buffer
  const reportsNeeded = canSubmitGame ? 0 : difference - buffer + 1

  return {
    gamesCount,
    listingsCount,
    pcListingsCount,
    totalListingsCount,
    buffer,
    canSubmitGame,
    reportsNeeded,
  }
}
