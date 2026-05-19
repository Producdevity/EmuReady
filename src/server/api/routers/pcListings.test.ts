import { describe, expect, it, beforeEach, vi } from 'vitest'
import { RISK_SIGNAL_TYPES } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES } from '@/schemas/submissionRisk'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, PcOs, Role, TrustAction } from '@orm'
import type * as AuthorRiskService from '@/server/services/author-risk.service'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockApplyTrustAction = vi.fn().mockResolvedValue(undefined)
const mockHandleListingVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockHandleCommentVoteTrustEffects = vi.fn().mockResolvedValue(undefined)
const mockLogAction = vi.fn().mockResolvedValue(undefined)
const mockComputeAuthorRiskProfiles = vi.fn().mockResolvedValue(new Map())
const mockComputeSubmissionRiskProfiles = vi.fn().mockResolvedValue(new Map())

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: (...args: unknown[]) => mockApplyTrustAction(...args),
  TrustService: vi.fn().mockImplementation(function MockTrustService() {
    return { logAction: mockLogAction }
  }),
}))

vi.mock('@/server/utils/vote-trust-effects', () => ({
  handleListingVoteTrustEffects: (...args: unknown[]) => mockHandleListingVoteTrustEffects(...args),
  handleCommentVoteTrustEffects: (...args: unknown[]) => mockHandleCommentVoteTrustEffects(...args),
  handleVoteTrustEffects: vi.fn(),
}))

vi.mock('@/server/utils/vote-counts', () => ({
  updatePcListingVoteCounts: vi.fn().mockResolvedValue(undefined),
}))

const mockEmitNotificationEvent = vi.fn()
vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: mockEmitNotificationEvent },
  NOTIFICATION_EVENTS: {
    LISTING_VOTED: 'LISTING_VOTED',
    COMMENT_VOTED: 'COMMENT_VOTED',
    PC_LISTING_APPROVED: 'PC_LISTING_APPROVED',
    PC_LISTING_REJECTED: 'PC_LISTING_REJECTED',
  },
}))

const mockVerifyRecaptcha = vi.fn().mockResolvedValue({ success: true })
vi.mock('@/lib/captcha/verify', () => ({
  verifyRecaptcha: (...args: unknown[]) => mockVerifyRecaptcha(...args),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/lib/captcha/config', () => ({
  RECAPTCHA_CONFIG: { actions: { CREATE_LISTING: 'create_listing', VOTE: 'VOTE' } },
}))

vi.mock('@/server/utils/query-builders', () => ({
  isUserBanned: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/server/utils/cache', () => ({
  listingStatsCache: { delete: vi.fn() },
}))

vi.mock('@/server/cache/invalidation', () => ({
  invalidateListPages: vi.fn().mockResolvedValue(undefined),
  invalidateSitemap: vi.fn().mockResolvedValue(undefined),
  revalidateByTag: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: { vote: vi.fn(), commentVote: vi.fn() },
    listing: { created: vi.fn() },
  },
}))

vi.mock('@/server/services/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/services/author-risk.service', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthorRiskService>()

  return {
    computeAuthorRiskProfiles: (...args: unknown[]) => mockComputeAuthorRiskProfiles(...args),
    createExistingAuthorBansMap: actual.createExistingAuthorBansMap,
  }
})

vi.mock('@/server/services/submission-risk.service', () => ({
  computeSubmissionRiskProfiles: (...args: unknown[]) => mockComputeSubmissionRiskProfiles(...args),
}))

vi.mock('@/server/api/utils/pinPermissions', () => ({
  canManageCommentPins: vi.fn().mockReturnValue(false),
}))

vi.mock('@/server/utils/security-validation', () => ({
  validatePagination: vi.fn((page, limit, max) => ({ page: page ?? 1, limit: limit ?? max ?? 20 })),
}))

const mockRepositoryCreate = vi.fn()
const mockRepositoryGetById = vi.fn()
const mockRepositoryGetByIdWithDetails = vi.fn()
const mockRepositoryApprove = vi.fn()
const mockRepositoryReject = vi.fn()
const mockRepositoryGetExistingVote = vi.fn()
const mockIsDeveloperVerified = vi.fn()
const mockRepositoryGetPendingListings = vi.fn()
const mockRepositoryGetPendingListingRiskCandidates = vi.fn()
const mockRepositoryGetPendingListingsByIds = vi.fn()
const mockRepositoryGetVerifiedEmulatorIds = vi.fn()

vi.mock('@/server/repositories/pc-listings.repository', () => ({
  PcListingsRepository: vi.fn().mockImplementation(function MockPcListingsRepository() {
    return {
      create: mockRepositoryCreate,
      getById: mockRepositoryGetById,
      getByIdWithDetails: mockRepositoryGetByIdWithDetails,
      approve: mockRepositoryApprove,
      reject: mockRepositoryReject,
      getExistingVote: mockRepositoryGetExistingVote,
      isDeveloperVerifiedForEmulator: mockIsDeveloperVerified,
      getPendingListings: mockRepositoryGetPendingListings,
      getPendingListingRiskCandidates: mockRepositoryGetPendingListingRiskCandidates,
      getPendingListingsByIds: mockRepositoryGetPendingListingsByIds,
      getVerifiedEmulatorIds: mockRepositoryGetVerifiedEmulatorIds,
      list: vi.fn().mockResolvedValue({ pcListings: [], pagination: {} }),
      getUserVote: vi.fn().mockResolvedValue(null),
    }
  }),
}))

vi.mock('@/server/repositories/user-pc-presets.repository', () => ({
  UserPcPresetsRepository: vi.fn().mockImplementation(function MockUserPcPresetsRepository() {
    return {}
  }),
}))

const { pcListingsRouter } = await import('./pcListings')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const ADMIN_ID = '00000000-0000-4000-a000-000000000003'
const CLEAN_AUTHOR_ID = '00000000-0000-4000-a000-000000000004'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const LISTING_ID_B = '00000000-0000-4000-a000-000000000011'
const LISTING_ID_C = '00000000-0000-4000-a000-000000000012'
const COMMENT_ID = '00000000-0000-4000-a000-000000000020'

function createMockPrisma() {
  const mockTx = {
    pcListingVote: {
      create: vi.fn().mockResolvedValue({ userId: USER_ID, pcListingId: LISTING_ID, value: true }),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({ userId: USER_ID, pcListingId: LISTING_ID, value: false }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    pcListingCommentVote: {
      create: vi.fn().mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: true }),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({ userId: USER_ID, commentId: COMMENT_ID, value: false }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    pcListingComment: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: COMMENT_ID, score: 1 }),
    },
    pcListing: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    userBan: {
      findMany: vi.fn().mockResolvedValue([]),
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
    caller: pcListingsRouter.createCaller({
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

describe('pcListings trust integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRepositoryGetExistingVote.mockResolvedValue(null)
    mockRepositoryGetByIdWithDetails.mockResolvedValue(null)
    mockRepositoryGetVerifiedEmulatorIds.mockResolvedValue([])
    mockRepositoryGetPendingListings.mockResolvedValue({
      pcListings: [],
      pagination: { total: 0, pages: 0, page: 1, offset: 0, limit: 20 },
    })
    mockRepositoryGetPendingListingRiskCandidates.mockResolvedValue([])
    mockRepositoryGetPendingListingsByIds.mockResolvedValue([])
    mockComputeAuthorRiskProfiles.mockResolvedValue(new Map())
    mockComputeSubmissionRiskProfiles.mockResolvedValue(new Map())
  })

  describe('vote', () => {
    it('calls handleListingVoteTrustEffects with listingType pc on new vote', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })
      await caller.vote({ pcListingId: LISTING_ID, value: true })

      expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'created',
          currentValue: true,
          previousValue: null,
          userId: USER_ID,
          listingId: LISTING_ID,
          listingType: 'pc',
          authorId: AUTHOR_ID,
          tx: expect.any(Object),
        }),
      )
    })

    it('calls handleListingVoteTrustEffects with action deleted on vote toggle', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })
      // Simulate an existing upvote inside the transaction.
      prisma.pcListingVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        pcListingId: LISTING_ID,
        value: true,
      })

      await caller.vote({ pcListingId: LISTING_ID, value: true })

      expect(mockHandleListingVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'deleted',
          previousValue: true,
          listingType: 'pc',
        }),
      )
    })

    it('fetches existingVote via the transaction client, not the repository', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.vote({ pcListingId: LISTING_ID, value: true })

      expect(prisma.pcListingVote.findUnique).toHaveBeenCalledWith({
        where: { userId_pcListingId: { userId: USER_ID, pcListingId: LISTING_ID } },
      })
      expect(mockRepositoryGetExistingVote).not.toHaveBeenCalled()
    })

    it('emits LISTING_VOTED on a new vote', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.vote({ pcListingId: LISTING_ID, value: true })

      expect(mockEmitNotificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'LISTING_VOTED',
          entityType: 'pcListing',
          entityId: LISTING_ID,
          payload: expect.objectContaining({ voteValue: true }),
        }),
      )
    })

    it('emits LISTING_VOTED on a vote direction change', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })
      prisma.pcListingVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        pcListingId: LISTING_ID,
        value: true,
      })

      await caller.vote({ pcListingId: LISTING_ID, value: false })

      expect(mockEmitNotificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'LISTING_VOTED',
          payload: expect.objectContaining({ voteValue: false }),
        }),
      )
    })

    it('does NOT emit LISTING_VOTED on toggle-off (delete)', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })
      prisma.pcListingVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        pcListingId: LISTING_ID,
        value: true,
      })

      await caller.vote({ pcListingId: LISTING_ID, value: true })

      expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
    })

    it('verifies recaptcha when token is provided', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.vote({
        pcListingId: LISTING_ID,
        value: true,
        recaptchaToken: 'valid-token',
      })

      expect(mockVerifyRecaptcha).toHaveBeenCalledWith({
        token: 'valid-token',
        expectedAction: 'VOTE',
        userIP: expect.any(String),
      })
    })

    it('throws CAPTCHA error when recaptcha verification fails', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })
      mockVerifyRecaptcha.mockResolvedValueOnce({ success: false, error: 'invalid-token' })

      // AppError.captcha throws a TRPCError; assert the procedure rejects.
      await expect(
        caller.vote({
          pcListingId: LISTING_ID,
          value: true,
          recaptchaToken: 'bad-token',
        }),
      ).rejects.toThrow(/CAPTCHA/)

      // Vote write must NOT have happened
      expect(prisma.pcListingVote.create).not.toHaveBeenCalled()
      expect(prisma.pcListingVote.update).not.toHaveBeenCalled()
      expect(prisma.pcListingVote.delete).not.toHaveBeenCalled()
    })

    it('proceeds without verifying recaptcha when no token provided (optional)', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.vote({ pcListingId: LISTING_ID, value: true })

      expect(mockVerifyRecaptcha).not.toHaveBeenCalled()
      expect(prisma.pcListingVote.create).toHaveBeenCalled()
    })
  })

  describe('voteComment notifications', () => {
    function setupComment(prisma: MockPrisma) {
      prisma.pcListingComment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        pcListingId: LISTING_ID,
      })
      prisma.pcListingComment.update.mockResolvedValue({ id: COMMENT_ID, score: 1 })
    }

    it('emits COMMENT_VOTED on a new upvote', async () => {
      const { caller, prisma } = createCaller()
      setupComment(prisma)

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockEmitNotificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'COMMENT_VOTED',
          entityType: 'comment',
          entityId: COMMENT_ID,
          payload: expect.objectContaining({
            commentId: COMMENT_ID,
            pcListingId: LISTING_ID,
            voteValue: true,
          }),
        }),
      )
    })

    it('emits COMMENT_VOTED on a vote change', async () => {
      const { caller, prisma } = createCaller()
      setupComment(prisma)
      prisma.pcListingCommentVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        commentId: COMMENT_ID,
        value: true,
      })

      await caller.voteComment({ commentId: COMMENT_ID, value: false })

      expect(mockEmitNotificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'COMMENT_VOTED',
          payload: expect.objectContaining({ voteValue: false }),
        }),
      )
    })

    it('does NOT emit COMMENT_VOTED on toggle-off (remove)', async () => {
      const { caller, prisma } = createCaller()
      setupComment(prisma)
      prisma.pcListingCommentVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        commentId: COMMENT_ID,
        value: true,
      })

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('calls applyTrustAction with LISTING_CREATED after creation', async () => {
      const newListingId = '00000000-0000-4000-a000-000000000099'
      mockRepositoryCreate.mockResolvedValue({
        id: newListingId,
        status: ApprovalStatus.PENDING,
      })

      const { caller } = createCaller({ permissions: [PERMISSIONS.CREATE_LISTING] })

      await caller.create({
        gameId: '00000000-0000-4000-a000-000000000030',
        cpuId: '00000000-0000-4000-a000-000000000031',
        emulatorId: '00000000-0000-4000-a000-000000000032',
        performanceId: 1,
        memorySize: 16,
        os: PcOs.WINDOWS,
        osVersion: '11',
      })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: USER_ID,
        action: TrustAction.LISTING_CREATED,
        context: { pcListingId: newListingId },
      })
    })

    it('verifies recaptcha before creating a PC listing', async () => {
      const newListingId = '00000000-0000-4000-a000-000000000099'
      mockRepositoryCreate.mockResolvedValue({
        id: newListingId,
        status: ApprovalStatus.PENDING,
      })

      const { caller } = createCaller({ permissions: [PERMISSIONS.CREATE_LISTING] })

      await caller.create({
        gameId: '00000000-0000-4000-a000-000000000030',
        cpuId: '00000000-0000-4000-a000-000000000031',
        emulatorId: '00000000-0000-4000-a000-000000000032',
        performanceId: 1,
        memorySize: 16,
        os: PcOs.WINDOWS,
        osVersion: '11',
        recaptchaToken: 'valid-token',
      })

      expect(mockVerifyRecaptcha).toHaveBeenCalledWith({
        token: 'valid-token',
        expectedAction: 'create_listing',
        userIP: expect.any(String),
      })
      expect(mockRepositoryCreate).toHaveBeenCalled()
    })

    it('does not create a PC listing when recaptcha verification fails', async () => {
      mockVerifyRecaptcha.mockResolvedValueOnce({
        success: false,
        error: 'Missing reCAPTCHA token',
      })

      const { caller } = createCaller({ permissions: [PERMISSIONS.CREATE_LISTING] })

      await expect(
        caller.create({
          gameId: '00000000-0000-4000-a000-000000000030',
          cpuId: '00000000-0000-4000-a000-000000000031',
          emulatorId: '00000000-0000-4000-a000-000000000032',
          performanceId: 1,
          memorySize: 16,
          os: PcOs.WINDOWS,
          osVersion: '11',
        }),
      ).rejects.toThrow(/CAPTCHA/)

      expect(mockRepositoryCreate).not.toHaveBeenCalled()
      expect(mockApplyTrustAction).not.toHaveBeenCalled()
    })
  })

  describe('byId', () => {
    it('hides review risk profiles for non-reviewers', async () => {
      mockRepositoryGetByIdWithDetails.mockResolvedValueOnce({
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        customFieldValues: [],
      })
      const { caller, prisma } = createCaller()

      const result = await caller.byId({ id: LISTING_ID })

      expect(mockRepositoryGetByIdWithDetails).toHaveBeenCalledWith(LISTING_ID, false, USER_ID)
      expect(prisma.userBan.findMany).not.toHaveBeenCalled()
      expect(result).toMatchObject({
        id: LISTING_ID,
        authorRiskProfile: null,
        submissionRiskProfile: null,
      })
    })

    it('attaches review risk profiles for moderators viewing detail pages', async () => {
      const pcListing = {
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        customFieldValues: [],
      }
      mockRepositoryGetByIdWithDetails.mockResolvedValueOnce(pcListing)
      const { caller, prisma } = createCaller({ role: Role.MODERATOR })
      prisma.userBan.findMany.mockResolvedValueOnce([{ reason: 'Spam' }])
      mockComputeAuthorRiskProfiles.mockResolvedValueOnce(
        new Map([[AUTHOR_ID, { authorId: AUTHOR_ID, signals: [], highestSeverity: null }]]),
      )
      mockComputeSubmissionRiskProfiles.mockResolvedValueOnce(
        new Map([[LISTING_ID, { listingId: LISTING_ID, signals: [], highestSeverity: null }]]),
      )

      const result = await caller.byId({ id: LISTING_ID })

      expect(mockRepositoryGetByIdWithDetails).toHaveBeenCalledWith(LISTING_ID, true, USER_ID)
      expect(prisma.userBan.findMany).toHaveBeenCalledWith({
        where: {
          userId: AUTHOR_ID,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        select: { reason: true },
      })
      expect(mockComputeAuthorRiskProfiles).toHaveBeenCalledWith(
        prisma,
        [AUTHOR_ID],
        new Map([[AUTHOR_ID, [{ reason: 'Spam' }]]]),
      )
      expect(result).toMatchObject({
        id: LISTING_ID,
        authorRiskProfile: { authorId: AUTHOR_ID },
        submissionRiskProfile: { listingId: LISTING_ID },
      })
    })
  })

  describe('pending', () => {
    it('loads pending PC listings directly when risk filter is all', async () => {
      const listing = {
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        author: { id: AUTHOR_ID, name: 'Pending Author', userBans: [] },
      }
      mockRepositoryGetPendingListings.mockResolvedValueOnce({
        pcListings: [listing],
        pagination: { total: 1, pages: 1, page: 1, offset: 0, limit: 20 },
      })

      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })

      const result = await caller.pending({ riskFilter: 'all', page: 1, limit: 20 })

      expect(mockRepositoryGetPendingListings).toHaveBeenCalledWith({
        emulatorIds: undefined,
        search: undefined,
        page: 1,
        limit: 20,
        sortField: undefined,
        sortDirection: 'asc',
      })
      expect(mockRepositoryGetPendingListingRiskCandidates).not.toHaveBeenCalled()
      expect(mockRepositoryGetPendingListingsByIds).not.toHaveBeenCalled()
      expect(result.pcListings).toHaveLength(1)
      expect(result.pcListings[0].id).toBe(LISTING_ID)
      expect(result.pagination.total).toBe(1)
    })

    it('uses the direct pending path when risk filter is omitted', async () => {
      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })

      const result = await caller.pending({ page: 1, limit: 20 })

      expect(mockRepositoryGetPendingListings).toHaveBeenCalledWith({
        emulatorIds: undefined,
        search: undefined,
        page: 1,
        limit: 20,
        sortField: undefined,
        sortDirection: 'asc',
      })
      expect(mockRepositoryGetPendingListingRiskCandidates).not.toHaveBeenCalled()
      expect(mockRepositoryGetPendingListingsByIds).not.toHaveBeenCalled()
      expect(result.pcListings).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('filters to review-risk PC listings when riskFilter is risky', async () => {
      const submissionRiskListing = {
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        author: { id: AUTHOR_ID, name: 'Submission Risk Author', userBans: [] },
      }
      const authorRiskListing = {
        id: LISTING_ID_B,
        authorId: USER_ID,
        author: { id: USER_ID, name: 'Author Risk Author', userBans: [] },
      }
      const cleanListing = {
        id: LISTING_ID_C,
        authorId: CLEAN_AUTHOR_ID,
        author: { id: CLEAN_AUTHOR_ID, name: 'Clean Author', userBans: [] },
      }

      mockRepositoryGetPendingListingRiskCandidates.mockResolvedValue([
        submissionRiskListing,
        authorRiskListing,
        cleanListing,
      ])
      mockRepositoryGetPendingListingsByIds.mockResolvedValue([
        submissionRiskListing,
        authorRiskListing,
      ])
      mockComputeAuthorRiskProfiles.mockResolvedValue(
        new Map([
          [AUTHOR_ID, { authorId: AUTHOR_ID, signals: [], highestSeverity: null }],
          [
            USER_ID,
            {
              authorId: USER_ID,
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.NEW_AUTHOR,
                  severity: 'low',
                  label: 'New Author',
                  description: 'No previously approved listings',
                },
              ],
              highestSeverity: 'low',
            },
          ],
          [CLEAN_AUTHOR_ID, { authorId: CLEAN_AUTHOR_ID, signals: [], highestSeverity: null }],
        ]),
      )
      mockComputeSubmissionRiskProfiles.mockResolvedValue(
        new Map([
          [
            LISTING_ID,
            {
              listingId: LISTING_ID,
              signals: [
                {
                  type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
                  severity: 'high',
                  label: 'Placeholder Emulator Version',
                  description: 'Submitted emulator version resembles placeholder text.',
                },
              ],
              highestSeverity: 'high',
            },
          ],
          [LISTING_ID_B, { listingId: LISTING_ID_B, signals: [], highestSeverity: null }],
          [LISTING_ID_C, { listingId: LISTING_ID_C, signals: [], highestSeverity: null }],
        ]),
      )

      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })

      const result = await caller.pending({ riskFilter: 'risky', page: 1, limit: 20 })

      expect(mockRepositoryGetPendingListingRiskCandidates).toHaveBeenCalledWith({
        emulatorIds: undefined,
        search: undefined,
        sortField: undefined,
        sortDirection: 'asc',
      })
      expect(mockRepositoryGetPendingListingsByIds).toHaveBeenCalledWith(
        [LISTING_ID, LISTING_ID_B],
        {
          emulatorIds: undefined,
          search: undefined,
        },
      )
      expect(mockRepositoryGetPendingListings).not.toHaveBeenCalled()
      expect(result.pcListings).toHaveLength(2)
      expect(result.pcListings[0].id).toBe(LISTING_ID)
      expect(result.pcListings[0].submissionRiskProfile.highestSeverity).toBe('high')
      expect(result.pcListings[1].id).toBe(LISTING_ID_B)
      expect(result.pcListings[1].authorRiskProfile.highestSeverity).toBe('low')
      expect(result.pagination.total).toBe(2)
    })

    it('returns an empty page when no risk-only PC listing candidates are risky', async () => {
      const cleanListing = {
        id: LISTING_ID_C,
        authorId: CLEAN_AUTHOR_ID,
        author: { id: CLEAN_AUTHOR_ID, name: 'Clean Author', userBans: [] },
      }
      mockRepositoryGetPendingListingRiskCandidates.mockResolvedValueOnce([cleanListing])
      mockComputeAuthorRiskProfiles.mockResolvedValue(
        new Map([
          [CLEAN_AUTHOR_ID, { authorId: CLEAN_AUTHOR_ID, signals: [], highestSeverity: null }],
        ]),
      )
      mockComputeSubmissionRiskProfiles.mockResolvedValue(
        new Map([[LISTING_ID_C, { listingId: LISTING_ID_C, signals: [], highestSeverity: null }]]),
      )

      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })

      const result = await caller.pending({ riskFilter: 'risky', page: 1, limit: 20 })

      expect(mockRepositoryGetPendingListingsByIds).not.toHaveBeenCalled()
      expect(result.pcListings).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('approve', () => {
    it('calls applyTrustAction with LISTING_APPROVED for author', async () => {
      mockRepositoryGetById.mockResolvedValue({
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        status: ApprovalStatus.PENDING,
        emulatorId: '00000000-0000-4000-a000-000000000060',
      })
      mockRepositoryApprove.mockResolvedValue({
        id: LISTING_ID,
        status: ApprovalStatus.APPROVED,
      })

      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })

      await caller.approve({ pcListingId: LISTING_ID })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_APPROVED,
        context: {
          pcListingId: LISTING_ID,
          adminUserId: ADMIN_ID,
          reason: 'listing_approved',
        },
      })
    })
  })

  describe('reject', () => {
    it('calls applyTrustAction with LISTING_REJECTED for author', async () => {
      mockRepositoryGetById.mockResolvedValue({
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        status: ApprovalStatus.PENDING,
        emulatorId: '00000000-0000-4000-a000-000000000060',
      })
      mockRepositoryReject.mockResolvedValue({
        id: LISTING_ID,
        status: ApprovalStatus.REJECTED,
      })

      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })

      await caller.reject({ pcListingId: LISTING_ID, notes: 'Incomplete report' })

      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_REJECTED,
        context: {
          pcListingId: LISTING_ID,
          adminUserId: ADMIN_ID,
          reason: 'Incomplete report',
        },
      })
    })
  })

  describe('bulkApprove', () => {
    it('calls applyTrustAction with LISTING_APPROVED for each listing author', async () => {
      const listing1 = {
        id: LISTING_ID,
        gameId: '00000000-0000-4000-a000-000000000040',
        authorId: AUTHOR_ID,
      }
      const listing2 = {
        id: '00000000-0000-4000-a000-000000000011',
        gameId: '00000000-0000-4000-a000-000000000041',
        authorId: '00000000-0000-4000-a000-000000000050',
      }

      const { caller, prisma } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })
      prisma.pcListing.findMany.mockResolvedValue([listing1, listing2])
      prisma.pcListing.updateMany.mockResolvedValue({ count: 2 })

      await caller.bulkApprove({ pcListingIds: [listing1.id, listing2.id] })

      expect(mockApplyTrustAction).toHaveBeenCalledTimes(2)
      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_APPROVED,
        context: expect.objectContaining({ pcListingId: LISTING_ID }),
      })
      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: '00000000-0000-4000-a000-000000000050',
        action: TrustAction.LISTING_APPROVED,
        context: expect.objectContaining({ pcListingId: '00000000-0000-4000-a000-000000000011' }),
      })
    })
  })

  describe('bulkReject', () => {
    it('calls applyTrustAction with LISTING_REJECTED for each listing author', async () => {
      const listing1 = { id: LISTING_ID, authorId: AUTHOR_ID }
      const listing2 = {
        id: '00000000-0000-4000-a000-000000000011',
        authorId: '00000000-0000-4000-a000-000000000050',
      }

      const { caller, prisma } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })
      prisma.pcListing.findMany.mockResolvedValue([listing1, listing2])
      prisma.pcListing.updateMany.mockResolvedValue({ count: 2 })

      await caller.bulkReject({ pcListingIds: [listing1.id, listing2.id], notes: 'Spam' })

      expect(mockApplyTrustAction).toHaveBeenCalledTimes(2)
      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_REJECTED,
        context: expect.objectContaining({
          pcListingId: LISTING_ID,
          reason: 'Spam',
        }),
      })
      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: '00000000-0000-4000-a000-000000000050',
        action: TrustAction.LISTING_REJECTED,
        context: expect.objectContaining({
          pcListingId: '00000000-0000-4000-a000-000000000011',
          reason: 'Spam',
        }),
      })
    })
  })

  describe('voteComment', () => {
    function setupCommentMocks(prisma: MockPrisma) {
      prisma.pcListingComment.findUnique.mockResolvedValue({
        id: COMMENT_ID,
        userId: AUTHOR_ID,
        pcListingId: LISTING_ID,
      })
      prisma.pcListingCommentVote.findUnique.mockResolvedValue(null)
      prisma.pcListingComment.update.mockResolvedValue({ id: COMMENT_ID, score: 1 })
    }

    it('calls handleCommentVoteTrustEffects with listingType pc on new upvote', async () => {
      const { caller, prisma } = createCaller()
      setupCommentMocks(prisma)

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          trustAction: 'upvote',
          newValue: true,
          commentAuthorId: AUTHOR_ID,
          voterId: USER_ID,
          commentId: COMMENT_ID,
          parentEntityId: LISTING_ID,
          listingType: 'pc',
        }),
      )
    })

    it('calls handleCommentVoteTrustEffects with change action on vote flip', async () => {
      const { caller, prisma } = createCaller()
      setupCommentMocks(prisma)
      prisma.pcListingCommentVote.findUnique.mockResolvedValue({
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
          listingType: 'pc',
        }),
      )
    })

    it('calls handleCommentVoteTrustEffects with remove action on vote toggle', async () => {
      const { caller, prisma } = createCaller()
      setupCommentMocks(prisma)
      prisma.pcListingCommentVote.findUnique.mockResolvedValue({
        userId: USER_ID,
        commentId: COMMENT_ID,
        value: true,
      })

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      expect(mockHandleCommentVoteTrustEffects).toHaveBeenCalledWith(
        expect.objectContaining({
          trustAction: 'remove',
          listingType: 'pc',
        }),
      )
    })

    it('fetches existingVote inside the $transaction callback', async () => {
      const { caller, prisma } = createCaller()
      setupCommentMocks(prisma)

      await caller.voteComment({ commentId: COMMENT_ID, value: true })

      const txCall = vi.mocked(prisma.$transaction).mock.invocationCallOrder[0]
      const findUniqueCall = prisma.pcListingCommentVote.findUnique.mock.invocationCallOrder[0]
      expect(txCall).toBeDefined()
      expect(findUniqueCall).toBeDefined()
      expect(findUniqueCall).toBeGreaterThan(txCall as number)
    })
  })
})
