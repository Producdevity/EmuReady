import { type ApprovalStatus } from '@orm'

export interface VoteCounts {
  up: number
  down: number
  nullified: number
}

// A nullified vote counts only in `nullified`, not in up/down.
export interface VoteForCounting {
  value: boolean
  nullifiedAt: Date | null
}

export function computeVoteCounts(votes: readonly VoteForCounting[]): VoteCounts {
  let up = 0
  let down = 0
  let nullified = 0
  for (const vote of votes) {
    if (vote.nullifiedAt !== null) {
      nullified += 1
    } else if (vote.value) {
      up += 1
    } else {
      down += 1
    }
  }
  return { up, down, nullified }
}

export const moderatorInfoUserSelect = {
  id: true,
  name: true,
} as const

export const moderatorInfoVoteSelect = {
  id: true,
  value: true,
  createdAt: true,
  nullifiedAt: true,
  user: { select: { id: true, name: true, trustScore: true } },
} as const

export interface ModeratorInfoListing {
  status: ApprovalStatus
  processedAt: Date | null
  processedNotes: string | null
  processedByUser: { id: string; name: string | null } | null
}

export function assembleModeratorInfo<TVote extends VoteForCounting>(
  listing: ModeratorInfoListing,
  votes: TVote[],
) {
  return {
    approval: {
      status: listing.status,
      processedAt: listing.processedAt,
      processedNotes: listing.processedNotes,
      processedBy: listing.processedByUser,
    },
    votes,
    voteCounts: computeVoteCounts(votes),
  }
}
