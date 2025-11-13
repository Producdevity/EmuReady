import { describe, it, expect } from 'vitest'
import { ApprovalStatus } from '@orm'
import {
  getPerformanceQualityScore,
  getVerificationBoost,
  calculateListingScore,
  calculateVoteWeight,
  calculateRecencyWeight,
  aggregateSystemScore,
  calculateConfidenceLevel,
  aggregateByEmulator,
  aggregateBySystem,
  type ScoringListingWithMetadata,
} from './compatibility-scoring'

describe('Performance Quality Score', () => {
  it('should map rank 1 (Perfect) to 100', () => {
    expect(getPerformanceQualityScore(1)).toBe(100)
  })

  it('should map rank 2 (Great) to 85', () => {
    expect(getPerformanceQualityScore(2)).toBe(85)
  })

  it('should map rank 3 (Playable) to 70', () => {
    expect(getPerformanceQualityScore(3)).toBe(70)
  })

  it('should map rank 8 (Nothing) to 0', () => {
    expect(getPerformanceQualityScore(8)).toBe(0)
  })

  it('should return 0 for unknown ranks', () => {
    expect(getPerformanceQualityScore(99)).toBe(0)
  })
})

describe('Verification Boost', () => {
  it('should return 0 for unverified listings', () => {
    const listing: Pick<
      ScoringListingWithMetadata,
      'isVerifiedDeveloper' | 'developerVerifications'
    > = {
      isVerifiedDeveloper: false,
      developerVerifications: [],
    }
    expect(getVerificationBoost(listing)).toBe(0)
  })

  it('should give +10 for verified developer author', () => {
    const listing: Pick<
      ScoringListingWithMetadata,
      'isVerifiedDeveloper' | 'developerVerifications'
    > = {
      isVerifiedDeveloper: true,
      developerVerifications: [],
    }
    expect(getVerificationBoost(listing)).toBe(10)
  })

  it('should give +5 per explicit developer verification', () => {
    const listing: Pick<
      ScoringListingWithMetadata,
      'isVerifiedDeveloper' | 'developerVerifications'
    > = {
      isVerifiedDeveloper: false,
      developerVerifications: [{ id: '1' } as never, { id: '2' } as never],
    }
    expect(getVerificationBoost(listing)).toBe(10)
  })

  it('should cap explicit verifications at +10', () => {
    const listing: Pick<
      ScoringListingWithMetadata,
      'isVerifiedDeveloper' | 'developerVerifications'
    > = {
      isVerifiedDeveloper: false,
      developerVerifications: Array(5).fill({ id: 'test' }) as never,
    }
    expect(getVerificationBoost(listing)).toBe(10)
  })

  it('should combine author and explicit verifications (max +20)', () => {
    const listing: Pick<
      ScoringListingWithMetadata,
      'isVerifiedDeveloper' | 'developerVerifications'
    > = {
      isVerifiedDeveloper: true,
      developerVerifications: [{ id: '1' } as never, { id: '2' } as never],
    }
    expect(getVerificationBoost(listing)).toBe(20)
  })

  it('should cap total boost at +20', () => {
    const listing: Pick<
      ScoringListingWithMetadata,
      'isVerifiedDeveloper' | 'developerVerifications'
    > = {
      isVerifiedDeveloper: true,
      developerVerifications: Array(5).fill({ id: 'test' }) as never,
    }
    expect(getVerificationBoost(listing)).toBe(20)
  })
})

describe('calculateListingScore', () => {
  const createMockListing = (
    performanceRank: number,
    successRate: number,
    isVerified: boolean = false,
    devVerifications: number = 0,
  ): ScoringListingWithMetadata => ({
    id: 'test-id',
    performanceId: performanceRank,
    performance: { id: performanceRank, rank: performanceRank, label: 'Test', description: null },
    successRate,
    voteCount: 10,
    upvoteCount: 8,
    downvoteCount: 2,
    isVerifiedDeveloper: isVerified,
    developerVerifications: Array(devVerifications).fill({ id: 'test' }) as never,
    createdAt: new Date(),
  })

  it('should calculate score for Perfect performance with high votes', () => {
    const listing = createMockListing(1, 0.95, false, 0)
    const score = calculateListingScore(listing)

    // Expected: (100 * 0.5) + (95 * 0.3) + 0 = 50 + 28.5 + 0 = 78.5 → 79
    expect(score).toBe(79)
  })

  it('should calculate score for Playable performance with medium votes', () => {
    const listing = createMockListing(3, 0.7, false, 0)
    const score = calculateListingScore(listing)

    // Expected: (70 * 0.5) + (70 * 0.3) + 0 = 35 + 21 + 0 = 56
    expect(score).toBe(56)
  })

  it('should add verification boost for verified developer', () => {
    const listing = createMockListing(1, 0.95, true, 0)
    const score = calculateListingScore(listing)

    // Expected: (100 * 0.5) + (95 * 0.3) + 10 = 50 + 28.5 + 10 = 88.5 → 89
    expect(score).toBe(89)
  })

  it('should cap final score at 100', () => {
    const listing = createMockListing(1, 1.0, true, 3)
    const score = calculateListingScore(listing)

    // Expected: (100 * 0.5) + (100 * 0.3) + 20 = 50 + 30 + 20 = 100
    expect(score).toBe(100)
  })

  it('should handle Nothing performance (rank 8)', () => {
    const listing = createMockListing(8, 0.1, false, 0)
    const score = calculateListingScore(listing)

    // Expected: (0 * 0.5) + (10 * 0.3) + 0 = 0 + 3 + 0 = 3
    expect(score).toBe(3)
  })

  it('should use custom weights when provided', () => {
    const listing = createMockListing(1, 0.8, false, 0)
    const customWeights = {
      performance: 0.7,
      voteConfidence: 0.2,
      developerVerification: 0.1,
    }
    const score = calculateListingScore(listing, customWeights)

    // Expected: (100 * 0.7) + (80 * 0.2) + 0 = 70 + 16 + 0 = 86
    expect(score).toBe(86)
  })
})

describe('Vote Weight Calculation', () => {
  it('should return 1.0 for 0 votes', () => {
    expect(calculateVoteWeight(0)).toBeCloseTo(1.0, 2)
  })

  it('should increase weight with vote count (logarithmic)', () => {
    const weight0 = calculateVoteWeight(0)
    const weight10 = calculateVoteWeight(10)
    const weight100 = calculateVoteWeight(100)

    expect(weight10).toBeGreaterThan(weight0)
    expect(weight100).toBeGreaterThan(weight10)
    expect(weight100).toBeLessThan(weight10 * 10) // Logarithmic growth
  })

  it('should match expected logarithmic values', () => {
    expect(calculateVoteWeight(0)).toBeCloseTo(1.0, 1)
    expect(calculateVoteWeight(10)).toBeCloseTo(1.3, 1)
    expect(calculateVoteWeight(100)).toBeCloseTo(2.04, 1)
  })
})

describe('Recency Weight Calculation', () => {
  it('should return 1.0 for brand new listings', () => {
    const now = new Date()
    expect(calculateRecencyWeight(now, now)).toBe(1.0)
  })

  it('should decrease weight with age', () => {
    const now = new Date()
    const old180Days = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    const old360Days = new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000)

    const weight0 = calculateRecencyWeight(now, now)
    const weight180 = calculateRecencyWeight(old180Days, now)
    const weight360 = calculateRecencyWeight(old360Days, now)

    expect(weight180).toBeLessThan(weight0)
    expect(weight360).toBeLessThan(weight180)
  })

  it('should use exponential decay (10% per 180 days)', () => {
    const now = new Date()
    const old180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    expect(calculateRecencyWeight(old180, now)).toBeCloseTo(0.9, 2)
  })
})

describe('Aggregate System Score', () => {
  const createMockListings = (count: number, score: number, votes: number) => {
    return Array(count)
      .fill(null)
      .map(
        (_, i) =>
          ({
            id: `listing-${i}`,
            performanceId: 2,
            performance: { id: 2, rank: 2, label: 'Great', description: null },
            successRate: score / 100,
            voteCount: votes,
            upvoteCount: votes,
            downvoteCount: 0,
            isVerifiedDeveloper: false,
            developerVerifications: [],
            createdAt: new Date(),
          }) as ScoringListingWithMetadata,
      )
  }

  it('should return 0 for empty listings array', () => {
    expect(aggregateSystemScore([])).toBe(0)
  })

  it('should return listing score for single listing', () => {
    const listings = createMockListings(1, 85, 10)
    const aggregated = aggregateSystemScore(listings)

    expect(aggregated).toBeGreaterThan(0)
    expect(aggregated).toBeLessThanOrEqual(100)
  })

  it('should weight by vote count (more votes = more influence)', () => {
    const highVoteListing: ScoringListingWithMetadata = {
      id: '1',
      performanceId: 1,
      performance: { id: 1, rank: 1, label: 'Perfect', description: null },
      successRate: 0.95,
      voteCount: 100,
      upvoteCount: 95,
      downvoteCount: 5,
      isVerifiedDeveloper: false,
      developerVerifications: [],
      createdAt: new Date(),
    }

    const lowVoteListing: ScoringListingWithMetadata = {
      id: '2',
      performanceId: 8,
      performance: { id: 8, rank: 8, label: 'Nothing', description: null },
      successRate: 0.1,
      voteCount: 1,
      upvoteCount: 0,
      downvoteCount: 1,
      isVerifiedDeveloper: false,
      developerVerifications: [],
      createdAt: new Date(),
    }

    const aggregated = aggregateSystemScore([highVoteListing, lowVoteListing])

    // Should be closer to highVoteListing score due to higher weight
    const highScore = calculateListingScore(highVoteListing)
    const lowScore = calculateListingScore(lowVoteListing)

    expect(aggregated).toBeGreaterThan((highScore + lowScore) / 2)
  })

  it('should handle identical listings', () => {
    const listings = createMockListings(5, 70, 10)
    const aggregated = aggregateSystemScore(listings)
    const single = calculateListingScore(listings[0]!)

    expect(aggregated).toBeCloseTo(single, 0)
  })
})

describe('Confidence Level Calculation', () => {
  it('should return low confidence for insufficient data', () => {
    expect(calculateConfidenceLevel(1, 0)).toBe('low')
    expect(calculateConfidenceLevel(2, 4)).toBe('low')
    expect(calculateConfidenceLevel(3, 3)).toBe('low')
  })

  it('should return medium confidence for moderate data', () => {
    expect(calculateConfidenceLevel(3, 5)).toBe('medium')
    expect(calculateConfidenceLevel(5, 10)).toBe('medium')
    expect(calculateConfidenceLevel(9, 19)).toBe('medium')
  })

  it('should return high confidence for substantial data', () => {
    expect(calculateConfidenceLevel(10, 20)).toBe('high')
    expect(calculateConfidenceLevel(20, 50)).toBe('high')
    expect(calculateConfidenceLevel(100, 200)).toBe('high')
  })

  it('should require both thresholds for higher confidence', () => {
    expect(calculateConfidenceLevel(10, 5)).toBe('medium') // Enough listings, not enough votes
    expect(calculateConfidenceLevel(2, 30)).toBe('low') // Enough votes, not enough listings
  })
})

describe('Aggregate by Emulator', () => {
  const mockEmulator = {
    id: 'emulator-1',
    name: 'Skyline',
    logo: 'skyline',
  }

  const mockSystem = {
    id: 'system-1',
    name: 'Nintendo Switch',
    key: 'nintendo_switch',
    tgdbPlatformId: null,
  }

  const createListingWithEmulator = (
    emulatorId: string,
    performanceRank: number,
    successRate: number,
  ): ScoringListingWithMetadata => ({
    id: `listing-${emulatorId}-${performanceRank}`,
    performanceId: performanceRank,
    performance: { id: performanceRank, rank: performanceRank, label: 'Test', description: null },
    successRate,
    voteCount: 10,
    upvoteCount: 8,
    downvoteCount: 2,
    emulator: mockEmulator,
    game: {
      id: 'game-1',
      title: 'Test Game',
      systemId: 'system-1',
      system: mockSystem,
      createdAt: new Date(),
      status: ApprovalStatus.APPROVED,
      imageUrl: null,
      boxartUrl: null,
      bannerUrl: null,
      tgdbGameId: null,
      metadata: null,
      isErotic: false,
      submittedBy: null,
      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
    },
    isVerifiedDeveloper: false,
    developerVerifications: [],
    createdAt: new Date(),
  })

  it('should return empty array for no listings', () => {
    expect(aggregateByEmulator([])).toEqual([])
  })

  it('should aggregate single emulator', () => {
    const listings = [
      createListingWithEmulator('emu-1', 1, 0.9),
      createListingWithEmulator('emu-1', 2, 0.8),
    ]

    const result = aggregateByEmulator(listings)

    expect(result).toHaveLength(1)
    expect(result[0]?.emulatorId).toBe('emulator-1')
    expect(result[0]?.listings).toHaveLength(2)
    expect(result[0]?.avgCompatibilityScore).toBeGreaterThan(0)
  })

  it('should sort emulators by score descending', () => {
    const emulator1 = { id: 'emu-1', name: 'Good Emulator', logo: null }
    const emulator2 = { id: 'emu-2', name: 'Better Emulator', logo: null }

    const listings: ScoringListingWithMetadata[] = [
      {
        ...createListingWithEmulator('emu-1', 3, 0.7),
        emulator: emulator1,
      },
      {
        ...createListingWithEmulator('emu-2', 1, 0.95),
        emulator: emulator2,
      },
    ]

    const result = aggregateByEmulator(listings)

    expect(result).toHaveLength(2)
    expect(result[0]?.emulatorId).toBe('emu-2') // Better emulator first
    expect(result[1]?.emulatorId).toBe('emu-1')
  })

  it('should calculate metrics correctly', () => {
    const listings = [
      { ...createListingWithEmulator('emu-1', 1, 0.9), isVerifiedDeveloper: true },
      {
        ...createListingWithEmulator('emu-1', 2, 0.8),
        developerVerifications: [{ id: 'dev-1' }] as never,
      },
      createListingWithEmulator('emu-1', 3, 0.7),
    ]

    const result = aggregateByEmulator(listings)

    expect(result[0]?.avgPerformanceRank).toBeCloseTo(2.0, 1) // (1+2+3)/3
    expect(result[0]?.avgSuccessRate).toBeCloseTo(0.8, 1) // (0.9+0.8+0.7)/3
    expect(result[0]?.developerVerifiedCount).toBe(1) // One with explicit verification
    expect(result[0]?.authoredByDeveloperCount).toBe(1) // One authored by verified dev
  })
})

describe('Aggregate by System', () => {
  const mockSystem1 = {
    id: 'system-1',
    name: 'Nintendo Switch',
    key: 'nintendo_switch',
    tgdbPlatformId: null,
  }

  const mockSystem2 = {
    id: 'system-2',
    name: 'PlayStation 3',
    key: 'playstation_3',
    tgdbPlatformId: null,
  }

  const createListingWithSystem = (
    systemId: string,
    gameId: string,
    performanceRank: number,
  ): ScoringListingWithMetadata => ({
    id: `listing-${systemId}-${gameId}`,
    performanceId: performanceRank,
    performance: { id: performanceRank, rank: performanceRank, label: 'Test', description: null },
    successRate: 0.8,
    voteCount: 10,
    upvoteCount: 8,
    downvoteCount: 2,
    emulator: { id: 'emu-1', name: 'Emulator', logo: null },
    game: {
      id: gameId,
      title: 'Game',
      systemId,
      system: systemId === 'system-1' ? mockSystem1 : mockSystem2,
      createdAt: new Date(),
      status: ApprovalStatus.APPROVED,
      imageUrl: null,
      boxartUrl: null,
      bannerUrl: null,
      tgdbGameId: null,
      metadata: null,
      isErotic: false,
      submittedBy: null,
      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
    },
    isVerifiedDeveloper: false,
    developerVerifications: [],
    createdAt: new Date(),
  })

  it('should return empty array for no listings', () => {
    expect(aggregateBySystem([])).toEqual([])
  })

  it('should aggregate single system', () => {
    const listings = [
      createListingWithSystem('system-1', 'game-1', 1),
      createListingWithSystem('system-1', 'game-2', 2),
    ]

    const result = aggregateBySystem(listings)

    expect(result).toHaveLength(1)
    expect(result[0]?.systemId).toBe('system-1')
    expect(result[0]?.uniqueGames.size).toBe(2)
    expect(result[0]?.listings).toHaveLength(2)
  })

  it('should count unique games correctly', () => {
    const listings = [
      createListingWithSystem('system-1', 'game-1', 1),
      createListingWithSystem('system-1', 'game-1', 2), // Same game
      createListingWithSystem('system-1', 'game-2', 1),
    ]

    const result = aggregateBySystem(listings)

    expect(result[0]?.uniqueGames.size).toBe(2) // Only 2 unique games
    expect(result[0]?.listings).toHaveLength(3) // But 3 listings total
  })

  it('should track last updated timestamp', () => {
    const old = new Date('2025-01-01')
    const recent = new Date('2025-11-13')

    const listings: ScoringListingWithMetadata[] = [
      { ...createListingWithSystem('system-1', 'game-1', 1), createdAt: old },
      { ...createListingWithSystem('system-1', 'game-2', 1), createdAt: recent },
    ]

    const result = aggregateBySystem(listings)

    expect(result[0]?.lastUpdated).toEqual(recent)
  })

  it('should sort systems by compatibility score descending', () => {
    const listings = [
      createListingWithSystem('system-1', 'game-1', 3), // Lower score
      createListingWithSystem('system-2', 'game-2', 1), // Higher score
    ]

    const result = aggregateBySystem(listings)

    expect(result).toHaveLength(2)
    expect(result[0]?.systemId).toBe('system-2') // Better system first
  })

  it('should include emulator breakdown', () => {
    const listings = [createListingWithSystem('system-1', 'game-1', 1)]

    const result = aggregateBySystem(listings)

    expect(result[0]?.emulatorBreakdown).toBeDefined()
    expect(result[0]?.emulatorBreakdown.length).toBeGreaterThan(0)
  })
})
