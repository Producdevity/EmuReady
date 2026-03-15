import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  getUserVotes,
  getVotesOnAuthorListings,
  analyzeVotePatterns,
} from './vote-investigation.service'
import type { PrismaClient } from '@orm'

function createMockPrisma() {
  return {
    vote: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    pcListingVote: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  }
}

const USER_ID = 'user-1'
const AUTHOR_A = 'author-a'
const AUTHOR_B = 'author-b'

function makeDate(minutesAgo: number): Date {
  return new Date(Date.now() - minutesAgo * 60 * 1000)
}

function makeHandheldVoteRow(
  overrides: Partial<{
    id: string
    value: boolean
    createdAt: Date
    nullifiedAt: Date | null
    listingId: string
    gameTitle: string
    authorId: string | null
    authorName: string | null
  }> = {},
) {
  return {
    id: overrides.id ?? 'hv-1',
    userId: USER_ID,
    value: overrides.value ?? true,
    createdAt: overrides.createdAt ?? new Date('2025-06-01T12:00:00Z'),
    nullifiedAt: overrides.nullifiedAt ?? null,
    listingId: overrides.listingId ?? 'listing-1',
    listing: {
      id: overrides.listingId ?? 'listing-1',
      authorId: overrides.authorId ?? AUTHOR_A,
      game: { title: overrides.gameTitle ?? 'Mario' },
      author:
        overrides.authorName !== undefined ? { name: overrides.authorName } : { name: 'Author A' },
    },
  }
}

function makePcVoteRow(
  overrides: Partial<{
    id: string
    value: boolean
    createdAt: Date
    nullifiedAt: Date | null
    pcListingId: string
    gameTitle: string
    authorId: string | null
    authorName: string | null
  }> = {},
) {
  return {
    id: overrides.id ?? 'pv-1',
    userId: USER_ID,
    value: overrides.value ?? true,
    createdAt: overrides.createdAt ?? new Date('2025-06-01T12:00:00Z'),
    nullifiedAt: overrides.nullifiedAt ?? null,
    pcListingId: overrides.pcListingId ?? 'pc-listing-1',
    pcListing: {
      id: overrides.pcListingId ?? 'pc-listing-1',
      authorId: overrides.authorId ?? AUTHOR_B,
      game: { title: overrides.gameTitle ?? 'Zelda' },
      author:
        overrides.authorName !== undefined ? { name: overrides.authorName } : { name: 'Author B' },
    },
  }
}

function makeAuthorVoteRow(
  overrides: Partial<{
    id: string
    userId: string
    userName: string | null
    value: boolean
    createdAt: Date
    listingId: string
    gameTitle: string
  }> = {},
) {
  return {
    id: overrides.id ?? 'v-1',
    userId: overrides.userId ?? 'voter-1',
    value: overrides.value ?? true,
    createdAt: overrides.createdAt ?? new Date('2025-06-01'),
    nullifiedAt: null,
    user: { id: overrides.userId ?? 'voter-1', name: overrides.userName ?? 'Voter 1' },
    listing: {
      id: overrides.listingId ?? 'listing-1',
      game: { title: overrides.gameTitle ?? 'Mario' },
    },
  }
}

function makePcAuthorVoteRow(
  overrides: Partial<{
    id: string
    userId: string
    userName: string | null
    value: boolean
    createdAt: Date
    pcListingId: string
    gameTitle: string
  }> = {},
) {
  return {
    id: overrides.id ?? 'pv-1',
    userId: overrides.userId ?? 'voter-1',
    value: overrides.value ?? false,
    createdAt: overrides.createdAt ?? new Date('2025-06-01'),
    nullifiedAt: null,
    user: { id: overrides.userId ?? 'voter-1', name: overrides.userName ?? 'Voter 1' },
    pcListing: {
      id: overrides.pcListingId ?? 'pc-listing-1',
      game: { title: overrides.gameTitle ?? 'Zelda' },
    },
  }
}

// Pattern analysis helpers
function makePatternVoteRow(
  overrides: Partial<{
    value: boolean
    createdAt: Date
    authorId: string | null
    authorName: string | null
  }> = {},
) {
  return {
    id: `v-${Math.random()}`,
    userId: USER_ID,
    value: overrides.value ?? true,
    createdAt: overrides.createdAt ?? new Date('2025-06-01T12:00:00Z'),
    nullifiedAt: null,
    listing: {
      authorId: overrides.authorId ?? AUTHOR_A,
      author:
        overrides.authorName !== undefined ? { name: overrides.authorName } : { name: 'Author A' },
    },
  }
}

describe('vote-investigation.service', () => {
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
  })

  describe('getUserVotes', () => {
    it('returns paginated handheld-only votes', async () => {
      prisma.vote.count.mockResolvedValue(2)
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVoteRow({ id: 'hv-1', gameTitle: 'Mario' }),
        makeHandheldVoteRow({ id: 'hv-2', gameTitle: 'Zelda' }),
      ])

      const result = await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'handheld',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      expect(result.items).toHaveLength(2)
      expect(result.items[0].type).toBe('handheld')
      expect(result.pagination.total).toBe(2)
      expect(prisma.pcListingVote.findMany).not.toHaveBeenCalled()
    })

    it('returns paginated PC-only votes', async () => {
      prisma.pcListingVote.count.mockResolvedValue(1)
      prisma.pcListingVote.findMany.mockResolvedValue([
        makePcVoteRow({ id: 'pv-1', gameTitle: 'Doom' }),
      ])

      const result = await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'pc',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].type).toBe('pc')
      expect(result.pagination.total).toBe(1)
      expect(prisma.vote.findMany).not.toHaveBeenCalled()
    })

    it('returns combined results with manual pagination for listingType=all', async () => {
      prisma.vote.count.mockResolvedValue(2)
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVoteRow({ id: 'hv-1', createdAt: new Date('2025-06-02') }),
        makeHandheldVoteRow({ id: 'hv-2', createdAt: new Date('2025-06-01') }),
      ])
      prisma.pcListingVote.count.mockResolvedValue(1)
      prisma.pcListingVote.findMany.mockResolvedValue([
        makePcVoteRow({ id: 'pv-1', createdAt: new Date('2025-06-03') }),
      ])

      const result = await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'all',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      expect(result.items).toHaveLength(3)
      expect(result.pagination.total).toBe(3)
      // Should be sorted descending by date
      expect(result.items[0].id).toBe('pv-1')
    })

    it('filters by vote type up', async () => {
      prisma.vote.count.mockResolvedValue(1)
      prisma.vote.findMany.mockResolvedValue([makeHandheldVoteRow({ id: 'hv-1', value: true })])

      await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'up',
        listingType: 'handheld',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      expect(prisma.vote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ value: true }),
        }),
      )
    })

    it('filters by vote type down', async () => {
      prisma.vote.count.mockResolvedValue(1)
      prisma.vote.findMany.mockResolvedValue([makeHandheldVoteRow({ id: 'hv-1', value: false })])

      await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'down',
        listingType: 'handheld',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      expect(prisma.vote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ value: false }),
        }),
      )
    })

    it('includes nullified votes when includeNullified is true', async () => {
      prisma.vote.count.mockResolvedValue(2)
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVoteRow({ id: 'hv-1' }),
        makeHandheldVoteRow({ id: 'hv-2', nullifiedAt: new Date() }),
      ])

      await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'handheld',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: true,
      })

      // When includeNullified is true, no nullifiedAt filter should be applied
      const findManyCall = prisma.vote.findMany.mock.calls[0][0]
      expect(findManyCall.where).not.toHaveProperty('nullifiedAt')
    })

    it('excludes nullified votes when includeNullified is false', async () => {
      prisma.vote.count.mockResolvedValue(1)
      prisma.vote.findMany.mockResolvedValue([makeHandheldVoteRow({ id: 'hv-1' })])

      await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'handheld',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      const findManyCall = prisma.vote.findMany.mock.calls[0][0]
      expect(findManyCall.where).toHaveProperty('nullifiedAt', null)
    })

    it('sorts combined results by listingTitle', async () => {
      prisma.vote.count.mockResolvedValue(2)
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVoteRow({ id: 'hv-1', gameTitle: 'Zelda' }),
        makeHandheldVoteRow({ id: 'hv-2', gameTitle: 'Mario' }),
      ])
      prisma.pcListingVote.count.mockResolvedValue(1)
      prisma.pcListingVote.findMany.mockResolvedValue([
        makePcVoteRow({ id: 'pv-1', gameTitle: 'Doom' }),
      ])

      const result = await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'all',
        sortField: 'listingTitle',
        sortDirection: 'asc',
        includeNullified: false,
      })

      expect(result.items[0].listingTitle).toBe('Doom')
      expect(result.items[1].listingTitle).toBe('Mario')
      expect(result.items[2].listingTitle).toBe('Zelda')
    })

    it('sorts combined results by value', async () => {
      prisma.vote.count.mockResolvedValue(2)
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVoteRow({ id: 'hv-1', value: true }),
        makeHandheldVoteRow({ id: 'hv-2', value: false }),
      ])
      prisma.pcListingVote.count.mockResolvedValue(0)

      const result = await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'all',
        sortField: 'value',
        sortDirection: 'desc',
        includeNullified: false,
      })

      // true (1) should come before false (0) in descending
      expect(result.items[0].value).toBe(true)
      expect(result.items[1].value).toBe(false)
    })

    it('maps vote fields correctly', async () => {
      prisma.vote.count.mockResolvedValue(1)
      prisma.vote.findMany.mockResolvedValue([
        makeHandheldVoteRow({
          id: 'hv-1',
          value: true,
          listingId: 'listing-1',
          gameTitle: 'Mario',
          authorId: AUTHOR_A,
          authorName: 'Alice',
          createdAt: new Date('2025-06-01T12:00:00Z'),
        }),
      ])

      const result = await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 1,
        limit: 10,
        voteType: 'all',
        listingType: 'handheld',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      expect(result.items[0]).toEqual({
        id: 'hv-1',
        value: true,
        createdAt: new Date('2025-06-01T12:00:00Z'),
        nullifiedAt: null,
        type: 'handheld',
        listingId: 'listing-1',
        listingTitle: 'Mario',
        authorId: AUTHOR_A,
        authorName: 'Alice',
      })
    })

    it('paginates combined results correctly for page 2', async () => {
      const handheldVotes = Array.from({ length: 5 }, (_, i) =>
        makeHandheldVoteRow({
          id: `hv-${i}`,
          createdAt: new Date(`2025-06-${String(10 - i).padStart(2, '0')}`),
        }),
      )
      prisma.vote.count.mockResolvedValue(5)
      prisma.vote.findMany.mockResolvedValue(handheldVotes)
      prisma.pcListingVote.count.mockResolvedValue(0)

      const result = await getUserVotes(prisma as unknown as PrismaClient, {
        userId: USER_ID,
        page: 2,
        limit: 2,
        voteType: 'all',
        listingType: 'all',
        sortField: 'createdAt',
        sortDirection: 'desc',
        includeNullified: false,
      })

      // Page 2 with limit 2 should skip first 2 and return next 2
      expect(result.items).toHaveLength(2)
      expect(result.pagination.page).toBe(2)
    })
  })

  describe('getVotesOnAuthorListings', () => {
    it('groups votes by voter and counts up/down', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeAuthorVoteRow({ id: 'v-1', userId: 'voter-1', value: true }),
        makeAuthorVoteRow({ id: 'v-2', userId: 'voter-1', value: false }),
        makeAuthorVoteRow({ id: 'v-3', userId: 'voter-2', value: false }),
      ])

      const result = await getVotesOnAuthorListings(prisma as unknown as PrismaClient, {
        authorId: AUTHOR_A,
        page: 1,
        limit: 10,
      })

      expect(result.items).toHaveLength(2)

      const voter1 = result.items.find((v) => v.voterId === 'voter-1')
      expect(voter1).toBeDefined()
      expect(voter1!.totalVotes).toBe(2)
      expect(voter1!.upvotes).toBe(1)
      expect(voter1!.downvotes).toBe(1)

      const voter2 = result.items.find((v) => v.voterId === 'voter-2')
      expect(voter2).toBeDefined()
      expect(voter2!.totalVotes).toBe(1)
      expect(voter2!.downvotes).toBe(1)
    })

    it('sorts voters by most downvotes first', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeAuthorVoteRow({ id: 'v-1', userId: 'voter-a', userName: 'A', value: true }),
        makeAuthorVoteRow({ id: 'v-2', userId: 'voter-b', userName: 'B', value: false }),
        makeAuthorVoteRow({ id: 'v-3', userId: 'voter-b', userName: 'B', value: false }),
      ])

      const result = await getVotesOnAuthorListings(prisma as unknown as PrismaClient, {
        authorId: AUTHOR_A,
        page: 1,
        limit: 10,
      })

      // voter-b has 2 downvotes, voter-a has 0 downvotes
      expect(result.items[0].voterId).toBe('voter-b')
      expect(result.items[1].voterId).toBe('voter-a')
    })

    it('paginates voter results', async () => {
      const votes = Array.from({ length: 5 }, (_, i) =>
        makeAuthorVoteRow({
          id: `v-${i}`,
          userId: `voter-${i}`,
          userName: `Voter ${i}`,
          value: false,
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await getVotesOnAuthorListings(prisma as unknown as PrismaClient, {
        authorId: AUTHOR_A,
        page: 1,
        limit: 2,
      })

      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(5)
      expect(result.pagination.pages).toBe(3)
    })

    it('filters by specific voter when voterId provided', async () => {
      prisma.vote.findMany.mockResolvedValue([makeAuthorVoteRow({ id: 'v-1', userId: 'voter-1' })])

      await getVotesOnAuthorListings(prisma as unknown as PrismaClient, {
        authorId: AUTHOR_A,
        voterId: 'voter-1',
        page: 1,
        limit: 10,
      })

      expect(prisma.vote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'voter-1' }),
        }),
      )
    })

    it('combines handheld and PC votes for the same voter', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makeAuthorVoteRow({ id: 'v-1', userId: 'voter-1', value: true, gameTitle: 'Mario' }),
      ])
      prisma.pcListingVote.findMany.mockResolvedValue([
        makePcAuthorVoteRow({ id: 'pv-1', userId: 'voter-1', value: false, gameTitle: 'Doom' }),
      ])

      const result = await getVotesOnAuthorListings(prisma as unknown as PrismaClient, {
        authorId: AUTHOR_A,
        page: 1,
        limit: 10,
      })

      expect(result.items).toHaveLength(1)
      const voter = result.items[0]
      expect(voter.totalVotes).toBe(2)
      expect(voter.upvotes).toBe(1)
      expect(voter.downvotes).toBe(1)
      expect(voter.votes).toHaveLength(2)
      expect(voter.votes.map((v) => v.type)).toEqual(expect.arrayContaining(['handheld', 'pc']))
    })

    it('returns empty when no votes exist on author listings', async () => {
      const result = await getVotesOnAuthorListings(prisma as unknown as PrismaClient, {
        authorId: AUTHOR_A,
        page: 1,
        limit: 10,
      })

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('analyzeVotePatterns', () => {
    it('returns correct summary statistics', async () => {
      const now = new Date()
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: true, createdAt: twelveHoursAgo }),
        makePatternVoteRow({ value: true, createdAt: threeDaysAgo }),
        makePatternVoteRow({ value: false, createdAt: twelveHoursAgo }),
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      expect(result.summary.totalVotes).toBe(3)
      expect(result.summary.upvotes).toBe(2)
      expect(result.summary.downvotes).toBe(1)
      expect(result.summary.downvotePercentage).toBeCloseTo(33.33, 0)
      expect(result.summary.votesLast24h).toBe(2) // 2 from 12h ago
      expect(result.summary.votesLast7d).toBe(3) // all 3 within 7 days
    })

    it('returns empty analysis for user with no votes', async () => {
      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      expect(result.summary.totalVotes).toBe(0)
      expect(result.summary.upvotes).toBe(0)
      expect(result.summary.downvotes).toBe(0)
      expect(result.summary.downvotePercentage).toBe(0)
      expect(result.summary.averageVotesPerDay).toBe(0)
      expect(result.flags).toHaveLength(0)
      expect(result.targetedAuthors).toHaveLength(0)
    })

    it('detects RAPID_VOTING when >10 votes in 5-minute window', async () => {
      const baseTime = new Date('2025-06-01T12:00:00Z')
      const votes = Array.from({ length: 12 }, (_, i) =>
        makePatternVoteRow({
          value: true,
          createdAt: new Date(baseTime.getTime() + i * 20_000), // 20 seconds apart
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const rapidFlag = result.flags.find((f) => f.type === 'RAPID_VOTING')
      expect(rapidFlag).toBeDefined()
      expect(rapidFlag!.severity).toBe('medium')
      expect(rapidFlag!.description).toContain('12 votes')
    })

    it('detects RAPID_VOTING with high severity when >20 votes in window', async () => {
      const baseTime = new Date('2025-06-01T12:00:00Z')
      const votes = Array.from({ length: 25 }, (_, i) =>
        makePatternVoteRow({
          value: true,
          createdAt: new Date(baseTime.getTime() + i * 10_000), // 10 seconds apart
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const rapidFlag = result.flags.find((f) => f.type === 'RAPID_VOTING')
      expect(rapidFlag).toBeDefined()
      expect(rapidFlag!.severity).toBe('high')
    })

    it('does NOT flag RAPID_VOTING when votes are spread out', async () => {
      const baseTime = new Date('2025-06-01T12:00:00Z')
      const votes = Array.from({ length: 12 }, (_, i) =>
        makePatternVoteRow({
          value: true,
          createdAt: new Date(baseTime.getTime() + i * 60 * 60_000), // 1 hour apart
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const rapidFlag = result.flags.find((f) => f.type === 'RAPID_VOTING')
      expect(rapidFlag).toBeUndefined()
    })

    it('detects SINGLE_AUTHOR_TARGETING when >50% downvotes target one author', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: false, authorId: AUTHOR_A, authorName: 'Target Author' }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_A, authorName: 'Target Author' }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_B, authorName: 'Other' }),
        makePatternVoteRow({ value: true, authorId: AUTHOR_A, authorName: 'Target Author' }),
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const targetFlag = result.flags.find((f) => f.type === 'SINGLE_AUTHOR_TARGETING')
      expect(targetFlag).toBeDefined()
      expect(targetFlag!.severity).toBe('medium')
      expect(targetFlag!.description).toContain('Target Author')
    })

    it('detects SINGLE_AUTHOR_TARGETING with high severity when >80%', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_B }),
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const targetFlag = result.flags.find((f) => f.type === 'SINGLE_AUTHOR_TARGETING')
      expect(targetFlag).toBeDefined()
      expect(targetFlag!.severity).toBe('high')
    })

    it('does NOT flag SINGLE_AUTHOR_TARGETING with 2 or fewer downvotes', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const targetFlag = result.flags.find((f) => f.type === 'SINGLE_AUTHOR_TARGETING')
      expect(targetFlag).toBeUndefined()
    })

    it('detects ALL_DOWNVOTES when >90% downvotes with >5 total', async () => {
      const votes = [
        ...Array.from({ length: 6 }, () => makePatternVoteRow({ value: false })),
        makePatternVoteRow({ value: true }),
      ]
      // 6/7 = 85.7% - not enough
      prisma.vote.findMany.mockResolvedValue(votes)
      let result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)
      expect(result.flags.find((f) => f.type === 'ALL_DOWNVOTES')).toBeUndefined()

      // 10/11 = 90.9% - should trigger
      const votes2 = [
        ...Array.from({ length: 10 }, () => makePatternVoteRow({ value: false })),
        makePatternVoteRow({ value: true }),
      ]
      prisma.vote.findMany.mockResolvedValue(votes2)
      result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)
      const allDownFlag = result.flags.find((f) => f.type === 'ALL_DOWNVOTES')
      expect(allDownFlag).toBeDefined()
      expect(allDownFlag!.severity).toBe('medium')
    })

    it('detects ALL_DOWNVOTES with high severity when >95%', async () => {
      const votes = [
        ...Array.from({ length: 20 }, () => makePatternVoteRow({ value: false })),
        makePatternVoteRow({ value: true }),
      ]
      // 20/21 = 95.2% - high severity
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const allDownFlag = result.flags.find((f) => f.type === 'ALL_DOWNVOTES')
      expect(allDownFlag).toBeDefined()
      expect(allDownFlag!.severity).toBe('high')
    })

    it('does NOT flag ALL_DOWNVOTES with 5 or fewer total votes', async () => {
      const votes = Array.from({ length: 5 }, () => makePatternVoteRow({ value: false }))
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      expect(result.flags.find((f) => f.type === 'ALL_DOWNVOTES')).toBeUndefined()
    })

    it('detects HIGH_VOLUME when >30 votes in 24 hours', async () => {
      const votes = Array.from({ length: 35 }, (_, i) =>
        makePatternVoteRow({
          value: true,
          createdAt: makeDate(i * 10), // spread over ~6 hours
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const volumeFlag = result.flags.find((f) => f.type === 'HIGH_VOLUME')
      expect(volumeFlag).toBeDefined()
      expect(volumeFlag!.severity).toBe('medium')
      expect(volumeFlag!.description).toContain('35 votes')
    })

    it('detects HIGH_VOLUME with high severity when >50 in 24h', async () => {
      const votes = Array.from({ length: 55 }, (_, i) =>
        makePatternVoteRow({
          value: true,
          createdAt: makeDate(i * 5), // spread over ~4.5 hours
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const volumeFlag = result.flags.find((f) => f.type === 'HIGH_VOLUME')
      expect(volumeFlag).toBeDefined()
      expect(volumeFlag!.severity).toBe('high')
    })

    it('returns targeted authors sorted by downvotes, capped at 20', async () => {
      const votes = Array.from({ length: 25 }, (_, i) =>
        makePatternVoteRow({
          value: false,
          authorId: `author-${i}`,
          authorName: `Author ${i}`,
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      expect(result.targetedAuthors).toHaveLength(20)
    })

    it('calculates concentration percentage for targeted authors', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: true, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: true, authorId: AUTHOR_A }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_B }),
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const authorA = result.targetedAuthors.find((a) => a.authorId === AUTHOR_A)
      expect(authorA).toBeDefined()
      // 2/3 of total votes = 66.67%
      expect(authorA!.concentration).toBeCloseTo(66.67, 0)
    })

    it('combines handheld and PC votes for analysis', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: true, authorId: AUTHOR_A }),
      ])
      prisma.pcListingVote.findMany.mockResolvedValue([
        {
          ...makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
          pcListing: {
            authorId: AUTHOR_A,
            author: { name: 'Author A' },
          },
        },
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      expect(result.summary.totalVotes).toBe(2)
      expect(result.summary.upvotes).toBe(1)
      expect(result.summary.downvotes).toBe(1)
    })

    it('handles votes with null authorId', async () => {
      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: true, authorId: null, authorName: null }),
        makePatternVoteRow({ value: false, authorId: AUTHOR_A }),
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      expect(result.summary.totalVotes).toBe(2)
      // Null authorId votes shouldn't appear in targeted authors
      expect(result.targetedAuthors.every((a) => a.authorId !== null)).toBe(true)
    })

    it('calculates averageVotesPerDay correctly', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      prisma.vote.findMany.mockResolvedValue([
        makePatternVoteRow({ value: true, createdAt: twoDaysAgo }),
        makePatternVoteRow({ value: true, createdAt: new Date() }),
      ])

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      // 2 votes over ~2 days = ~1 vote/day
      expect(result.summary.averageVotesPerDay).toBeGreaterThan(0.5)
      expect(result.summary.averageVotesPerDay).toBeLessThan(2)
    })

    it('can trigger multiple flags simultaneously', async () => {
      // 55 votes all within 5 minutes, all downvotes, all targeting one author
      const baseTime = new Date()
      const recentTime = new Date(baseTime.getTime() - 60_000)
      const votes = Array.from({ length: 55 }, (_, i) =>
        makePatternVoteRow({
          value: false,
          authorId: AUTHOR_A,
          createdAt: new Date(recentTime.getTime() + i * 5_000), // 5 seconds apart, all within last minute
        }),
      )
      prisma.vote.findMany.mockResolvedValue(votes)

      const result = await analyzeVotePatterns(prisma as unknown as PrismaClient, USER_ID)

      const flagTypes = result.flags.map((f) => f.type)
      expect(flagTypes).toContain('RAPID_VOTING')
      expect(flagTypes).toContain('SINGLE_AUTHOR_TARGETING')
      expect(flagTypes).toContain('ALL_DOWNVOTES')
      expect(flagTypes).toContain('HIGH_VOLUME')
    })
  })
})
