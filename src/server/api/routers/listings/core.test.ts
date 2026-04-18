import { describe, expect, it, beforeEach, vi } from 'vitest'
import { Role } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockApplyTrustAction = vi.fn().mockResolvedValue(undefined)
const mockHandleListingVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockHandleCommentVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockLogAction = vi.fn().mockResolvedValue(undefined)
const mockReverseLogAction = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: (...args: unknown[]) => mockApplyTrustAction(...args),
  TrustService: vi.fn().mockImplementation(() => ({
    logAction: mockLogAction,
    reverseLogAction: mockReverseLogAction,
  })),
}))

vi.mock('@/server/utils/vote-trust-effects', () => ({
  handleListingVoteTrustEffects: (...args: unknown[]) => mockHandleListingVoteTrustEffects(...args),
  handleCommentVoteTrustEffects: (...args: unknown[]) => mockHandleCommentVoteTrustEffects(...args),
}))

vi.mock('@/server/utils/vote-counts', () => ({
  updateListingVoteCounts: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
  NOTIFICATION_EVENTS: {
    LISTING_VOTED: 'LISTING_VOTED',
    COMMENT_VOTED: 'COMMENT_VOTED',
    LISTING_APPROVED: 'LISTING_APPROVED',
    LISTING_REJECTED: 'LISTING_REJECTED',
    COMMENT_REPLIED: 'COMMENT_REPLIED',
    LISTING_COMMENTED: 'LISTING_COMMENTED',
  },
}))

vi.mock('@/server/utils/query-builders', () => ({
  isUserBanned: vi.fn().mockResolvedValue(false),
  listingWhereClause: vi.fn(() => ({})),
}))

vi.mock('@/lib/captcha/verify', () => ({
  verifyRecaptcha: vi.fn().mockResolvedValue({ success: true }),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: { vote: vi.fn(), commentVote: vi.fn() },
    userJourney: { firstTimeAction: vi.fn() },
    listing: { created: vi.fn() },
  },
}))

vi.mock('@/server/services/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  buildDiff: vi.fn().mockReturnValue({}),
}))

vi.mock('@/server/utils/security-validation', () => ({
  validatePagination: vi.fn((page, limit, max) => ({ page: page ?? 1, limit: limit ?? max ?? 20 })),
  sanitizeInput: vi.fn((s: string) => s),
}))

vi.mock('@/server/repositories/listings.repository', () => ({
  ListingsRepository: vi.fn().mockImplementation(() => ({
    getExistingVote: vi.fn().mockResolvedValue(null),
  })),
}))

const { coreRouter } = await import('./core')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'

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
      count: vi.fn().mockResolvedValue(1),
    },
    listing: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
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
    caller: coreRouter.createCaller({
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

describe('handheld listings trust integration (core.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('vote', () => {
    it('calls handleListingVoteTrustEffects with tx on new upvote', async () => {
      const { caller, prisma } = createCaller()
      prisma.listing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

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

    it('calls handleListingVoteTrustEffects with listingType handheld (not pc)', async () => {
      const { caller, prisma } = createCaller()
      prisma.listing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.vote({ listingId: LISTING_ID, value: true })

      const firstCall = mockHandleListingVoteTrustEffects.mock.calls[0][0] as {
        listingType: string
      }
      expect(firstCall.listingType).toBe('handheld')
    })

    it('calls handleListingVoteTrustEffects with action deleted on vote toggle', async () => {
      const { caller, prisma } = createCaller()
      prisma.listing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })
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
      prisma.listing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })
      prisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        value: true,
        userId: USER_ID,
        listingId: LISTING_ID,
      })

      await caller.vote({ listingId: LISTING_ID, value: false }) // change to downvote

      expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated',
          currentValue: false,
          previousValue: true,
          listingType: 'handheld',
          tx: expect.any(Object),
        }),
      )
    })

    it('passes the transaction client to handleListingVoteTrustEffects', async () => {
      const { caller, prisma } = createCaller()
      prisma.listing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.vote({ listingId: LISTING_ID, value: true })

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)

      const trustCall = mockHandleListingVoteTrustEffects.mock.calls[0][0] as {
        tx: unknown
      }
      // The tx passed should be the same mockTx object passed to the transaction callback
      expect(trustCall.tx).toBeDefined()
      expect(trustCall.tx).toHaveProperty('vote')
      expect(trustCall.tx).toHaveProperty('listing')
    })
  })
})
