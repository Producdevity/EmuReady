import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type Prisma } from '@orm'
import { updateListingVoteCounts, updatePcListingVoteCounts } from './vote-counts'
import { calculateWilsonScore } from './wilson-score'

type MockPrismaClient = {
  listing: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  pcListing?: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

describe('vote-counts', () => {
  describe('updateListingVoteCounts', () => {
    let mockFindUnique: ReturnType<typeof vi.fn>
    let mockUpdate: ReturnType<typeof vi.fn>
    let prisma: MockPrismaClient

    beforeEach(() => {
      mockFindUnique = vi.fn()
      mockUpdate = vi.fn()
      prisma = {
        listing: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      }
    })

    describe('create operation', () => {
      it('should increment upvoteCount and voteCount for upvote', async () => {
        const listingId = 'test-listing-id'

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 0, downvoteCount: 0 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'create',
          true,
        )

        expect(mockFindUnique).toHaveBeenCalledWith({
          where: { id: listingId },
          select: { upvoteCount: true, downvoteCount: true },
        })
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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 0, downvoteCount: 0 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'create',
          false,
        )

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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 5, downvoteCount: 1 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'delete',
          undefined,
          true,
        )

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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 3, downvoteCount: 3 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'delete',
          undefined,
          false,
        )

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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 3, downvoteCount: 2 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'update',
          false,
          true,
        )

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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 2, downvoteCount: 3 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'update',
          true,
          false,
        )

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

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'update',
          true,
          true,
        )

        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should throw error for invalid operation', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(
            prisma as unknown as Prisma.TransactionClient,
            listingId,
            'invalid' as 'create',
            true,
          ),
        ).rejects.toThrow('Invalid operation: invalid')
      })

      it('should throw error for create without value', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(
            prisma as unknown as Prisma.TransactionClient,
            listingId,
            'create',
            undefined,
          ),
        ).rejects.toThrow('Create operation requires a value')
      })

      it('should throw error for delete without oldValue', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(
            prisma as unknown as Prisma.TransactionClient,
            listingId,
            'delete',
            undefined,
            undefined,
          ),
        ).rejects.toThrow('Delete operation requires oldValue')
      })

      it('should throw error for update without both values', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(
            prisma as unknown as Prisma.TransactionClient,
            listingId,
            'update',
            true,
            undefined,
          ),
        ).rejects.toThrow('Update operation requires both newValue and oldValue')
      })
    })

    describe('Wilson Score specific cases', () => {
      it('should calculate ~0.965 for 2 upvotes, 0 downvotes', async () => {
        const listingId = 'test-2-upvotes'

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 1, downvoteCount: 0 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'create',
          true,
        )

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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 0, downvoteCount: 0 })

        await updateListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          listingId,
          'delete',
          undefined,
          true,
        )

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
    let mockFindUnique: ReturnType<typeof vi.fn>
    let mockUpdate: ReturnType<typeof vi.fn>
    let prisma: MockPrismaClient

    beforeEach(() => {
      mockFindUnique = vi.fn()
      mockUpdate = vi.fn()
      prisma = {
        listing: {} as never, // Required by type but not used in pcListing tests
        pcListing: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      }
    })

    describe('create operation', () => {
      it('should increment upvoteCount and voteCount for upvote on PC listing', async () => {
        const pcListingId = 'test-pc-listing-id'

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 2, downvoteCount: 1 })

        await updatePcListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          pcListingId,
          'create',
          true,
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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 4, downvoteCount: 4 })

        await updatePcListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          pcListingId,
          'update',
          true,
          false,
        )

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

        mockFindUnique.mockResolvedValueOnce({ upvoteCount: 10, downvoteCount: 3 })

        await updatePcListingVoteCounts(
          prisma as unknown as Prisma.TransactionClient,
          pcListingId,
          'delete',
          undefined,
          false,
        )

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
