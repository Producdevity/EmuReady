import { describe, expect, it, beforeEach, vi } from 'vitest'
import { TrustAction } from '@orm'
import { handleCommentVoteTrustEffects, handleListingVoteTrustEffects } from './vote-trust-effects'

const mockLogAction = vi.fn()
const mockReverseLogAction = vi.fn()

vi.mock('@/lib/trust/service', () => ({
  TrustService: vi.fn().mockImplementation(() => ({
    logAction: mockLogAction,
    reverseLogAction: mockReverseLogAction,
  })),
}))

const USER_ID = 'voter-1'
const AUTHOR_ID = 'author-1'
const LISTING_ID = 'listing-1'
const mockTx = {} as Parameters<typeof handleListingVoteTrustEffects>[0]['tx']

beforeEach(() => {
  vi.clearAllMocks()
  mockLogAction.mockResolvedValue(undefined)
  mockReverseLogAction.mockResolvedValue(undefined)
})

describe('handleListingVoteTrustEffects', () => {
  describe('created action', () => {
    it('applies UPVOTE for voter and LISTING_RECEIVED_UPVOTE for author on upvote', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      expect(mockLogAction).toHaveBeenCalledTimes(2)
      expect(mockLogAction).toHaveBeenNthCalledWith(1, {
        userId: USER_ID,
        action: TrustAction.UPVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockLogAction).toHaveBeenNthCalledWith(2, {
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_UPVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })
      expect(mockReverseLogAction).not.toHaveBeenCalled()
    })

    it('applies DOWNVOTE for voter and LISTING_RECEIVED_DOWNVOTE for author on downvote', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'created',
        currentValue: false,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      expect(mockLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.DOWNVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_DOWNVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('skips author trust on self-vote', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: USER_ID,
      })

      expect(mockLogAction).toHaveBeenCalledTimes(1)
      expect(mockLogAction).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, action: TrustAction.UPVOTE }),
      )
    })

    it('skips author trust when authorId is null', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: null,
      })

      expect(mockLogAction).toHaveBeenCalledTimes(1)
    })

    it('uses pcListingId context key for PC listings', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'created',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'pc',
        authorId: AUTHOR_ID,
      })

      expect(mockLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.UPVOTE,
        metadata: { pcListingId: LISTING_ID },
      })
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_UPVOTE,
        metadata: { pcListingId: LISTING_ID, voterId: USER_ID },
      })
    })
  })

  describe('updated action (vote change — reverse then apply)', () => {
    it('reverses previous upvote and applies downvote when changing from up to down', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'updated',
        currentValue: false,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      // Expect 2 reversals (voter + author) then 2 applications (voter + author)
      expect(mockReverseLogAction).toHaveBeenCalledTimes(2)
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        originalAction: TrustAction.UPVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })

      expect(mockLogAction).toHaveBeenCalledTimes(2)
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.DOWNVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_DOWNVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('reverses previous downvote and applies upvote when changing from down to up', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'updated',
        currentValue: true,
        previousValue: false,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        originalAction: TrustAction.DOWNVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        originalAction: TrustAction.LISTING_RECEIVED_DOWNVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.UPVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_RECEIVED_UPVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('does nothing when previousValue is null (safety)', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'updated',
        currentValue: false,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      expect(mockReverseLogAction).not.toHaveBeenCalled()
      expect(mockLogAction).not.toHaveBeenCalled()
    })

    it('skips author reversals/applications on self-vote', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'updated',
        currentValue: false,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: USER_ID,
      })

      // Only voter-side trust calls, one reverse and one apply
      expect(mockReverseLogAction).toHaveBeenCalledTimes(1)
      expect(mockLogAction).toHaveBeenCalledTimes(1)
    })

    it('uses pcListingId for PC listings on update', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'updated',
        currentValue: false,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'pc',
        authorId: AUTHOR_ID,
      })

      expect(mockReverseLogAction).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { pcListingId: LISTING_ID } }),
      )
      expect(mockLogAction).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { pcListingId: LISTING_ID } }),
      )
    })
  })

  describe('deleted action (vote toggled off)', () => {
    it('reverses UPVOTE and LISTING_RECEIVED_UPVOTE when an upvote is toggled off', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      expect(mockReverseLogAction).toHaveBeenCalledTimes(2)
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        originalAction: TrustAction.UPVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })
      expect(mockLogAction).not.toHaveBeenCalled()
    })

    it('reverses DOWNVOTE and LISTING_RECEIVED_DOWNVOTE when a downvote is toggled off', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'deleted',
        currentValue: false,
        previousValue: false,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: USER_ID,
        originalAction: TrustAction.DOWNVOTE,
        metadata: { listingId: LISTING_ID },
      })
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        originalAction: TrustAction.LISTING_RECEIVED_DOWNVOTE,
        metadata: { listingId: LISTING_ID, voterId: USER_ID },
      })
    })

    it('does nothing when previousValue is null (safety)', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'deleted',
        currentValue: true,
        previousValue: null,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: AUTHOR_ID,
      })

      expect(mockReverseLogAction).not.toHaveBeenCalled()
      expect(mockLogAction).not.toHaveBeenCalled()
    })

    it('skips author reversal on self-vote toggle-off', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'handheld',
        authorId: USER_ID,
      })

      expect(mockReverseLogAction).toHaveBeenCalledTimes(1)
      expect(mockReverseLogAction).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, originalAction: TrustAction.UPVOTE }),
      )
    })

    it('uses pcListingId for PC listings on delete', async () => {
      await handleListingVoteTrustEffects({
        tx: mockTx,
        action: 'deleted',
        currentValue: true,
        previousValue: true,
        userId: USER_ID,
        listingId: LISTING_ID,
        listingType: 'pc',
        authorId: AUTHOR_ID,
      })

      expect(mockReverseLogAction).toHaveBeenCalledWith(
        expect.objectContaining({
          originalAction: TrustAction.UPVOTE,
          metadata: { pcListingId: LISTING_ID },
        }),
      )
      expect(mockReverseLogAction).toHaveBeenCalledWith(
        expect.objectContaining({
          originalAction: TrustAction.LISTING_RECEIVED_UPVOTE,
          metadata: { pcListingId: LISTING_ID, voterId: USER_ID },
        }),
      )
    })
  })
})

describe('handleCommentVoteTrustEffects', () => {
  const COMMENT_AUTHOR_ID = 'comment-author-1'
  const VOTER_ID = 'voter-1'
  const COMMENT_ID = 'comment-1'
  const PARENT_ENTITY_ID = 'parent-entity-1'
  const commentMockTx = {} as Parameters<typeof handleCommentVoteTrustEffects>[0]['tx']

  function callWithDefaults(
    overrides: Partial<Parameters<typeof handleCommentVoteTrustEffects>[0]>,
  ) {
    return handleCommentVoteTrustEffects({
      tx: commentMockTx,
      trustAction: 'upvote',
      newValue: true,
      previousValue: null,
      commentAuthorId: COMMENT_AUTHOR_ID,
      voterId: VOTER_ID,
      commentId: COMMENT_ID,
      parentEntityId: PARENT_ENTITY_ID,
      listingType: 'handheld',
      updatedScore: 1,
      scoreChange: 1,
      ...overrides,
    })
  }

  describe('self-vote skipping', () => {
    it('does nothing when commentAuthorId equals voterId', async () => {
      await callWithDefaults({
        commentAuthorId: 'same-user',
        voterId: 'same-user',
      })

      expect(mockLogAction).not.toHaveBeenCalled()
      expect(mockReverseLogAction).not.toHaveBeenCalled()
    })
  })

  describe('upvote action', () => {
    it('logs COMMENT_RECEIVED_UPVOTE for handheld with listingId', async () => {
      await callWithDefaults({ trustAction: 'upvote', listingType: 'handheld' })

      expect(mockLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        action: TrustAction.COMMENT_RECEIVED_UPVOTE,
        targetUserId: VOTER_ID,
        metadata: { commentId: COMMENT_ID, voterId: VOTER_ID, listingId: PARENT_ENTITY_ID },
      })
    })

    it('logs COMMENT_RECEIVED_UPVOTE for PC with pcListingId', async () => {
      await callWithDefaults({ trustAction: 'upvote', listingType: 'pc' })

      expect(mockLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        action: TrustAction.COMMENT_RECEIVED_UPVOTE,
        targetUserId: VOTER_ID,
        metadata: { commentId: COMMENT_ID, voterId: VOTER_ID, pcListingId: PARENT_ENTITY_ID },
      })
    })
  })

  describe('downvote action', () => {
    it('logs COMMENT_RECEIVED_DOWNVOTE for handheld', async () => {
      await callWithDefaults({
        trustAction: 'downvote',
        newValue: false,
        listingType: 'handheld',
      })

      expect(mockLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        action: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
        targetUserId: VOTER_ID,
        metadata: { commentId: COMMENT_ID, voterId: VOTER_ID, listingId: PARENT_ENTITY_ID },
      })
    })
  })

  describe('change action (uses reverseLogAction for the reversal)', () => {
    it('properly reverses previous downvote then applies upvote when changing to upvote', async () => {
      await callWithDefaults({
        trustAction: 'change',
        newValue: true,
        previousValue: false,
      })

      // Must use reverseLogAction (not logAction) to actually reverse weight
      expect(mockReverseLogAction).toHaveBeenCalledTimes(1)
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        originalAction: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
        targetUserId: VOTER_ID,
        metadata: { commentId: COMMENT_ID, voterId: VOTER_ID, listingId: PARENT_ENTITY_ID },
      })

      // Then apply new upvote
      expect(mockLogAction).toHaveBeenCalledTimes(1)
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        action: TrustAction.COMMENT_RECEIVED_UPVOTE,
        targetUserId: VOTER_ID,
        metadata: { commentId: COMMENT_ID, voterId: VOTER_ID, listingId: PARENT_ENTITY_ID },
      })
    })

    it('properly reverses previous upvote then applies downvote when changing to downvote', async () => {
      await callWithDefaults({
        trustAction: 'change',
        newValue: false,
        previousValue: true,
      })

      expect(mockReverseLogAction).toHaveBeenCalledTimes(1)
      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        originalAction: TrustAction.COMMENT_RECEIVED_UPVOTE,
        targetUserId: VOTER_ID,
        metadata: expect.any(Object),
      })

      expect(mockLogAction).toHaveBeenCalledTimes(1)
      expect(mockLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        action: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
        targetUserId: VOTER_ID,
        metadata: expect.any(Object),
      })
    })

    it('uses pcListingId for PC listing vote changes', async () => {
      await callWithDefaults({
        trustAction: 'change',
        newValue: true,
        previousValue: false,
        listingType: 'pc',
      })

      expect(mockReverseLogAction).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ pcListingId: PARENT_ENTITY_ID }),
        }),
      )
      expect(mockLogAction).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ pcListingId: PARENT_ENTITY_ID }),
        }),
      )
    })
  })

  describe('remove action (uses reverseLogAction)', () => {
    it('reverses COMMENT_RECEIVED_UPVOTE when previousValue was upvote', async () => {
      await callWithDefaults({
        trustAction: 'remove',
        previousValue: true,
      })

      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        originalAction: TrustAction.COMMENT_RECEIVED_UPVOTE,
        targetUserId: VOTER_ID,
        metadata: { commentId: COMMENT_ID, voterId: VOTER_ID, listingId: PARENT_ENTITY_ID },
      })
      // remove doesn't need to log a new action
      expect(mockLogAction).not.toHaveBeenCalled()
    })

    it('reverses COMMENT_RECEIVED_DOWNVOTE when previousValue was downvote', async () => {
      await callWithDefaults({
        trustAction: 'remove',
        previousValue: false,
      })

      expect(mockReverseLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        originalAction: TrustAction.COMMENT_RECEIVED_DOWNVOTE,
        targetUserId: VOTER_ID,
        metadata: expect.any(Object),
      })
    })

    it('does nothing when previousValue is null (safety)', async () => {
      await callWithDefaults({
        trustAction: 'remove',
        previousValue: null,
      })

      expect(mockReverseLogAction).not.toHaveBeenCalled()
      expect(mockLogAction).not.toHaveBeenCalled()
    })
  })

  describe('helpful comment threshold', () => {
    it('logs HELPFUL_COMMENT when score crosses 5 from below', async () => {
      await callWithDefaults({
        trustAction: 'upvote',
        updatedScore: 5,
        scoreChange: 1,
      })

      expect(mockLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        action: TrustAction.HELPFUL_COMMENT,
        metadata: {
          commentId: COMMENT_ID,
          listingId: PARENT_ENTITY_ID,
          score: 5,
          threshold: 5,
        },
      })
    })

    it('does NOT log HELPFUL_COMMENT when score was already at threshold', async () => {
      await callWithDefaults({
        trustAction: 'upvote',
        updatedScore: 6,
        scoreChange: 1,
      })

      expect(mockLogAction).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: TrustAction.HELPFUL_COMMENT }),
      )
    })

    it('does NOT log HELPFUL_COMMENT when score is still below threshold', async () => {
      await callWithDefaults({
        trustAction: 'upvote',
        updatedScore: 3,
        scoreChange: 1,
      })

      expect(mockLogAction).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: TrustAction.HELPFUL_COMMENT }),
      )
    })

    it('uses pcListingId in HELPFUL_COMMENT metadata for PC listings', async () => {
      await callWithDefaults({
        trustAction: 'upvote',
        listingType: 'pc',
        updatedScore: 5,
        scoreChange: 1,
      })

      expect(mockLogAction).toHaveBeenCalledWith({
        userId: COMMENT_AUTHOR_ID,
        action: TrustAction.HELPFUL_COMMENT,
        metadata: {
          commentId: COMMENT_ID,
          pcListingId: PARENT_ENTITY_ID,
          score: 5,
          threshold: 5,
        },
      })
    })

    it('does NOT log HELPFUL_COMMENT when score drops below threshold', async () => {
      await callWithDefaults({
        trustAction: 'downvote',
        newValue: false,
        updatedScore: 4,
        scoreChange: -1,
      })

      expect(mockLogAction).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: TrustAction.HELPFUL_COMMENT }),
      )
    })
  })
})
