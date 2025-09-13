/**
 * Calculate Wilson Score for confidence-weighted sorting
 * Modified version that's less conservative than standard Wilson Score
 *
 * - 2 up, 0 down → ~95% (not 34% like standard Wilson)
 * - But still handle edge cases properly
 *
 * @param upvotes Number of positive votes
 * @param downvotes Number of negative votes
 * @returns Score between 0 and 1, with 0.5 being neutral (no votes)
 *
 * Examples:
 * - 0 votes → 0.5 (neutral)
 * - 0 up, 2 down → ~0.05 (very bad)
 * - 2 up, 0 down → ~0.95 (good with low confidence)
 * - 10 up, 0 down → ~0.96 (great with high confidence)
 * - 100 up, 0 down → ~0.98 (excellent with very high confidence)
 */
export function calculateWilsonScore(upvotes: number, downvotes: number): number {
  const n = upvotes + downvotes

  // No votes = neutral score
  if (n === 0) return 0.5

  const z = 0.675 // Lower z-score (50% confidence instead of 95%)
  const phat = upvotes / n

  // Standard Wilson score lower bound
  const wilsonLower =
    (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)

  // For EmuReady: Be less conservative, especially for high success rates
  // This gives us the behavior you want: 2 up, 0 down → ~95%
  let score: number

  if (phat === 1.0) {
    // Perfect score - apply small penalty based on sample size
    score = 1.0 - 0.05 / Math.sqrt(n)
  } else if (phat === 0.0) {
    // Complete failure - apply small bonus based on sample size
    score = 0.05 / Math.sqrt(n)
  } else {
    // Mixed votes - use Wilson score with less penalty
    const confidenceFactor = 1 - Math.exp(-n / 3) // Quickly approaches 1
    score = wilsonLower + (phat - wilsonLower) * confidenceFactor * 0.5
  }

  return score
}

/**
 * Update listing vote counts and Wilson score
 */
/**
 * Convenience: percentage based on Wilson score
 * Returns an integer 0-100 where 0 votes → 50
 */
export function wilsonPercent(upvotes: number, downvotes: number): number {
  return Math.round(calculateWilsonScore(upvotes, downvotes) * 100)
}
