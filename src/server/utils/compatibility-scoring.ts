import type { PerformanceScale, ListingDeveloperVerification, Game, System, Emulator } from '@orm'

/**
 * Compatibility Scoring Utility for RetroCatalog Integration
 *
 * Calculates 0-100 compatibility scores from EmuReady's listing data.
 * Scoring is based on:
 * - Performance scale (50% weight): Author's rating of compatibility
 * - Community consensus (30% weight): Wilson score from upvotes/downvotes
 * - Developer verification (20% weight): Verification by emulator developers
 * - User trust score: Positive-only boost for trusted community members
 *
 * SoC Fallback Strategy:
 * - When a device has fewer than MINIMUM_DEVICE_LISTINGS for a system,
 *   fallback to aggregating data from all devices with the same SoC
 */

/**
 * Minimum device-specific listings required before using SoC fallback
 */
export const MINIMUM_DEVICE_LISTINGS = 5

/**
 * Listing data structure needed for scoring calculations
 */
export interface ScoringListing {
  id: string
  performanceId: number
  successRate: number
  voteCount: number
  upvoteCount: number
  downvoteCount: number
  performance: PerformanceScale
  developerVerifications?: ListingDeveloperVerification[]
  author?: {
    id: string
    trustScore: number
  }
  emulator?: {
    id: string
    name: string
    logo: string | null
  }
  game?: Game & { system: System }
  createdAt: Date
}

/**
 * Extended listing with computed fields for scoring
 */
export interface ScoringListingWithMetadata extends ScoringListing {
  isVerifiedDeveloper: boolean
}

/**
 * Configuration for score weighting
 */
export interface ScoreWeights {
  performance: number
  voteConfidence: number
  developerVerification: number
}

/**
 * Default score weights (must sum to 1.0)
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  performance: 0.5, // 50% - Author's rating is primary signal
  voteConfidence: 0.3, // 30% - Community validation is important
  developerVerification: 0.2, // 20% - Developer input provides credibility boost
}

/**
 * Scoring configuration (wip, still doesn't feel right)
 */
export const SCORING_CONFIG = {
  verification: {
    authorIsVerifiedDeveloper: 10, // Points if author is verified developer for the emulator
    perExplicitVerification: 5, // Points per explicit developer verification
    maxFromVerifications: 10, // Max points from explicit verifications (regardless of count)
    totalCap: 20, // Hard cap on total verification boost
  },
  trust: {
    // TODO: maybe lower this since so many new users joined
    maxBoost: 5, // Max points from user trust score
    multiplier: 0.1, // Trust score * multiplier = points (e.g., 50 trust = 5 points)
  },
  voteWeight: {
    logBase: 10, // Logarithm base for vote count weighting
    offset: 10, // Offset added to vote count before log (prevents log(0))
  },
  recencyWeight: {
    // new listings are more relevant
    halfLifeDays: 180, // Days until listing weight decays to 90%
    decayRate: 0.9, // Weight multiplier per half-life period
  },
} as const

/**
 * Maps performance scale rank (1-8) to quality score (0-100)
 * Lower rank = better performance
 */
export const PERFORMANCE_RANK_TO_QUALITY: Record<number, number> = {
  1: 100, // Perfect - Plays perfectly
  2: 85, // Great - Very few non-game-breaking issues
  3: 70, // Playable - Minor issues or frame drops
  4: 40, // Poor - FPS in single digits
  5: 30, // Ingame - Major issues
  6: 15, // Intro - Doesn't play past intro/menu
  7: 5, // Loadable - Loads but doesn't play
  8: 0, // Nothing - Doesn't work at all
}

/**
 * Confidence level thresholds based on data quantity
 */
export interface ConfidenceThresholds {
  lowToMedium: { listings: number; votes: number }
  mediumToHigh: { listings: number; votes: number }
}

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  lowToMedium: { listings: 3, votes: 5 },
  mediumToHigh: { listings: 10, votes: 20 },
}

/**
 * Gets the performance quality score (0-100) from a performance rank
 */
export function getPerformanceQualityScore(performanceRank: number): number {
  return PERFORMANCE_RANK_TO_QUALITY[performanceRank] ?? 0
}

/**
 * Calculates the developer verification boost (0-20 points)
 * Considers both:
 * - Author being a verified developer for the emulator
 * - Explicit verifications from other developers
 */
export function getVerificationBoost(
  listing: Pick<ScoringListingWithMetadata, 'isVerifiedDeveloper' | 'developerVerifications'>,
): number {
  const config = SCORING_CONFIG.verification
  let boost = 0

  // Author is verified developer for this emulator
  if (listing.isVerifiedDeveloper) {
    boost += config.authorIsVerifiedDeveloper
  }

  // Explicit developer verifications
  const verificationCount = listing.developerVerifications?.length ?? 0
  if (verificationCount > 0) {
    boost += Math.min(
      verificationCount * config.perExplicitVerification,
      config.maxFromVerifications,
    )
  }

  return Math.min(boost, config.totalCap)
}

/**
 * Calculates trust score boost (0-5 points)
 * Trust score can only positively impact the score
 * Listings from users with negative trust score should be excluded before calling this
 */
export function calculateTrustBoost(userTrustScore: number): number {
  if (userTrustScore <= 0) return 0

  const config = SCORING_CONFIG.trust

  // Linear boost: trustScore * multiplier, capped at maxBoost
  // Default: 50 trust score = +5 points max, 25 trust = +2.5 points, 10 trust = +1 point
  return Math.min(config.maxBoost, userTrustScore * config.multiplier)
}

/**
 * Calculates a single listing's compatibility score (0-100)
 *
 * Formula:
 * - When voteCount === 0:
 *   Base Score = Performance Quality + Trust Boost + Developer Verification Boost
 * - When voteCount > 0:
 *   Base Score = (Performance Quality * 0.5) + (Vote Confidence * 0.3) + Developer Verification Boost
 * - Final Score capped at 100
 */
export function calculateListingScore(
  listing: ScoringListingWithMetadata,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
): number {
  // Exclude listings from users with negative trust score
  const userTrustScore = listing.author?.trustScore ?? 0
  if (userTrustScore < 0) {
    return 0
  }

  // 1. Performance quality score (0-100)
  const performanceScore = getPerformanceQualityScore(listing.performance.rank)

  // 2. Developer verification boost (0-20)
  const verificationBoost = getVerificationBoost(listing)

  // 3. Handle zero-vote scenario differently
  if (listing.voteCount === 0) {
    // Use performance rating + trust score only (no vote confidence)
    const trustBoost = calculateTrustBoost(userTrustScore)
    const finalScore = Math.min(100, performanceScore + verificationBoost + trustBoost)
    return Math.round(finalScore)
  }

  // 4. Has votes - use weighted formula
  // Vote confidence from Wilson score (0-100)
  const voteConfidence = listing.successRate * 100

  // Weighted combination
  const baseScore = performanceScore * weights.performance + voteConfidence * weights.voteConfidence

  // Add verification boost and cap at 100
  const finalScore = Math.min(100, baseScore + verificationBoost)

  return Math.round(finalScore)
}

/**
 * Weight configuration for aggregating multiple listings
 */
export interface AggregationWeights {
  voteCount: number // Weight based on number of votes
  recency: number // Weight based on how recent the listing is
}

export const DEFAULT_AGGREGATION_WEIGHTS: AggregationWeights = {
  voteCount: 1.0, // Full weight to vote count
  recency: 0.0, // No recency bias by default (can enable later)
}

/**
 * Calculates a logarithmic weight based on vote count
 * More votes = more weight, but with diminishing returns
 */
export function calculateVoteWeight(voteCount: number): number {
  const config = SCORING_CONFIG.voteWeight

  // log10(voteCount + offset) with defaults gives:
  // 0 votes -> weight of 1.0
  // 1 vote -> weight of 1.04
  // 10 votes -> weight of 1.3
  // 100 votes -> weight of 2.04
  // 1000 votes -> weight of 3.0
  return Math.log(voteCount + config.offset) / Math.log(config.logBase)
}

/**
 * Calculates a recency weight based on listing age
 * Newer listings get slightly higher weight
 */
export function calculateRecencyWeight(createdAt: Date, now: Date = new Date()): number {
  const config = SCORING_CONFIG.recencyWeight
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

  // Exponential decay: listings lose weight over time
  // Default (halfLife=180, decay=0.9):
  // 0 days old -> weight of 1.0
  // 180 days old -> weight of 0.9
  // 360 days old -> weight of 0.81
  return Math.pow(config.decayRate, ageInDays / config.halfLifeDays)
}

/**
 * Aggregates multiple listing scores into a single system-level score
 * Uses weighted average based on vote count (and optionally recency)
 */
export function aggregateSystemScore(
  listings: ScoringListingWithMetadata[],
  weights: AggregationWeights = DEFAULT_AGGREGATION_WEIGHTS,
): number {
  if (listings.length === 0) {
    return 0
  }

  let totalWeightedScore = 0
  let totalWeight = 0

  const now = new Date()

  for (const listing of listings) {
    const listingScore = calculateListingScore(listing)

    // Calculate composite weight
    const voteWeight = calculateVoteWeight(listing.voteCount)
    const recencyWeight = calculateRecencyWeight(listing.createdAt, now)

    const compositeWeight = voteWeight * weights.voteCount + recencyWeight * weights.recency

    totalWeightedScore += listingScore * compositeWeight
    totalWeight += compositeWeight
  }

  const averageScore = totalWeightedScore / totalWeight
  return Math.round(averageScore)
}

/**
 * Determines confidence level based on data quantity and quality
 */
export function calculateConfidenceLevel(
  listingCount: number,
  totalVotes: number,
  thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS,
): 'low' | 'medium' | 'high' {
  if (
    listingCount >= thresholds.mediumToHigh.listings &&
    totalVotes >= thresholds.mediumToHigh.votes
  ) {
    return 'high'
  }

  if (
    listingCount >= thresholds.lowToMedium.listings &&
    totalVotes >= thresholds.lowToMedium.votes
  ) {
    return 'medium'
  }

  return 'low'
}

/**
 * Aggregates listings by emulator and calculates per-emulator scores
 */
export interface EmulatorScoring {
  emulatorId: string
  emulator: Pick<Emulator, 'id' | 'name' | 'logo'>
  listings: ScoringListingWithMetadata[]
  avgCompatibilityScore: number
  avgPerformanceRank: number
  avgSuccessRate: number | null
  developerVerifiedCount: number
  authoredByDeveloperCount: number
}

export function aggregateByEmulator(listings: ScoringListingWithMetadata[]): EmulatorScoring[] {
  const emulatorMap = new Map<string, ScoringListingWithMetadata[]>()

  for (const listing of listings) {
    if (!listing.emulator) continue

    const emulatorId = listing.emulator.id
    if (!emulatorMap.has(emulatorId)) {
      emulatorMap.set(emulatorId, [])
    }
    emulatorMap.get(emulatorId)!.push(listing)
  }

  const results: EmulatorScoring[] = []

  for (const [emulatorId, emulatorListings] of emulatorMap.entries()) {
    const firstListing = emulatorListings[0]
    if (!firstListing?.emulator) continue
    const emulator = firstListing.emulator

    const avgCompatibilityScore = aggregateSystemScore(emulatorListings)

    const avgPerformanceRank =
      emulatorListings.reduce((sum, l) => sum + l.performance.rank, 0) / emulatorListings.length

    const listingsWithVotes = emulatorListings.filter((l) => l.voteCount > 0)
    const avgSuccessRate =
      listingsWithVotes.length > 0
        ? listingsWithVotes.reduce((sum, l) => sum + l.successRate, 0) / listingsWithVotes.length
        : null

    const developerVerifiedCount = emulatorListings.filter(
      (l) => (l.developerVerifications?.length ?? 0) > 0,
    ).length

    const authoredByDeveloperCount = emulatorListings.filter((l) => l.isVerifiedDeveloper).length

    results.push({
      emulatorId,
      emulator,
      listings: emulatorListings,
      avgCompatibilityScore,
      avgPerformanceRank,
      avgSuccessRate,
      developerVerifiedCount,
      authoredByDeveloperCount,
    })
  }

  return results.sort((a, b) => b.avgCompatibilityScore - a.avgCompatibilityScore)
}

/**
 * Aggregates listings by system and calculates per-system scores
 */
export interface SystemScoring {
  systemId: string
  system: System
  listings: ScoringListingWithMetadata[]
  uniqueGames: Set<string>
  compatibilityScore: number
  avgPerformanceRank: number
  avgSuccessRate: number | null
  developerVerifiedCount: number
  authoredByDeveloperCount: number
  totalVotes: number
  lastUpdated: Date
  emulatorBreakdown: EmulatorScoring[]
}

export function aggregateBySystem(listings: ScoringListingWithMetadata[]): SystemScoring[] {
  const systemMap = new Map<string, ScoringListingWithMetadata[]>()

  for (const listing of listings) {
    if (!listing.game?.system) continue

    const systemId = listing.game.system.id
    if (!systemMap.has(systemId)) {
      systemMap.set(systemId, [])
    }
    systemMap.get(systemId)!.push(listing)
  }

  const results: SystemScoring[] = []

  for (const [systemId, systemListings] of systemMap.entries()) {
    const system = systemListings[0]?.game?.system
    if (!system) continue

    const compatibilityScore = aggregateSystemScore(systemListings)

    const uniqueGames = new Set(systemListings.map((l) => l.game!.id))

    const avgPerformanceRank =
      systemListings.reduce((sum, l) => sum + l.performance.rank, 0) / systemListings.length

    const totalVotes = systemListings.reduce((sum, l) => sum + l.voteCount, 0)
    const listingsWithVotes = systemListings.filter((l) => l.voteCount > 0)
    const avgSuccessRate =
      listingsWithVotes.length > 0
        ? listingsWithVotes.reduce((sum, l) => sum + l.successRate, 0) / listingsWithVotes.length
        : null

    const developerVerifiedCount = systemListings.filter(
      (l) => (l.developerVerifications?.length ?? 0) > 0,
    ).length

    const authoredByDeveloperCount = systemListings.filter((l) => l.isVerifiedDeveloper).length

    const lastUpdated = systemListings.reduce(
      (latest, l) => (l.createdAt > latest ? l.createdAt : latest),
      systemListings[0]!.createdAt,
    )

    const emulatorBreakdown = aggregateByEmulator(systemListings)

    results.push({
      systemId,
      system,
      listings: systemListings,
      uniqueGames,
      compatibilityScore,
      avgPerformanceRank,
      avgSuccessRate,
      developerVerifiedCount,
      authoredByDeveloperCount,
      totalVotes,
      lastUpdated,
      emulatorBreakdown,
    })
  }

  return results.sort((a, b) => b.compatibilityScore - a.compatibilityScore)
}
