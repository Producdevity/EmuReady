import { describe, it, expect, beforeEach, vi } from 'vitest'
import { updateListingVoteCounts, updatePcListingVoteCounts } from './vote-counts'
import { calculateWilsonScore } from './wilson-score'

describe('vote-counts', () => {
  describe('updateListingVoteCounts', () => {
    let mockUpdate: any
    let prisma: any

    beforeEach(() => {
      mockUpdate = vi.fn()
      prisma = {
        listing: {
          update: mockUpdate,
        },
      }
    })

    describe('create operation', () => {
      it('should increment upvoteCount and voteCount for upvote', async () => {
        const listingId = 'test-listing-id'

        // First call returns updated counts
        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 1,
          downvoteCount: 0,
          voteCount: 1,
          successRate: 0, // old value
        })
        // Second call updates Wilson score
        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 1,
          downvoteCount: 0,
          voteCount: 1,
          successRate: calculateWilsonScore(1, 0),
        })

        await updateListingVoteCounts(prisma, listingId, 'create', true)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        // First call: update counts
        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: 1 },
          },
        })

        // Second call: update Wilson score
        const expectedScore = calculateWilsonScore(1, 0)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: expectedScore },
        })
        expect(expectedScore).toBeCloseTo(0.95, 1) // 1 upvote gives ~95% Wilson Score
      })

      it('should increment downvoteCount and voteCount for downvote', async () => {
        const listingId = 'test-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 0,
          downvoteCount: 1,
          voteCount: 1,
          successRate: 0,
        })
        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 0,
          downvoteCount: 1,
          voteCount: 1,
          successRate: 0,
        })

        await updateListingVoteCounts(prisma, listingId, 'create', false)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 0 },
            downvoteCount: { increment: 1 },
            voteCount: { increment: 1 },
          },
        })

        const expectedScore = calculateWilsonScore(0, 1)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: expectedScore },
        })
        expect(expectedScore).toBeCloseTo(0.05, 1) // 1 downvote gives ~5% Wilson Score
      })
    })

    describe('delete operation', () => {
      it('should decrement upvoteCount and voteCount when deleting upvote', async () => {
        const listingId = 'test-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 4,
          downvoteCount: 1,
          voteCount: 5,
          successRate: 0.8,
        })
        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 4,
          downvoteCount: 1,
          voteCount: 5,
          successRate: 0.8,
        })

        await updateListingVoteCounts(prisma, listingId, 'delete', undefined, true)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: listingId },
          data: {
            upvoteCount: { increment: -1 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: -1 },
          },
        })

        const expectedScore = calculateWilsonScore(4, 1)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: expectedScore },
        })
      })

      it('should decrement downvoteCount and voteCount when deleting downvote', async () => {
        const listingId = 'test-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 3,
          downvoteCount: 2,
          voteCount: 5,
          successRate: 0.6,
        })
        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 3,
          downvoteCount: 2,
          voteCount: 5,
          successRate: 0.6,
        })

        await updateListingVoteCounts(prisma, listingId, 'delete', undefined, false)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 0 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: -1 },
          },
        })

        const expectedScore = calculateWilsonScore(3, 2)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: expectedScore },
        })
      })
    })

    describe('update operation', () => {
      it('should change from upvote to downvote correctly', async () => {
        const listingId = 'test-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 2,
          downvoteCount: 3,
          voteCount: 5,
          successRate: 0.4,
        })
        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 2,
          downvoteCount: 3,
          voteCount: 5,
          successRate: 0.4,
        })

        await updateListingVoteCounts(prisma, listingId, 'update', false, true)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: listingId },
          data: {
            upvoteCount: { increment: -1 },
            downvoteCount: { increment: 1 },
            voteCount: { increment: 0 },
          },
        })

        const expectedScore = calculateWilsonScore(2, 3)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: expectedScore },
        })
      })

      it('should change from downvote to upvote correctly', async () => {
        const listingId = 'test-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 3,
          downvoteCount: 2,
          voteCount: 5,
          successRate: 0.6,
        })
        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 3,
          downvoteCount: 2,
          voteCount: 5,
          successRate: 0.6,
        })

        await updateListingVoteCounts(prisma, listingId, 'update', true, false)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: listingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: 0 },
          },
        })

        const expectedScore = calculateWilsonScore(3, 2)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: expectedScore },
        })
      })

      it('should skip update when vote value does not change', async () => {
        const listingId = 'test-listing-id'

        await updateListingVoteCounts(prisma, listingId, 'update', true, true)

        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should throw error for invalid operation', async () => {
        const listingId = 'test-listing-id'

        await expect(
          updateListingVoteCounts(prisma, listingId, 'invalid' as any, true),
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

        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 2,
          downvoteCount: 0,
          voteCount: 2,
          successRate: 0,
        })

        await updateListingVoteCounts(prisma, listingId, 'create', true)

        const expectedScore = calculateWilsonScore(2, 0)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: expectedScore },
        })
        expect(expectedScore).toBeCloseTo(0.965, 2)
      })

      it('should calculate 0.5 for no votes', async () => {
        const listingId = 'test-no-votes'

        mockUpdate.mockResolvedValueOnce({
          id: listingId,
          upvoteCount: 0,
          downvoteCount: 0,
          voteCount: 0,
          successRate: 0,
        })

        await updateListingVoteCounts(prisma, listingId, 'delete', undefined, true)

        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: listingId },
          data: { successRate: 0.5 },
        })
      })
    })
  })

  describe('updatePcListingVoteCounts', () => {
    let mockUpdate: any
    let prisma: any

    beforeEach(() => {
      mockUpdate = vi.fn()
      prisma = {
        pcListing: {
          update: mockUpdate,
        },
      }
    })

    describe('create operation', () => {
      it('should increment upvoteCount and voteCount for upvote on PC listing', async () => {
        const pcListingId = 'test-pc-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: pcListingId,
          upvoteCount: 3,
          downvoteCount: 1,
          voteCount: 4,
          successRate: 0,
        })

        await updatePcListingVoteCounts(prisma, pcListingId, 'create', true)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: pcListingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: 0 },
            voteCount: { increment: 1 },
          },
        })

        const expectedScore = calculateWilsonScore(3, 1)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: pcListingId },
          data: { successRate: expectedScore },
        })
      })
    })

    describe('update operation', () => {
      it('should switch vote correctly on PC listing', async () => {
        const pcListingId = 'test-pc-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: pcListingId,
          upvoteCount: 5,
          downvoteCount: 3,
          voteCount: 8,
          successRate: 0,
        })

        await updatePcListingVoteCounts(prisma, pcListingId, 'update', true, false)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: pcListingId },
          data: {
            upvoteCount: { increment: 1 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: 0 },
          },
        })
      })
    })

    describe('delete operation', () => {
      it('should decrement counts when deleting vote from PC listing', async () => {
        const pcListingId = 'test-pc-listing-id'

        mockUpdate.mockResolvedValueOnce({
          id: pcListingId,
          upvoteCount: 10,
          downvoteCount: 2,
          voteCount: 12,
          successRate: 0,
        })

        await updatePcListingVoteCounts(prisma, pcListingId, 'delete', undefined, false)

        expect(mockUpdate).toHaveBeenCalledTimes(2)

        expect(mockUpdate).toHaveBeenNthCalledWith(1, {
          where: { id: pcListingId },
          data: {
            upvoteCount: { increment: 0 },
            downvoteCount: { increment: -1 },
            voteCount: { increment: -1 },
          },
        })

        const expectedScore = calculateWilsonScore(10, 2)
        expect(mockUpdate).toHaveBeenNthCalledWith(2, {
          where: { id: pcListingId },
          data: { successRate: expectedScore },
        })
      })
    })
  })
})
