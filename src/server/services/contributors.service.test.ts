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
      total: 5,
      lastContributionAt: dateB,
    })
  })

  it('returns top contributors sorted by total contributions and recency', async () => {
    const recent = new Date('2025-02-01T00:00:00Z')
    const older = new Date('2025-01-01T00:00:00Z')

    prisma.listing.groupBy.mockResolvedValue([
      { authorId: 'user-1', _count: { _all: 1 }, _max: { createdAt: older } },
      { authorId: 'user-2', _count: { _all: 1 }, _max: { createdAt: recent } },
    ])
    prisma.pcListing.groupBy.mockResolvedValue([
      { authorId: 'user-1', _count: { _all: 1 }, _max: { createdAt: older } },
    ])
    prisma.game.groupBy.mockResolvedValue([
      {
        submittedBy: 'user-2',
        _count: { _all: 1 },
        _max: { approvedAt: recent, submittedAt: recent },
      },
    ])

    const top = await getTopContributorsRaw(prisma, 'all_time', 2)

    expect(top).toHaveLength(2)
    expect(top[0]?.userId).toBe('user-2')
    expect(top[1]?.userId).toBe('user-1')
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
})
