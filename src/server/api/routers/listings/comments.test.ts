import { describe, expect, it, beforeEach, vi } from 'vitest'
import { Role } from '@orm/client'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockHandleCommentVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockEmitNotificationEvent = vi.fn()
const mockCheckSpamContent = vi.fn().mockResolvedValue(undefined)

vi.mock('@/server/utils/vote-trust-effects', () => ({
  handleCommentVoteTrustEffects: (...args: unknown[]) => mockHandleCommentVoteTrustEffects(...args),
  handleListingVoteTrustEffects: vi.fn(),
  handleVoteTrustEffects: vi.fn(),
}))

vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: mockEmitNotificationEvent },
  NOTIFICATION_EVENTS: {
    COMMENT_VOTED: 'COMMENT_VOTED',
    LISTING_COMMENTED: 'LISTING_COMMENTED',
    COMMENT_REPLIED: 'COMMENT_REPLIED',
  },
}))

vi.mock('@/server/utils/query-builders', () => ({
  isUserBanned: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/server/utils/spam-check', () => ({
  checkSpamContent: (...args: unknown[]) => mockCheckSpamContent(...args),
}))

vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: { comment: vi.fn(), commentVote: vi.fn() },
    userJourney: { firstTimeAction: vi.fn() },
  },
}))

const { commentsRouter } = await import('./comments')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const COMMENT_ID = '00000000-0000-4000-a000-000000000020'

function createMockPrisma() {
  const mockTx = {
    commentVote: {
      create: vi.fn().mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: true }),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: false }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    comment: {
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockResolvedValue({
        id: COMMENT_ID,
        content: 'Runs well with these settings',
        userId: USER_ID,
        listingId: LISTING_ID,
        parentId: null,
        user: { id: USER_ID, name: 'Test User', profileImage: null },
      }),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: COMMENT_ID, score: 1 }),
    },
    listing: {
      findUnique: vi.fn().mockResolvedValue({ id: LISTING_ID }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: USER_ID }),
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
    caller: commentsRouter.createCaller({
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
    }),
    prisma,
  }
}

describe('handheld comments router — voteComment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function setupCommentMocks(prisma: MockPrisma) {
    prisma.comment.findUnique.mockResolvedValue({
      id: COMMENT_ID,
      userId: AUTHOR_ID,
      listingId: LISTING_ID,
    })
    prisma.commentVote.findUnique.mockResolvedValue(null)
    prisma.comment.update.mockResolvedValue({ id: COMMENT_ID, score: 1 })
  }

  it('dispatches trust effects with listingType handheld on new upvote', async () => {
    const { caller, prisma } = createCaller()
    setupCommentMocks(prisma)

    await caller.vote({ commentId: COMMENT_ID, value: true })

    expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
      expect.objectContaining({
        trustAction: 'upvote',
        commentAuthorId: AUTHOR_ID,
        voterId: USER_ID,
        commentId: COMMENT_ID,
        parentEntityId: LISTING_ID,
        listingType: 'handheld',
      }),
    )
  })

  it('dispatches trust effects with change action on vote flip', async () => {
    const { caller, prisma } = createCaller()
    setupCommentMocks(prisma)
    prisma.commentVote.findUnique.mockResolvedValue({
      userId: USER_ID,
      commentId: COMMENT_ID,
      value: true,
    })

    await caller.vote({ commentId: COMMENT_ID, value: false })

    expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
      expect.objectContaining({
        trustAction: 'change',
        previousValue: true,
        newValue: false,
        listingType: 'handheld',
      }),
    )
  })

  it('dispatches trust effects with remove action on toggle-off', async () => {
    const { caller, prisma } = createCaller()
    setupCommentMocks(prisma)
    prisma.commentVote.findUnique.mockResolvedValue({
      userId: USER_ID,
      commentId: COMMENT_ID,
      value: true,
    })

    await caller.vote({ commentId: COMMENT_ID, value: true })

    expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
      expect.objectContaining({
        trustAction: 'remove',
        listingType: 'handheld',
      }),
    )
  })

  it('emits COMMENT_VOTED on new upvote', async () => {
    const { caller, prisma } = createCaller()
    setupCommentMocks(prisma)

    await caller.vote({ commentId: COMMENT_ID, value: true })

    expect(mockEmitNotificationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'COMMENT_VOTED',
        entityId: COMMENT_ID,
        payload: expect.objectContaining({ voteValue: true, commentId: COMMENT_ID }),
      }),
    )
  })

  it('does NOT emit COMMENT_VOTED on toggle-off', async () => {
    const { caller, prisma } = createCaller()
    setupCommentMocks(prisma)
    prisma.commentVote.findUnique.mockResolvedValue({
      userId: USER_ID,
      commentId: COMMENT_ID,
      value: true,
    })

    await caller.vote({ commentId: COMMENT_ID, value: true })

    expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
  })

  it('fetches existingVote inside the $transaction callback', async () => {
    const { caller, prisma } = createCaller()
    setupCommentMocks(prisma)

    await caller.vote({ commentId: COMMENT_ID, value: true })

    const txCall = vi.mocked(prisma.$transaction).mock.invocationCallOrder[0]
    const findUniqueCall = prisma.commentVote.findUnique.mock.invocationCallOrder[0]
    expect(txCall).toBeDefined()
    expect(findUniqueCall).toBeDefined()
    expect(findUniqueCall).toBeGreaterThan(txCall as number)
  })
})

describe('handheld comments router — create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs spam checks before creating a handheld comment', async () => {
    const { caller, prisma } = createCaller()

    await caller.create({
      listingId: LISTING_ID,
      content: 'Runs well with these settings',
    })

    expect(mockCheckSpamContent).toHaveBeenCalledWith({
      prisma,
      userId: USER_ID,
      content: 'Runs well with these settings',
      entityType: 'comment',
      challengeMode: 'challenge',
      humanVerificationToken: undefined,
      headers: expect.any(Headers),
    })
    expect(prisma.comment.create).toHaveBeenCalled()
  })
})
