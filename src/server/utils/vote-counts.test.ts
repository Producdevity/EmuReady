import { PrismaPg } from '@prisma/adapter-pg'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { PrismaClient } from '@orm/client'
import { updateListingVoteCounts, updatePcListingVoteCounts } from './vote-counts'
import type * as OrmClient from '@orm/client'

vi.mock('@orm/client', async () => {
  const actual = await vi.importActual<typeof OrmClient>('@orm/client')
  return {
    ...actual,
    PrismaClient: vi.fn().mockImplementation(function MockPrismaClient() {
      return {
        $queryRaw: vi.fn(),
        listing: { update: vi.fn() },
        pcListing: { update: vi.fn() },
      }
    }),
  }
})

function createMockPrisma() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: 'postgresql://test:test@localhost:5432/test' }),
  })
}

describe('vote-counts', () => {
  describe('updateListingVoteCounts', () => {
    let mockQueryRaw: ReturnType<typeof vi.fn>
    let mockUpdate: ReturnType<typeof vi.fn>
    let prisma: PrismaClient

    beforeEach(() => {
      prisma = createMockPrisma()
      mockQueryRaw = vi.mocked(prisma.$queryRaw)
      mockUpdate = vi.mocked(prisma.listing.update)
    })

    describe('create operation', () => {
      it('should increment upvoteCount and voteCount for upvote', async () => {
        const listingId = 'test-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 0, downvoteCount: 0 }])

        await updateListingVoteCounts(prisma, listingId, 'create', true)

        expect(mockQueryRaw).toHaveBeenCalledTimes(1)
        expect(mockQueryRaw).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringMatching(/FROM "Listing"\s+WHERE "id" = \$1 FOR NO KEY UPDATE/),
            values: [listingId],
          }),
        )
        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: 1 },
            successRate: calculateWilsonScore(1, 0),
          },
        })
        const expectedScore = calculateWilsonScore(1, 0)
        expect(expectedScore).toBeCloseTo(0.95, 1) // 1 upvote gives ~95% Wilson Score
      })

      it('should increment downvoteCount and voteCount for downvote', async () => {
        const listingId = 'test-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 0, downvoteCount: 0 }])

        await updateListingVoteCounts(prisma, listingId, 'create', false)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 0 },
            downvoteCount: { increment: 1 },
            voteCount: { increment: 1 },
            successRate: calculateWilsonScore(0, 1),
          },
        })
        const expectedScore = calculateWilsonScore(0, 1)
        expect(expectedScore).toBeCloseTo(0.05, 1) // 1 downvote gives ~5% Wilson Score
      })
    })

    describe('delete operation', () => {
      it('should decrement upvoteCount and voteCount when deleting upvote', async () => {
        const listingId = 'test-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 5, downvoteCount: 1 }])

        await updateListingVoteCounts(prisma, listingId, 'delete', undefined, true)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: -1 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: -1 },
            successRate: calculateWilsonScore(4, 1),
          },
        })
        const expectedScore = calculateWilsonScore(4, 1)
        expect(expectedScore).toBeCloseTo(0.715, 2)
      })

      it('should decrement downvoteCount and voteCount when deleting downvote', async () => {
        const listingId = 'test-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 3, downvoteCount: 3 }])

        await updateListingVoteCounts(prisma, listingId, 'delete', undefined, false)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 0 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: -1 },
            successRate: calculateWilsonScore(3, 2),
          },
        })
        const expectedScore = calculateWilsonScore(3, 2)
        expect(expectedScore).toBeCloseTo(0.511, 3)
      })
    })

    describe('update operation', () => {
      it('should change from upvote to downvote correctly', async () => {
        const listingId = 'test-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 3, downvoteCount: 2 }])

        await updateListingVoteCounts(prisma, listingId, 'update', false, true)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: -1 },
            downvoteCount: { increment: 1 },
            voteCount: { increment: 0 },
            successRate: calculateWilsonScore(2, 3),
          },
        })
        const expectedScore = calculateWilsonScore(2, 3)
        expect(expectedScore).toBeCloseTo(0.321, 3)
      })

      it('should change from downvote to upvote correctly', async () => {
        const listingId = 'test-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 2, downvoteCount: 3 }])

        await updateListingVoteCounts(prisma, listingId, 'update', true, false)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: 0 },
            successRate: calculateWilsonScore(3, 2),
          },
        })
        const expectedScore = calculateWilsonScore(3, 2)
        expect(expectedScore).toBeCloseTo(0.511, 3)
      })

      it('should skip update when vote value does not change', async () => {
        const listingId = 'test-listing-id'

        await updateListingVoteCounts(prisma, listingId, 'update', true, true)

        expect(mockQueryRaw).not.toHaveBeenCalled()
        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('does not update when the locking read fails', async () => {
        const conflict = new Error('Locking read failed')
        mockQueryRaw.mockRejectedValueOnce(conflict)

        await expect(updateListingVoteCounts(prisma, 'missing', 'create', true)).rejects.toBe(
          conflict,
        )
        expect(mockUpdate).not.toHaveBeenCalled()
      })

      it('does not update a report missing from the locking read', async () => {
        mockQueryRaw.mockResolvedValueOnce([])

        await expect(updateListingVoteCounts(prisma, 'missing', 'create', true)).rejects.toThrow(
          'Entity missing not found',
        )
        expect(mockUpdate).not.toHaveBeenCalled()
      })

      it('should throw error for invalid operation', async () => {
        const listingId = 'test-listing-id'

        await expect(
          Reflect.apply(updateListingVoteCounts, undefined, [prisma, listingId, 'invalid', true]),
        ).rejects.toThrow('Invalid operation: invalid')
      })

      it('should throw error for create without value', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(prisma, listingId, 'create', undefined),
        ).rejects.toThrow('Create operation requires a value')
      })

      it('should throw error for delete without oldValue', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(prisma, listingId, 'delete', undefined, undefined),
        ).rejects.toThrow('Delete operation requires oldValue')
      })

      it('should throw error for update without both values', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(prisma, listingId, 'update', true, undefined),
        ).rejects.toThrow('Update operation requires both newValue and oldValue')
      })
    })

    describe('Wilson Score specific cases', () => {
      it('should calculate ~0.965 for 2 upvotes, 0 downvotes', async () => {
        const listingId = 'test-2-upvotes'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 1, downvoteCount: 0 }])

        await updateListingVoteCounts(prisma, listingId, 'create', true)

        const expectedScore = calculateWilsonScore(2, 0)
        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: 1 },
            successRate: expectedScore,
          },
        })
        expect(expectedScore).toBeCloseTo(0.965, 2)
      })

      it('should calculate 0.5 for no votes', async () => {
        const listingId = 'test-no-votes'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 0, downvoteCount: 0 }])

        await updateListingVoteCounts(prisma, listingId, 'delete', undefined, true)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 0 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: 0 },
            successRate: 0.5,
          },
        })
      })
    })
  })

  describe('updatePcListingVoteCounts', () => {
    let mockQueryRaw: ReturnType<typeof vi.fn>
    let mockUpdate: ReturnType<typeof vi.fn>
    let prisma: PrismaClient

    beforeEach(() => {
      prisma = createMockPrisma()
      mockQueryRaw = vi.mocked(prisma.$queryRaw)
      mockUpdate = vi.mocked(prisma.pcListing.update)
    })

    describe('create operation', () => {
      it('should increment upvoteCount and voteCount for upvote on PC listing', async () => {
        const pcListingId = 'test-pc-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 2, downvoteCount: 1 }])

        await updatePcListingVoteCounts(prisma, pcListingId, 'create', true)

        expect(mockQueryRaw).toHaveBeenCalledTimes(1)
        expect(mockQueryRaw).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringMatching(/FROM "pc_listings"\s+WHERE "id" = \$1 FOR NO KEY UPDATE/),
            values: [pcListingId],
          }),
        )
        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: pcListingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: 1 },
            successRate: calculateWilsonScore(3, 1),
          },
        })

        const expectedScore = calculateWilsonScore(3, 1)
        expect(expectedScore).toBeCloseTo(0.645, 3)
      })
    })

    describe('update operation', () => {
      it('should switch vote correctly on PC listing', async () => {
        const pcListingId = 'test-pc-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 4, downvoteCount: 4 }])

        await updatePcListingVoteCounts(prisma, pcListingId, 'update', true, false)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: pcListingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: 0 },
            successRate: calculateWilsonScore(5, 3),
          },
        })
      })
    })

    describe('delete operation', () => {
      it('should decrement counts when deleting vote from PC listing', async () => {
        const pcListingId = 'test-pc-listing-id'

        mockQueryRaw.mockResolvedValueOnce([{ upvoteCount: 10, downvoteCount: 3 }])

        await updatePcListingVoteCounts(prisma, pcListingId, 'delete', undefined, false)

        expect(mockUpdate).toHaveBeenCalledTimes(1)
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: pcListingId },
          data: {
            upvoteCount: { increment: 0 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: -1 },
            successRate: calculateWilsonScore(10, 2),
          },
        })

        const expectedScore = calculateWilsonScore(10, 2)
        expect(expectedScore).toBeCloseTo(0.79, 2)
      })
    })
  })
})
