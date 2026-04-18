import { describe, expect, it, beforeEach, vi } from 'vitest'
import { Role } from '@orm'

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
  ApiKeysRepository: vi.fn().mockImplementation(() => ({})),
}))

const mockApplyTrustAction = vi.fn().mockResolvedValue(undefined)
const mockHandleListingVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockHandleCommentVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockLogAction = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: (...args: unknown[]) => mockApplyTrustAction(...args),
  TrustService: vi.fn().mockImplementation(() => ({ logAction: mockLogAction })),
}))

vi.mock('@/server/utils/vote-trust-effects', () => ({
  handleListingVoteTrustEffects: (...args: unknown[]) => mockHandleListingVoteTrustEffects(...args),
  handleCommentVoteTrustEffects: (...args: unknown[]) => mockHandleCommentVoteTrustEffects(...args),
}))

vi.mock('@/server/utils/vote-counts', () => ({
  updateListingVoteCounts: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: { vote: vi.fn(), commentVote: vi.fn() },
  },
}))

vi.mock('@/server/repositories/comments.repository', () => ({
  CommentsRepository: vi.fn().mockImplementation(() => ({
    listByListing: vi.fn().mockResolvedValue([]),
  })),
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

function createMockPrisma() {
  const mockTx = {
    vote: {
      create: vi
        .fn()
        .mockResolvedValue({ id: 'vote-1', value: true, userId: USER_ID, listingId: LISTING_ID }),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi
        .fn()
        .mockResolvedValue({ id: 'vote-1', value: false, userId: USER_ID, listingId: LISTING_ID }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    commentVote: {
      create: vi.fn().mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: true }),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: false }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    comment: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: COMMENT_ID, score: 1 }),
    },
    listing: {
      findUnique: vi.fn(),
    },
  }
  return {
    ...mockTx,
    $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
  }
}

type MockPrisma = ReturnType<typeof createMockPrisma>

function createCaller(overrides: { userId?: string; role?: Role; prisma?: MockPrisma } = {}) {
  const prisma = overrides.prisma ?? createMockPrisma()
  return {
    caller: mobileListingsRouter.createCaller({
      session: {
        user: {
          id: overrides.userId ?? USER_ID,
          email: 'test@test.com',
          name: 'Test User',
          role: overrides.role ?? Role.USER,
          permissions: [],
          showNsfw: false,
        },
      },
      prisma: prisma as never,
      headers: new Headers(),
      apiKey: null,
    }),
    prisma,
  }
}

describe('mobile listings trust integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('vote', () => {
    it('calls handleListingVoteTrustEffects with tx on new upvote', async () => {
      const { caller, prisma } = createCaller()
      prisma.listing.findUnique.mockResolvedValue({ authorId: AUTHOR_ID })

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
      prisma.listing.findUnique.mockResolvedValue({ authorId: AUTHOR_ID })
      prisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        value: true,
        userId: USER_ID,
        listingId: LISTING_ID,
      })

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
      prisma.listing.findUnique.mockResolvedValue({ authorId: AUTHOR_ID })
      prisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        value: true,
        userId: USER_ID,
        listingId: LISTING_ID,
      })

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
      prisma.listing.findUnique.mockResolvedValue({ authorId: AUTHOR_ID })

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      const trustCall = mockHandleListingVoteTrustEffects.mock.calls[0][0] as { tx: unknown }
      expect(trustCall.tx).toHaveProperty('vote')
    })

    it('emits LISTING_VOTED on a new vote', async () => {
      const { caller, prisma } = createCaller()
      prisma.listing.findUnique.mockResolvedValue({ authorId: AUTHOR_ID })

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
      prisma.listing.findUnique.mockResolvedValue({ authorId: AUTHOR_ID })
      prisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        value: true,
        userId: USER_ID,
        listingId: LISTING_ID,
      })

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
    })
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

      const txCall = vi.mocked(prisma.$transaction).mock.invocationCallOrder[0]
      const findUniqueCall = prisma.commentVote.findUnique.mock.invocationCallOrder[0]
      expect(txCall).toBeDefined()
      expect(findUniqueCall).toBeDefined()
      expect(findUniqueCall).toBeGreaterThan(txCall as number)
    })
  })
})
