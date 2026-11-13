import { describe, expect, it, beforeEach, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { prisma as database } from '@/server/db'
import { trackTrustScoreChange, type TrustScoreChange } from '@/server/utils/trust-score-analytics'
import { type handleListingVoteTrustEffects } from '@/server/utils/vote-trust-effects'
import { type Prisma, Role, TrustAction, type Vote } from '@orm/client'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

// Stub the api-keys schema so it doesn't pull unmocked enums from @orm
vi.mock('@/schemas/apiAccess', () => ({
  GetApiKeyUsageSchema: {},
  CreateApiKeySchema: {},
  UpdateApiKeySchema: {},
  RevokeApiKeySchema: {},
  ListApiKeysSchema: {},
}))

vi.mock('@/server/repositories/api-keys.repository', () => ({
  ApiKeysRepository: vi.fn().mockImplementation(function MockApiKeysRepository() {
    return {}
  }),
}))

const mockApplyTrustAction = vi.fn().mockResolvedValue(undefined)
const mockHandleListingVoteTrustEffects = vi
  .fn<typeof handleListingVoteTrustEffects>()
  .mockResolvedValue(undefined)
const mockHandleCommentVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockLogAction = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: (...args: unknown[]) => mockApplyTrustAction(...args),
  TrustService: vi.fn().mockImplementation(function MockTrustService() {
    return { logAction: mockLogAction }
  }),
}))

vi.mock('@/server/utils/vote-trust-effects', () => ({
  handleListingVoteTrustEffects: (input: Parameters<typeof handleListingVoteTrustEffects>[0]) =>
    mockHandleListingVoteTrustEffects(input),
  handleCommentVoteTrustEffects: (...args: unknown[]) => mockHandleCommentVoteTrustEffects(...args),
}))

vi.mock('@/server/utils/vote-counts', () => ({
  updateListingVoteCounts: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: { vote: vi.fn(), commentVote: vi.fn() },
    userJourney: { firstTimeAction: vi.fn() },
  },
}))

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/server/utils/trust-score-analytics', () => ({ trackTrustScoreChange: vi.fn() }))

const models = vi.hoisted(() => ({
  vote: { create: vi.fn(), delete: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  commentVote: { create: vi.fn(), delete: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  comment: { findUnique: vi.fn(), update: vi.fn() },
  listing: { findUnique: vi.fn() },
  trustActionLog: { findMany: vi.fn() },
  $transaction: vi.fn(),
}))
vi.mock('@/server/db', () => ({ prisma: models }))

vi.mock('@/server/repositories/comments.repository', () => ({
  CommentsRepository: vi.fn().mockImplementation(function MockCommentsRepository() {
    return {
      listByListing: vi.fn().mockResolvedValue([]),
    }
  }),
}))

const mockEmitNotificationEvent = vi.fn()
vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: mockEmitNotificationEvent },
  NOTIFICATION_EVENTS: {
    LISTING_VOTED: 'LISTING_VOTED',
    COMMENT_VOTED: 'COMMENT_VOTED',
  },
}))

const { mobileListingsRouter } = await import('./listings')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const COMMENT_ID = '00000000-0000-4000-a000-000000000020'
const transaction: Prisma.TransactionClient = { ...database }
const trustChange: TrustScoreChange = {
  userId: USER_ID,
  action: TrustAction.UPVOTE,
  oldScore: 100,
  newScore: 101,
  delta: 1,
}

function voteRecord(value: boolean): Vote {
  return {
    id: 'vote-1',
    value,
    userId: USER_ID,
    listingId: LISTING_ID,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    nullifiedAt: null,
  }
}

function createCaller() {
  return {
    caller: mobileListingsRouter.createCaller({
      session: {
        user: {
          id: USER_ID,
          email: 'test@test.com',
          name: 'Test User',
          role: Role.USER,
          permissions: [],
          showNsfw: false,
        },
      },
      prisma: database,
      headers: new Headers(),
      apiKey: null,
    }),
    prisma: models,
  }
}

describe('mobile listings trust integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmitNotificationEvent.mockReset()
    mockHandleListingVoteTrustEffects.mockReset().mockResolvedValue(undefined)
    vi.mocked(analytics.engagement.vote).mockReset()
    vi.mocked(analytics.userJourney.firstTimeAction).mockReset()
    models.$transaction
      .mockReset()
      .mockImplementation(async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
        run(transaction),
      )
    models.vote.findUnique.mockReset().mockResolvedValue(null)
    models.vote.create.mockReset().mockResolvedValue(voteRecord(true))
    models.vote.update.mockReset().mockResolvedValue(voteRecord(false))
    models.vote.delete.mockReset().mockResolvedValue(undefined)
    models.trustActionLog.findMany.mockReset().mockResolvedValue([{ id: 'vote-action-1' }])
    models.commentVote.findUnique.mockReset().mockResolvedValue(null)
    models.commentVote.create
      .mockReset()
      .mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: true })
    models.commentVote.update
      .mockReset()
      .mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: false })
    models.commentVote.delete.mockReset().mockResolvedValue(undefined)
    models.comment.update.mockReset().mockResolvedValue({ id: COMMENT_ID, score: 1 })
    models.comment.findUnique.mockReset()
    models.listing.findUnique.mockReset().mockResolvedValue({ authorId: AUTHOR_ID })
  })

  describe('vote', () => {
    it('calls handleListingVoteTrustEffects with tx on new upvote', async () => {
      const { caller } = createCaller()

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'created',
          currentValue: true,
          previousValue: null,
          userId: USER_ID,
          listingId: LISTING_ID,
          listingType: 'handheld',
          authorId: AUTHOR_ID,
          tx: expect.any(Object),
        }),
      )
    })

    it('calls handleListingVoteTrustEffects with action deleted on vote toggle', async () => {
      const { caller, prisma } = createCaller()
      prisma.vote.findUnique.mockResolvedValue(voteRecord(true))

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'deleted',
          previousValue: true,
          listingType: 'handheld',
          tx: expect.any(Object),
        }),
      )
    })

    it('calls handleListingVoteTrustEffects with action updated on vote change', async () => {
      const { caller, prisma } = createCaller()
      prisma.vote.findUnique.mockResolvedValue(voteRecord(true))

      await caller.vote({ listingId: LISTING_ID, value: false })

      expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated',
          currentValue: false,
          previousValue: true,
          tx: expect.any(Object),
        }),
      )
    })

    it('runs trust call inside the transaction', async () => {
      const { caller, prisma } = createCaller()

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({ tx: transaction }),
      )
    })

    it('emits LISTING_VOTED on a new vote', async () => {
      const { caller } = createCaller()

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(mockEmitNotificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'LISTING_VOTED',
          entityType: 'listing',
          entityId: LISTING_ID,
          payload: expect.objectContaining({ voteValue: true, listingId: LISTING_ID }),
        }),
      )
    })

    it('does NOT emit LISTING_VOTED on toggle-off', async () => {
      const { caller, prisma } = createCaller()
      prisma.vote.findUnique.mockResolvedValue(voteRecord(true))

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
    })

    it.each(['created', 'updated', 'deleted'] as const)(
      'preserves the mobile %s response and tracks the vote direction',
      async (action) => {
        const { caller, prisma } = createCaller()
        const value = action !== 'updated'
        if (action !== 'created') prisma.vote.findUnique.mockResolvedValue(voteRecord(true))

        const result = await caller.vote({ listingId: LISTING_ID, value })

        expect(result).toEqual(
          action === 'deleted' ? { id: 'vote-1', value: null, removed: true } : voteRecord(value),
        )
        expect(analytics.engagement.vote).toHaveBeenCalledExactlyOnceWith({
          listingId: LISTING_ID,
          voteValue: action === 'deleted' ? null : value,
          previousVote: action === 'created' ? null : true,
        })
        if (action === 'created') {
          expect(prisma.trustActionLog.findMany).toHaveBeenCalledExactlyOnceWith({
            where: { userId: USER_ID, action: { in: [TrustAction.UPVOTE, TrustAction.DOWNVOTE] } },
            select: { id: true },
            take: 2,
          })
          expect(analytics.userJourney.firstTimeAction).toHaveBeenCalledExactlyOnceWith({
            userId: USER_ID,
            action: 'first_vote',
          })
        } else {
          expect(prisma.trustActionLog.findMany).not.toHaveBeenCalled()
          expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
        }
      },
    )

    it('does not track a first-vote milestone for an established voter', async () => {
      const { caller, prisma } = createCaller()
      prisma.trustActionLog.findMany.mockResolvedValue([{ id: 'action-1' }, { id: 'action-2' }])
      await caller.vote({ listingId: LISTING_ID, value: true })
      expect(analytics.engagement.vote).toHaveBeenCalledOnce()
      expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
    })

    it('waits for commit before publishing trust changes and vote effects', async () => {
      const { caller, prisma } = createCaller()
      const commit = Promise.withResolvers<void>()
      mockHandleListingVoteTrustEffects.mockImplementation(async (input) => {
        input.trustChanges.push(trustChange)
      })
      prisma.$transaction.mockImplementationOnce(
        async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          const result = await run(transaction)
          await commit.promise
          return result
        },
      )
      const pending = caller.vote({ listingId: LISTING_ID, value: true })
      try {
        await vi.waitFor(() => expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledOnce())
        expect(trackTrustScoreChange).not.toHaveBeenCalled()
        expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
        expect(analytics.engagement.vote).not.toHaveBeenCalled()
        expect(prisma.trustActionLog.findMany).not.toHaveBeenCalled()
        commit.resolve()
        await expect(pending).resolves.toEqual(voteRecord(true))
        expect(trackTrustScoreChange).toHaveBeenCalledExactlyOnceWith(trustChange)
        expect(analytics.engagement.vote).toHaveBeenCalledOnce()
      } finally {
        commit.resolve()
      }
    })

    it('publishes no vote effects when the transaction fails to commit', async () => {
      const { caller, prisma } = createCaller()
      mockHandleListingVoteTrustEffects.mockImplementation(async (input) => {
        input.trustChanges.push(trustChange)
      })
      prisma.$transaction.mockImplementationOnce(
        async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          await run(transaction)
          throw new Error('Commit failed')
        },
      )
      await expect(caller.vote({ listingId: LISTING_ID, value: true })).rejects.toThrow(
        'Commit failed',
      )
      expect(trackTrustScoreChange).not.toHaveBeenCalled()
      expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
      expect(analytics.engagement.vote).not.toHaveBeenCalled()
      expect(analytics.userJourney.firstTimeAction).not.toHaveBeenCalled()
      expect(prisma.trustActionLog.findMany).not.toHaveBeenCalled()
    })

    it.each(['notification', 'analytics', 'milestone lookup'] as const)(
      'keeps a committed vote successful when %s fails',
      async (failure) => {
        const { caller, prisma } = createCaller()
        const error = new Error(`${failure} failed`)
        if (failure === 'notification') {
          mockEmitNotificationEvent.mockImplementationOnce(() => {
            throw error
          })
        } else if (failure === 'analytics') {
          vi.mocked(analytics.engagement.vote).mockImplementationOnce(() => {
            throw error
          })
        } else {
          prisma.trustActionLog.findMany.mockRejectedValueOnce(error)
        }
        await expect(caller.vote({ listingId: LISTING_ID, value: true })).resolves.toEqual(
          voteRecord(true),
        )
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Committed vote'), error)
        expect(analytics.userJourney.firstTimeAction).toHaveBeenCalledTimes(
          failure === 'milestone lookup' ? 0 : 1,
        )
      },
    )
  })

  describe('voteComment', () => {
    it('calls handleCommentVoteTrustEffects with listingType handheld on new upvote', async () => {
      const { caller, prisma } = createCaller()
      prisma.comment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        listingId: LISTING_ID,
      })
      prisma.commentVote.findUnique.mockResolvedValue(null)

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          trustAction: 'upvote',
          newValue: true,
          commentAuthorId: AUTHOR_ID,
          voterId: USER_ID,
          commentId: COMMENT_ID,
          parentEntityId: LISTING_ID,
          listingType: 'handheld',
        }),
      )
    })

    it('calls handleCommentVoteTrustEffects with change action on vote flip', async () => {
      const { caller, prisma } = createCaller()
      prisma.comment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        listingId: LISTING_ID,
      })
      prisma.commentVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        commentId: COMMENT_ID,
        value: true,
      })

      await caller.voteComment({ commentId: COMMENT_ID, value: false })

      expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          trustAction: 'change',
          newValue: false,
          previousValue: true,
          listingType: 'handheld',
        }),
      )
    })

    it('calls handleCommentVoteTrustEffects with remove action on vote toggle', async () => {
      const { caller, prisma } = createCaller()
      prisma.comment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        listingId: LISTING_ID,
      })
      prisma.commentVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        commentId: COMMENT_ID,
        value: true,
      })

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          trustAction: 'remove',
          listingType: 'handheld',
        }),
      )
    })

    it('emits COMMENT_VOTED on a new upvote', async () => {
      const { caller, prisma } = createCaller()
      prisma.comment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        listingId: LISTING_ID,
      })
      prisma.commentVote.findUnique.mockResolvedValue(null)

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockEmitNotificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'COMMENT_VOTED',
          entityType: 'comment',
          entityId: COMMENT_ID,
          payload: expect.objectContaining({
            commentId: COMMENT_ID,
            listingId: LISTING_ID,
            voteValue: true,
          }),
        }),
      )
    })

    it('does NOT emit COMMENT_VOTED on toggle-off (remove)', async () => {
      const { caller, prisma } = createCaller()
      prisma.comment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        listingId: LISTING_ID,
      })
      prisma.commentVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        commentId: COMMENT_ID,
        value: true,
      })

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
    })

    it('fetches existingVote inside the $transaction callback', async () => {
      const { caller, prisma } = createCaller()
      prisma.comment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        listingId: LISTING_ID,
      })
      prisma.commentVote.findUnique.mockResolvedValue(null)

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(prisma.$transaction).toHaveBeenCalledBefore(prisma.commentVote.findUnique)
    })
  })
})
