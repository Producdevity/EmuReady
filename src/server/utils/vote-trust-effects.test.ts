import { describe, expect, it, beforeEach, vi } from 'vitest'
import { TrustAction } from '@orm'
import { handleVoteTrustEffects } from './vote-trust-effects'

const mockApplyTrustAction = vi.fn()
const mockReverseTrustAction = vi.fn()

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: (...args: unknown[]) => mockApplyTrustAction(...args),
  reverseTrustAction: (...args: unknown[]) => mockReverseTrustAction(...args),
}))

const USER_ID = 'voter-1'
const AUTHOR_ID = 'author-1'
const LISTING_ID = 'listing-1'

describe('handleVoteTrustEffects', () => {
  beforeEach(() => {
    mockApplyTrustAction.mockResolvedValue(undefined)
    mockReverseTrustAction.mockResolvedValue(undefined)
  })

  describe('vote created', () => {
    it('applies UPVOTE trust for voter on upvote', async () => {
      await handleVoteTrustEffects({
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.UPVOTE,
        context: { listingId: LISTING_ID },
      })
    })

    it('applies DOWNVOTE trust for voter on downvote', async () => {
      await handleVoteTrustEffects({
        action: 'created',
        currentValue: false,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.DOWNVOTE,
        context: { listingId: LISTING_ID },
      })
    })

    it('applies LISTING_RECEIVED_UPVOTE trust for author on upvote', async () => {
      await handleVoteTrustEffects({
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_UPVOTE,
        context: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('applies LISTING_RECEIVED_DOWNVOTE trust for author on downvote', async () => {
      await handleVoteTrustEffects({
        action: 'created',
        currentValue: false,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_DOWNVOTE,
        context: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('skips author trust on self-vote', async () => {
      await handleVoteTrustEffects({
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: USER_ID,
      })

      expect(mockApplyTrustAction).toHaveBeenCalledTimes(1)
      expect(mockApplyTrustAction).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, action: TrustAction.UPVOTE }),
      )
    })

    it('skips author trust when authorId is null', async () => {
      await handleVoteTrustEffects({
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: null,
      })

      expect(mockApplyTrustAction).toHaveBeenCalledTimes(1)
    })

    it('does not call reverseTrustAction', async () => {
      await handleVoteTrustEffects({
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockReverseTrustAction).not.toHaveBeenCalled()
    })
  })

  describe('vote updated', () => {
    it('applies trust for the new vote value', async () => {
      await handleVoteTrustEffects({
        action: 'updated',
        currentValue: false,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.DOWNVOTE,
        context: { listingId: LISTING_ID },
      })
      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_DOWNVOTE,
        context: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })
  })

  describe('vote deleted (toggled off)', () => {
    it('reverses UPVOTE trust for voter when upvote was toggled off', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockReverseTrustAction).toHaveBeenCalledWith({
        userId: USER_ID,
        originalAction: TrustAction.UPVOTE,
        context: { listingId: LISTING_ID },
      })
    })

    it('reverses DOWNVOTE trust for voter when downvote was toggled off', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: false,
        previousValue: false,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockReverseTrustAction).toHaveBeenCalledWith({
        userId: USER_ID,
        originalAction: TrustAction.DOWNVOTE,
        context: { listingId: LISTING_ID },
      })
    })

    it('reverses LISTING_RECEIVED_UPVOTE trust for author when upvote was toggled off', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockReverseTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
        context: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('reverses LISTING_RECEIVED_DOWNVOTE trust for author when downvote was toggled off', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: false,
        previousValue: false,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockReverseTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        originalAction: TrustAction.LISTING_RECEIVED_DOWNVOTE,
        context: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('skips author trust reversal on self-vote toggle-off', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: USER_ID,
      })

      expect(mockReverseTrustAction).toHaveBeenCalledTimes(1)
      expect(mockReverseTrustAction).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, originalAction: TrustAction.UPVOTE }),
      )
    })

    it('skips author trust reversal when authorId is null', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: null,
      })

      expect(mockReverseTrustAction).toHaveBeenCalledTimes(1)
    })

    it('does not reverse trust when previousValue is null', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockReverseTrustAction).not.toHaveBeenCalled()
    })

    it('does not call applyTrustAction', async () => {
      await handleVoteTrustEffects({
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        authorId: AUTHOR_ID,
      })

      expect(mockApplyTrustAction).not.toHaveBeenCalled()
    })
  })
})
