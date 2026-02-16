import { describe, expect, it, beforeEach, vi } from 'vitest'
import { RISK_SIGNAL_TYPES } from '@/schemas/authorRisk'
import { computeAuthorRiskProfiles } from './author-risk.service'
import type { PrismaClient } from '@orm'

vi.mock('@orm/sql', () => ({
  getAuthorReportStats: (authorIds: string[]) => ({ sql: 'getAuthorReportStats', authorIds }),
  getAuthorVoteStats: (authorIds: string[], since: Date) => ({
    sql: 'getAuthorVoteStats',
    authorIds,
    since,
  }),
  getAuthorsWithApprovedListings: (authorIds: string[]) => ({
    sql: 'getAuthorsWithApprovedListings',
    authorIds,
  }),
}))

/**
 * Mock Prisma client that stubs $queryRawTyped.
 *
 * computeAuthorRiskProfiles calls $queryRawTyped exactly 3 times via Promise.all
 * in this deterministic order:
 *   1. batchGetAuthorReportStats → report rows
 *   2. batchCheckVoteFlags       → vote stats rows
 *   3. batchCheckNewAuthors      → rows of authors WITH approved listings
 */
function createMockPrisma() {
  return {
    $queryRawTyped: vi.fn().mockResolvedValue([]),
  }
}

/**
 * Sets up the three $queryRawTyped mock responses in the correct call order.
 *
 * @param reportRows    - Rows with { authorId, reportCount }
 * @param voteRows      - Rows with { userId, totalVotes, downvotes, votesLast24h }
 * @param approvedRows  - Rows with { authorId } for authors who HAVE approved listings
 *                        (authors NOT in this list are flagged as NEW_AUTHOR)
 */
function setupQueryMocks(
  prisma: ReturnType<typeof createMockPrisma>,
  reportRows: { authorId: string; reportCount: number }[] = [],
  voteRows: { userId: string; totalVotes: number; downvotes: number; votesLast24h: number }[] = [],
  approvedRows: { authorId: string }[] = [],
) {
  prisma.$queryRawTyped
    .mockResolvedValueOnce(reportRows)
    .mockResolvedValueOnce(voteRows)
    .mockResolvedValueOnce(approvedRows)
}

const AUTHOR_A = 'author-a'
const AUTHOR_B = 'author-b'
const AUTHOR_C = 'author-c'

describe('computeAuthorRiskProfiles', () => {
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
  })

  it('returns empty map for empty author list', async () => {
    const result = await computeAuthorRiskProfiles(prisma as unknown as PrismaClient, [], new Map())
    expect(result.size).toBe(0)
    expect(prisma.$queryRawTyped).not.toHaveBeenCalled()
  })

  it('returns only NEW_AUTHOR signal when author has no risk factors and no approved listings', async () => {
    setupQueryMocks(prisma, [], [], [])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    expect(profile).toBeDefined()
    expect(profile!.signals).toHaveLength(1)
    expect(profile!.signals[0].type).toBe(RISK_SIGNAL_TYPES.NEW_AUTHOR)
    expect(profile!.highestSeverity).toBe('low')
  })

  it('returns no signals when author has approved listings and no risk factors', async () => {
    setupQueryMocks(prisma, [], [], [{ authorId: AUTHOR_A }])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    expect(profile).toBeDefined()
    expect(profile!.signals).toHaveLength(0)
    expect(profile!.highestSeverity).toBeNull()
  })

  it('detects active ban as high severity', async () => {
    const bansMap = new Map([[AUTHOR_A, [{ reason: 'spam content' }]]])
    setupQueryMocks(prisma, [], [], [{ authorId: AUTHOR_A }])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      bansMap,
    )

    const profile = result.get(AUTHOR_A)
    const banSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.ACTIVE_BAN)
    expect(banSignal).toBeDefined()
    expect(banSignal!.severity).toBe('high')
    expect(banSignal!.description).toContain('spam content')
    expect(profile!.highestSeverity).toBe('high')
  })

  it('detects 1 active report as low severity', async () => {
    setupQueryMocks(prisma, [{ authorId: AUTHOR_A, reportCount: 1 }], [], [])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const reportSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.ACTIVE_REPORTS)
    expect(reportSignal).toBeDefined()
    expect(reportSignal!.severity).toBe('low')
  })

  it('detects 4 active reports as medium severity', async () => {
    setupQueryMocks(prisma, [{ authorId: AUTHOR_A, reportCount: 4 }], [], [])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const reportSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.ACTIVE_REPORTS)
    expect(reportSignal).toBeDefined()
    expect(reportSignal!.severity).toBe('medium')
  })

  it('detects 8 active reports as high severity', async () => {
    setupQueryMocks(prisma, [{ authorId: AUTHOR_A, reportCount: 8 }], [], [])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const reportSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.ACTIVE_REPORTS)
    expect(reportSignal).toBeDefined()
    expect(reportSignal!.severity).toBe('high')
  })

  it('detects new author with no approved listings as low severity', async () => {
    setupQueryMocks(prisma, [], [], [])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const newAuthorSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.NEW_AUTHOR)
    expect(newAuthorSignal).toBeDefined()
    expect(newAuthorSignal!.severity).toBe('low')
  })

  it('does not flag author with approved listings as new', async () => {
    setupQueryMocks(prisma, [], [], [{ authorId: AUTHOR_A }])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const newAuthorSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.NEW_AUTHOR)
    expect(newAuthorSignal).toBeUndefined()
  })

  it('detects >90% downvote ratio as medium suspicious voting', async () => {
    // 92% downvotes (23 out of 25)
    setupQueryMocks(
      prisma,
      [],
      [{ userId: AUTHOR_A, totalVotes: 25, downvotes: 23, votesLast24h: 0 }],
      [{ authorId: AUTHOR_A }],
    )

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const voteSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING)
    expect(voteSignal).toBeDefined()
    expect(voteSignal!.severity).toBe('medium')
  })

  it('detects >95% downvote ratio as high suspicious voting', async () => {
    // 97% downvotes (29 out of 30)
    setupQueryMocks(
      prisma,
      [],
      [{ userId: AUTHOR_A, totalVotes: 30, downvotes: 29, votesLast24h: 0 }],
      [{ authorId: AUTHOR_A }],
    )

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const voteSignal = profile!.signals.find((s) => s.type === RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING)
    expect(voteSignal).toBeDefined()
    expect(voteSignal!.severity).toBe('high')
  })

  it('detects high vote volume (>50 in 24h) as high severity', async () => {
    setupQueryMocks(
      prisma,
      [],
      [{ userId: AUTHOR_A, totalVotes: 55, downvotes: 0, votesLast24h: 55 }],
      [{ authorId: AUTHOR_A }],
    )

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      new Map(),
    )

    const profile = result.get(AUTHOR_A)
    const volumeSignal = profile!.signals.find(
      (s) => s.type === RISK_SIGNAL_TYPES.SUSPICIOUS_VOTING && s.label === 'High Vote Volume',
    )
    expect(volumeSignal).toBeDefined()
    expect(volumeSignal!.severity).toBe('high')
  })

  it('picks highest severity across multiple signals', async () => {
    // Ban = high, reports = low, new author = low
    const bansMap = new Map([[AUTHOR_A, [{ reason: 'spam' }]]])

    setupQueryMocks(prisma, [{ authorId: AUTHOR_A, reportCount: 1 }], [], [])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A],
      bansMap,
    )

    const profile = result.get(AUTHOR_A)
    expect(profile!.signals.length).toBeGreaterThan(1)
    expect(profile!.highestSeverity).toBe('high')
  })

  it('processes multiple authors in a single batch', async () => {
    const bansMap = new Map([[AUTHOR_B, [{ reason: 'abuse' }]]])

    // Author A has 1 report, Author C has approved listings
    setupQueryMocks(prisma, [{ authorId: AUTHOR_A, reportCount: 1 }], [], [{ authorId: AUTHOR_C }])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A, AUTHOR_B, AUTHOR_C],
      bansMap,
    )

    expect(result.size).toBe(3)

    // Author A: reports (low) + new author (low)
    const profileA = result.get(AUTHOR_A)!
    expect(profileA.signals.some((s) => s.type === RISK_SIGNAL_TYPES.ACTIVE_REPORTS)).toBe(true)
    expect(profileA.highestSeverity).not.toBeNull()

    // Author B: banned (high) + new author (low)
    const profileB = result.get(AUTHOR_B)!
    expect(profileB.signals.some((s) => s.type === RISK_SIGNAL_TYPES.ACTIVE_BAN)).toBe(true)
    expect(profileB.highestSeverity).toBe('high')

    // Author C: no risk signals (has approved listings, no reports, no bans)
    const profileC = result.get(AUTHOR_C)!
    expect(
      profileC.signals.every(
        (s) =>
          s.type !== RISK_SIGNAL_TYPES.ACTIVE_BAN && s.type !== RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
      ),
    ).toBe(true)
  })

  it('deduplicates author IDs', async () => {
    setupQueryMocks(prisma, [], [], [])

    const result = await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A, AUTHOR_A, AUTHOR_A],
      new Map(),
    )

    expect(result.size).toBe(1)
  })

  it('makes exactly 3 database queries per call', async () => {
    setupQueryMocks(prisma, [], [], [])

    await computeAuthorRiskProfiles(
      prisma as unknown as PrismaClient,
      [AUTHOR_A, AUTHOR_B],
      new Map(),
    )

    expect(prisma.$queryRawTyped).toHaveBeenCalledTimes(3)
  })
})
