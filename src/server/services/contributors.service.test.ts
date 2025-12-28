import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  aggregateContributions,
  getTopContributorsRaw,
  getUserContributionBreakdown,
} from './contributors.service'
import type { PrismaClient } from '@orm'

const createMockPrisma = () => ({
  listing: {
    groupBy: vi.fn(),
  },
  pcListing: {
    groupBy: vi.fn(),
  },
  game: {
    groupBy: vi.fn(),
  },
  $queryRawTyped: vi.fn(),
})

describe('contributors.service', () => {
  let prisma: ReturnType<typeof createMockPrisma> & PrismaClient

  beforeEach(() => {
    prisma = createMockPrisma() as unknown as typeof prisma & PrismaClient
  })

  it('aggregates contributions across listings, pc listings, and games', async () => {
    const dateA = new Date('2025-01-01T00:00:00Z')
    const dateB = new Date('2025-01-02T00:00:00Z')

    prisma.listing.groupBy.mockResolvedValue([
      { authorId: 'user-1', _count: { _all: 3 }, _max: { createdAt: dateA } },
    ])
    prisma.pcListing.groupBy.mockResolvedValue([
      { authorId: 'user-1', _count: { _all: 2 }, _max: { createdAt: dateB } },
      { authorId: 'user-2', _count: { _all: 4 }, _max: { createdAt: dateA } },
    ])
    prisma.game.groupBy.mockResolvedValue([
      {
        submittedBy: 'user-2',
        _count: { _all: 1 },
        _max: { approvedAt: dateB, submittedAt: dateA },
      },
    ])

    const result = await aggregateContributions(prisma)

    expect(result['user-1']).toEqual({
      listings: 3,
      pcListings: 2,
      games: 0,
      total: 5,
      lastContributionAt: dateB,
    })

    expect(result['user-2']).toEqual({
      listings: 0,
      pcListings: 4,
      games: 1,
      total: 4,
      lastContributionAt: dateB,
    })
  })

  it('returns top contributors sorted by total contributions and recency', async () => {
    const recent = new Date('2025-02-01T00:00:00Z')

    // Mock the TypedSQL query result (values are numbers due to ::int cast in SQL)
    prisma.$queryRawTyped.mockResolvedValue([
      {
        userId: 'user-1',
        listings: 2,
        pcListings: 0,
        games: 0,
        total: 2,
        lastContributionAt: recent,
      },
      {
        userId: 'user-2',
        listings: 1,
        pcListings: 0,
        games: 1,
        total: 1,
        lastContributionAt: recent,
      },
    ])

    const top = await getTopContributorsRaw(prisma, 'all_time', 2)

    expect(top).toHaveLength(2)
    expect(top[0]?.userId).toBe('user-1')
    expect(top[0]?.breakdown.total).toBe(2)
    expect(top[1]?.userId).toBe('user-2')
    expect(top[1]?.breakdown.total).toBe(1)
  })

  it('returns zeroed contribution breakdown when user has no records', async () => {
    prisma.listing.groupBy.mockResolvedValue([])
    prisma.pcListing.groupBy.mockResolvedValue([])
    prisma.game.groupBy.mockResolvedValue([])

    const breakdown = await getUserContributionBreakdown(prisma, 'user-3')

    expect(breakdown).toEqual({
      listings: 0,
      pcListings: 0,
      games: 0,
      total: 0,
      lastContributionAt: null,
    })
  })

  it('returns empty array when no contributors exist', async () => {
    prisma.$queryRawTyped.mockResolvedValue([])

    const top = await getTopContributorsRaw(prisma, 'all_time', 10)

    expect(top).toHaveLength(0)
    expect(top).toEqual([])
  })

  it('applies date filter for this_month timeframe', async () => {
    const recent = new Date('2025-02-01T00:00:00Z')

    prisma.$queryRawTyped.mockResolvedValue([
      {
        userId: 'user-1',
        listings: 5,
        pcListings: 3,
        games: 2,
        total: 8,
        lastContributionAt: recent,
      },
    ])

    const top = await getTopContributorsRaw(prisma, 'this_month', 5)

    expect(top).toHaveLength(1)
    expect(top[0]?.userId).toBe('user-1')
    expect(top[0]?.breakdown.total).toBe(8)
    expect(prisma.$queryRawTyped).toHaveBeenCalled()
  })

  it('applies date filter for this_week timeframe', async () => {
    const recent = new Date('2025-02-01T00:00:00Z')

    prisma.$queryRawTyped.mockResolvedValue([
      {
        userId: 'user-1',
        listings: 2,
        pcListings: 1,
        games: 0,
        total: 3,
        lastContributionAt: recent,
      },
    ])

    const top = await getTopContributorsRaw(prisma, 'this_week', 3)

    expect(top).toHaveLength(1)
    expect(top[0]?.userId).toBe('user-1')
    expect(top[0]?.breakdown.total).toBe(3)
    expect(prisma.$queryRawTyped).toHaveBeenCalled()
  })

  it('returns correct number types from TypedSQL', async () => {
    prisma.$queryRawTyped.mockResolvedValue([
      {
        userId: 'user-1',
        listings: 100,
        pcListings: 50,
        games: 25,
        total: 150,
        lastContributionAt: new Date('2025-01-15T00:00:00Z'),
      },
    ])

    const top = await getTopContributorsRaw(prisma, 'all_time', 1)

    expect(top[0]?.breakdown.listings).toBe(100)
    expect(top[0]?.breakdown.pcListings).toBe(50)
    expect(top[0]?.breakdown.games).toBe(25)
    expect(top[0]?.breakdown.total).toBe(150)
    expect(typeof top[0]?.breakdown.listings).toBe('number')
    expect(typeof top[0]?.breakdown.total).toBe('number')
  })

  it('handles null lastContributionAt in results', async () => {
    prisma.$queryRawTyped.mockResolvedValue([
      {
        userId: 'user-1',
        listings: 1,
        pcListings: 0,
        games: 0,
        total: 1,
        lastContributionAt: null,
      },
    ])

    const top = await getTopContributorsRaw(prisma, 'all_time', 1)

    expect(top[0]?.breakdown.lastContributionAt).toBeNull()
  })
})
