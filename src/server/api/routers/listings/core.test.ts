import { describe, expect, it, beforeEach, vi } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, Role } from '@orm'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockApplyTrustAction = vi.fn().mockResolvedValue(undefined)
const mockHandleListingVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockHandleCommentVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockLogAction = vi.fn().mockResolvedValue(undefined)
const mockReverseLogAction = vi.fn().mockResolvedValue(undefined)
const mockVerifyRecaptcha = vi.fn().mockResolvedValue({ success: true })
const mockRepositoryCreate = vi.fn()
const mockRepositoryByIdWithAccess = vi.fn()
const mockAttachHiddenReviewRiskProfiles = vi.fn((listing: { id: string; authorId: string }) => ({
  ...listing,
  authorRiskProfile: null,
  submissionRiskProfile: null,
}))
const mockAttachReviewRiskProfile = vi.fn(
  async (_prisma: unknown, listing: { id: string; authorId: string }) => ({
    ...listing,
    authorRiskProfile: { authorId: listing.authorId, signals: [], highestSeverity: null },
    submissionRiskProfile: { listingId: listing.id, signals: [], highestSeverity: null },
  }),
)
const mockGetActiveAuthorBansForReviewRisk = vi.fn().mockResolvedValue([])

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: (...args: unknown[]) => mockApplyTrustAction(...args),
  TrustService: vi.fn().mockImplementation(function MockTrustService() {
    return {
      logAction: mockLogAction,
      reverseLogAction: mockReverseLogAction,
    }
  }),
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
  verifyRecaptcha: (...args: unknown[]) => mockVerifyRecaptcha(...args),
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

vi.mock('@/server/services/review-risk.service', () => ({
  attachHiddenReviewRiskProfiles: mockAttachHiddenReviewRiskProfiles,
  attachReviewRiskProfile: mockAttachReviewRiskProfile,
  getActiveAuthorBansForReviewRisk: mockGetActiveAuthorBansForReviewRisk,
}))

vi.mock('@/server/utils/security-validation', () => ({
  validatePagination: vi.fn((page, limit, max) => ({ page: page ?? 1, limit: limit ?? max ?? 20 })),
  sanitizeInput: vi.fn((s: string) => s),
}))

vi.mock('@/server/repositories/listings.repository', () => ({
  ListingsRepository: vi.fn().mockImplementation(function MockListingsRepository() {
    return {
      byIdWithAccess: mockRepositoryByIdWithAccess,
      create: mockRepositoryCreate,
      getExistingVote: vi.fn().mockResolvedValue(null),
    }
  }),
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
    game: {
      findUnique: vi.fn().mockResolvedValue({ systemId: '00000000-0000-4000-a000-000000000040' }),
    },
  }

  return {
    ...mockTx,
    $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
  }
}

type MockPrisma = ReturnType<typeof createMockPrisma>

function createCaller(
  overrides: { userId?: string; role?: Role; permissions?: string[]; prisma?: MockPrisma } = {},
) {
  const prisma = overrides.prisma ?? createMockPrisma()
  return {
    caller: coreRouter.createCaller({
      session: {
        user: {
          id: overrides.userId ?? USER_ID,
          email: 'test@test.com',
          name: 'Test User',
          role: overrides.role ?? Role.USER,
          permissions: overrides.permissions ?? [],
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

  describe('create', () => {
    it('verifies recaptcha before creating a handheld listing', async () => {
      mockRepositoryCreate.mockResolvedValue({
        id: LISTING_ID,
        status: ApprovalStatus.PENDING,
      })

      const { caller } = createCaller({ permissions: [PERMISSIONS.CREATE_LISTING] })

      await caller.create({
        gameId: '00000000-0000-4000-a000-000000000030',
        deviceId: '00000000-0000-4000-a000-000000000031',
        emulatorId: '00000000-0000-4000-a000-000000000032',
        performanceId: 1,
        recaptchaToken: 'valid-token',
      })

      expect(mockVerifyRecaptcha).toHaveBeenCalledWith({
        token: 'valid-token',
        expectedAction: 'create_listing',
        userIP: expect.any(String),
      })
      expect(mockRepositoryCreate).toHaveBeenCalled()
    })

    it('does not create a handheld listing when recaptcha verification fails', async () => {
      mockVerifyRecaptcha.mockResolvedValueOnce({
        success: false,
        error: 'Missing reCAPTCHA token',
      })

      const { caller } = createCaller({ permissions: [PERMISSIONS.CREATE_LISTING] })

      await expect(
        caller.create({
          gameId: '00000000-0000-4000-a000-000000000030',
          deviceId: '00000000-0000-4000-a000-000000000031',
          emulatorId: '00000000-0000-4000-a000-000000000032',
          performanceId: 1,
        }),
      ).rejects.toThrow(/CAPTCHA/)

      expect(mockRepositoryCreate).not.toHaveBeenCalled()
      expect(mockApplyTrustAction).not.toHaveBeenCalled()
    })
  })

  describe('byId', () => {
    it('hides review risk profiles for non-reviewers', async () => {
      const listing = {
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        customFieldValues: [],
      }
      mockRepositoryByIdWithAccess.mockResolvedValueOnce(listing)
      const { caller } = createCaller()

      const result = await caller.byId({ id: LISTING_ID })

      expect(mockRepositoryByIdWithAccess).toHaveBeenCalledWith(LISTING_ID, USER_ID, false)
      expect(mockAttachHiddenReviewRiskProfiles).toHaveBeenCalledWith(listing)
      expect(mockGetActiveAuthorBansForReviewRisk).not.toHaveBeenCalled()
      expect(result).toMatchObject({
        id: LISTING_ID,
        authorRiskProfile: null,
        submissionRiskProfile: null,
      })
    })

    it('attaches review risk profiles for moderators viewing detail pages', async () => {
      const listing = {
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        customFieldValues: [],
      }
      mockRepositoryByIdWithAccess.mockResolvedValueOnce(listing)
      mockGetActiveAuthorBansForReviewRisk.mockResolvedValueOnce([{ reason: 'Spam' }])
      const { caller, prisma } = createCaller({ role: Role.MODERATOR })

      await caller.byId({ id: LISTING_ID })

      expect(mockRepositoryByIdWithAccess).toHaveBeenCalledWith(LISTING_ID, USER_ID, true)
      expect(mockGetActiveAuthorBansForReviewRisk).toHaveBeenCalledWith(prisma, AUTHOR_ID)
      expect(mockAttachReviewRiskProfile).toHaveBeenCalledWith(prisma, listing, {
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        author: { userBans: [{ reason: 'Spam' }] },
        customFieldValues: [],
      })
    })
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
