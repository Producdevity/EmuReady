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
