import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RISK_SIGNAL_TYPES } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES } from '@/schemas/submissionRisk'
import {
  invalidatePcListingSeo,
  invalidatePcListingSeoForUpdate,
  invalidatePcListingsSeo,
} from '@/server/cache/invalidation'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, PcOs, Role, TrustAction } from '@orm/client'

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
    LISTING_COMMENTED: 'LISTING_COMMENTED',
    COMMENT_REPLIED: 'COMMENT_REPLIED',
    PC_LISTING_APPROVED: 'PC_LISTING_APPROVED',
    PC_LISTING_REJECTED: 'PC_LISTING_REJECTED',
  },
}))

const mockCheckSpamContent = vi.fn().mockResolvedValue(undefined)
vi.mock('@/server/utils/spam-check', () => ({
  checkSpamContent: (...args: unknown[]) => mockCheckSpamContent(...args),
}))

vi.mock('@/server/utils/query-builders', () => ({
  isUserBanned: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/server/utils/cache', () => ({
  listingStatsCache: { delete: vi.fn() },
}))

vi.mock('@/server/cache/invalidation', () => ({
  invalidatePcListingSeo: vi.fn().mockResolvedValue(undefined),
  invalidatePcListingSeoForUpdate: vi.fn().mockResolvedValue(undefined),
  invalidatePcListingsSeo: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics', () => ({
  default: {
    engagement: { comment: vi.fn(), vote: vi.fn(), commentVote: vi.fn() },
    listing: { created: vi.fn() },
  },
}))

vi.mock('@/server/services/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/services/author-risk.service', () => ({
  computeAuthorRiskProfiles: (...args: unknown[]) => mockComputeAuthorRiskProfiles(...args),
  createExistingAuthorBansMap: (
    listings: {
      authorId: string
      author?: { userBans?: { reason: string }[] | null } | null
    }[],
  ) => {
    const existingBansMap = new Map<string, { reason: string }[]>()
    for (const listing of listings) {
      const userBans = listing.author?.userBans
      if (userBans && userBans.length > 0 && !existingBansMap.has(listing.authorId)) {
        existingBansMap.set(
          listing.authorId,
          userBans.map((ban) => ({ reason: ban.reason })),
        )
      }
    }
    return existingBansMap
  },
}))

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
const HIGH_RISK_AUTHOR_ID = '00000000-0000-4000-a000-000000000005'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const LISTING_ID_B = '00000000-0000-4000-a000-000000000011'
const LISTING_ID_C = '00000000-0000-4000-a000-000000000012'
const LISTING_ID_D = '00000000-0000-4000-a000-000000000013'
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
      create: vi.fn().mockResolvedValue({
        id: COMMENT_ID,
        content: 'Runs well with these settings',
        userId: USER_ID,
        pcListingId: LISTING_ID,
        parentId: null,
        user: { id: USER_ID, name: 'Test User', profileImage: null, role: Role.USER },
      }),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: COMMENT_ID, score: 1 }),
    },
    pcListing: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
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

    it('creates a vote', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.vote({ pcListingId: LISTING_ID, value: true })

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

  describe('createComment', () => {
    it('runs spam checks before creating a PC listing comment', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.createComment({
        pcListingId: LISTING_ID,
        content: 'Runs well with these settings',
      })

      expect(mockCheckSpamContent).toHaveBeenCalledWith({
        prisma,
        userId: USER_ID,
        content: 'Runs well with these settings',
        entityType: 'pcComment',
        challengeMode: 'challenge',
        humanVerificationToken: undefined,
        headers: expect.any(Headers),
      })
      expect(prisma.pcListingComment.create).toHaveBeenCalled()
    })

    it('passes a human verification token to the spam check when retrying comment creation', async () => {
      const { caller, prisma } = createCaller()
      prisma.pcListing.findUnique.mockResolvedValue({ id: LISTING_ID, authorId: AUTHOR_ID })

      await caller.createComment({
        pcListingId: LISTING_ID,
        content: 'Amazing!! This runs perfectly!!',
        humanVerificationToken: 'verification-token',
      })

      expect(mockCheckSpamContent).toHaveBeenCalledWith({
        prisma,
        userId: USER_ID,
        content: 'Amazing!! This runs perfectly!!',
        entityType: 'pcComment',
        challengeMode: 'challenge',
        humanVerificationToken: 'verification-token',
        headers: expect.any(Headers),
      })
      expect(prisma.pcListingComment.create).toHaveBeenCalled()
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

    it('runs spam checks before creating a PC listing', async () => {
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

      expect(mockCheckSpamContent).toHaveBeenCalledWith({
        prisma: expect.anything(),
        userId: USER_ID,
        content: '',
        entityType: 'pcListing',
        challengeMode: 'challenge',
        humanVerificationToken: undefined,
        headers: expect.any(Headers),
      })
      expect(mockRepositoryCreate).toHaveBeenCalled()
    })

    it('passes a human verification token to the spam check when retrying creation', async () => {
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
        notes: 'Amazing!! This runs perfectly!!',
        humanVerificationToken: 'verification-token',
      })

      expect(mockCheckSpamContent).toHaveBeenCalledWith({
        prisma: expect.anything(),
        userId: USER_ID,
        content: 'Amazing!! This runs perfectly!!',
        entityType: 'pcListing',
        challengeMode: 'challenge',
        humanVerificationToken: 'verification-token',
        headers: expect.any(Headers),
      })
      expect(mockRepositoryCreate).toHaveBeenCalled()
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

  describe('updateAdmin', () => {
    it('invalidates public SEO when an admin update approves a PC report', async () => {
      const gameId = '00000000-0000-4000-a000-000000000040'
      const cpuId = '00000000-0000-4000-a000-000000000070'
      const emulatorId = '00000000-0000-4000-a000-000000000060'
      const updatedListing = {
        id: LISTING_ID,
        gameId,
        cpuId,
        gpuId: null,
        status: ApprovalStatus.APPROVED,
      }

      const { caller, prisma } = createCaller({
        userId: ADMIN_ID,
        role: Role.MODERATOR,
        permissions: [PERMISSIONS.APPROVE_LISTINGS],
      })
      prisma.pcListing.findUnique.mockResolvedValue({
        id: LISTING_ID,
        gameId,
        cpuId,
        gpuId: null,
        status: ApprovalStatus.PENDING,
        customFieldValues: [],
      })
      prisma.pcListing.update.mockResolvedValue(updatedListing)

      await caller.updateAdmin({
        id: LISTING_ID,
        gameId,
        cpuId,
        emulatorId,
        performanceId: 1,
        memorySize: 16,
        os: PcOs.WINDOWS,
        osVersion: '11',
        notes: 'Updated report',
        status: ApprovalStatus.APPROVED,
      })

      expect(invalidatePcListingSeo).toHaveBeenCalledWith({
        id: LISTING_ID,
        gameId,
        cpuId,
        gpuId: null,
      })
      expect(invalidatePcListingSeoForUpdate).not.toHaveBeenCalled()
    })
  })

  describe('bulkApprove', () => {
    it('calls applyTrustAction with LISTING_APPROVED for each listing author', async () => {
      const listing1 = {
        id: LISTING_ID,
        gameId: '00000000-0000-4000-a000-000000000040',
        cpuId: '00000000-0000-4000-a000-000000000070',
        gpuId: '00000000-0000-4000-a000-000000000080',
        authorId: AUTHOR_ID,
      }
      const listing2 = {
        id: '00000000-0000-4000-a000-000000000011',
        gameId: '00000000-0000-4000-a000-000000000041',
        cpuId: '00000000-0000-4000-a000-000000000071',
        gpuId: null,
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
      expect(invalidatePcListingsSeo).toHaveBeenCalledWith([listing1, listing2])
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

  describe('autoRejectRisky', () => {
    it('rejects pending PC reports with high author risk or high submission risk with author risk', async () => {
      const highSubmissionOnlyListing = {
        id: LISTING_ID,
        authorId: CLEAN_AUTHOR_ID,
        author: { userBans: [] },
        customFieldValues: [],
      }
      const authorRiskOnlyListing = {
        id: LISTING_ID_B,
        authorId: AUTHOR_ID,
        author: { userBans: [] },
        customFieldValues: [],
      }
      const matchingListing = {
        id: LISTING_ID_C,
        authorId: AUTHOR_ID,
        author: { userBans: [] },
        customFieldValues: [],
      }
      const highAuthorRiskOnlyListing = {
        id: LISTING_ID_D,
        authorId: HIGH_RISK_AUTHOR_ID,
        author: { userBans: [] },
        customFieldValues: [],
      }

      mockRepositoryGetPendingListingRiskCandidates.mockResolvedValueOnce([
        highSubmissionOnlyListing,
        authorRiskOnlyListing,
        matchingListing,
        highAuthorRiskOnlyListing,
      ])
      mockComputeAuthorRiskProfiles.mockResolvedValue(
        new Map([
          [CLEAN_AUTHOR_ID, { authorId: CLEAN_AUTHOR_ID, signals: [], highestSeverity: null }],
          [
            AUTHOR_ID,
            {
              authorId: AUTHOR_ID,
              highestSeverity: 'low',
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.NEW_AUTHOR,
                  severity: 'low',
                  label: 'New Author',
                  description: 'No previously approved listings',
                },
              ],
            },
          ],
          [
            HIGH_RISK_AUTHOR_ID,
            {
              authorId: HIGH_RISK_AUTHOR_ID,
              highestSeverity: 'high',
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.ACTIVE_BAN,
                  severity: 'high',
                  label: 'Active Ban',
                  description: 'Banned for spam',
                },
              ],
            },
          ],
        ]),
      )
      mockComputeSubmissionRiskProfiles.mockResolvedValue(
        new Map([
          [
            LISTING_ID,
            {
              listingId: LISTING_ID,
              highestSeverity: 'high',
              signals: [
                {
                  type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
                  severity: 'high',
                  label: 'Placeholder Emulator Version',
                  description: 'Submitted emulator version resembles placeholder text.',
                },
              ],
            },
          ],
          [LISTING_ID_B, { listingId: LISTING_ID_B, signals: [], highestSeverity: null }],
          [
            LISTING_ID_C,
            {
              listingId: LISTING_ID_C,
              highestSeverity: 'high',
              signals: [
                {
                  type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
                  severity: 'high',
                  label: 'Placeholder Emulator Version',
                  description: 'Submitted emulator version resembles placeholder text.',
                },
              ],
            },
          ],
        ]),
      )

      const { caller, prisma } = createCaller({ userId: ADMIN_ID, role: Role.ADMIN })
      prisma.pcListing.findMany.mockResolvedValueOnce([
        { id: LISTING_ID_C, authorId: AUTHOR_ID },
        { id: LISTING_ID_D, authorId: HIGH_RISK_AUTHOR_ID },
      ])
      prisma.pcListing.updateMany.mockResolvedValue({ count: 1 })

      const result = await caller.autoRejectRisky()

      expect(mockRepositoryGetPendingListingRiskCandidates).toHaveBeenCalledWith({})
      expect(prisma.pcListing.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [LISTING_ID_C, LISTING_ID_D] },
          status: ApprovalStatus.PENDING,
        },
        select: { id: true, authorId: true },
      })
      expect(prisma.pcListing.updateMany).toHaveBeenCalledTimes(2)
      expect(prisma.pcListing.updateMany).toHaveBeenCalledWith({
        where: { id: LISTING_ID_C, status: ApprovalStatus.PENDING },
        data: expect.objectContaining({
          status: ApprovalStatus.REJECTED,
          processedByUserId: ADMIN_ID,
          processedNotes:
            'Automatically rejected by review risk bulk action: submission risk high severity; author risk low severity (1 signal).',
        }),
      })
      expect(prisma.pcListing.updateMany).toHaveBeenCalledWith({
        where: { id: LISTING_ID_D, status: ApprovalStatus.PENDING },
        data: expect.objectContaining({
          status: ApprovalStatus.REJECTED,
          processedByUserId: ADMIN_ID,
          processedNotes:
            'Automatically rejected by review risk bulk action: author risk high severity (1 signal).',
        }),
      })
      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: AUTHOR_ID,
        action: TrustAction.LISTING_REJECTED,
        context: expect.objectContaining({
          pcListingId: LISTING_ID_C,
          reason:
            'Automatically rejected by review risk bulk action: submission risk high severity; author risk low severity (1 signal).',
        }),
      })
      expect(mockApplyTrustAction).toHaveBeenCalledWith({
        userId: HIGH_RISK_AUTHOR_ID,
        action: TrustAction.LISTING_REJECTED,
        context: expect.objectContaining({
          pcListingId: LISTING_ID_D,
          reason:
            'Automatically rejected by review risk bulk action: author risk high severity (1 signal).',
        }),
      })
      expect(result).toMatchObject({
        success: true,
        rejectedCount: 2,
        skippedCount: 0,
      })
    })

    it('skips automatic PC risk rejection if a report is no longer pending at update time', async () => {
      mockRepositoryGetPendingListingRiskCandidates.mockResolvedValueOnce([
        {
          id: LISTING_ID_D,
          authorId: HIGH_RISK_AUTHOR_ID,
          author: { userBans: [] },
          customFieldValues: [],
        },
      ])
      mockComputeAuthorRiskProfiles.mockResolvedValue(
        new Map([
          [
            HIGH_RISK_AUTHOR_ID,
            {
              authorId: HIGH_RISK_AUTHOR_ID,
              highestSeverity: 'high',
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.ACTIVE_BAN,
                  severity: 'high',
                  label: 'Active Ban',
                  description: 'Banned for spam',
                },
              ],
            },
          ],
        ]),
      )

      const { caller, prisma } = createCaller({ userId: ADMIN_ID, role: Role.ADMIN })
      prisma.pcListing.findMany.mockResolvedValueOnce([
        { id: LISTING_ID_D, authorId: HIGH_RISK_AUTHOR_ID },
      ])
      prisma.pcListing.updateMany.mockResolvedValueOnce({ count: 0 })

      await expect(caller.autoRejectRisky()).resolves.toMatchObject({
        success: true,
        rejectedCount: 0,
        skippedCount: 1,
      })
      expect(prisma.pcListing.updateMany).toHaveBeenCalledWith({
        where: { id: LISTING_ID_D, status: ApprovalStatus.PENDING },
        data: expect.objectContaining({
          status: ApprovalStatus.REJECTED,
          processedByUserId: ADMIN_ID,
        }),
      })
      expect(mockApplyTrustAction).not.toHaveBeenCalled()
      expect(mockEmitNotificationEvent).not.toHaveBeenCalled()
    })

    it('keeps automatic PC risk rejection successful when trust action emission fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      mockRepositoryGetPendingListingRiskCandidates.mockResolvedValueOnce([
        {
          id: LISTING_ID_D,
          authorId: HIGH_RISK_AUTHOR_ID,
          author: { userBans: [] },
          customFieldValues: [],
        },
      ])
      mockComputeAuthorRiskProfiles.mockResolvedValue(
        new Map([
          [
            HIGH_RISK_AUTHOR_ID,
            {
              authorId: HIGH_RISK_AUTHOR_ID,
              highestSeverity: 'high',
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.ACTIVE_BAN,
                  severity: 'high',
                  label: 'Active Ban',
                  description: 'Banned for spam',
                },
              ],
            },
          ],
        ]),
      )
      mockApplyTrustAction.mockRejectedValueOnce(new Error('trust failed'))

      const { caller, prisma } = createCaller({ userId: ADMIN_ID, role: Role.ADMIN })
      prisma.pcListing.findMany.mockResolvedValueOnce([
        { id: LISTING_ID_D, authorId: HIGH_RISK_AUTHOR_ID },
      ])
      prisma.pcListing.updateMany.mockResolvedValue({ count: 1 })

      await expect(caller.autoRejectRisky()).resolves.toMatchObject({
        success: true,
        rejectedCount: 1,
        skippedCount: 0,
      })
      expect(consoleError).toHaveBeenCalledWith(
        'Some trust actions failed during review-risk PC auto-rejection:',
        expect.arrayContaining([
          expect.objectContaining({ status: 'rejected', reason: expect.any(Error) }),
        ]),
      )

      consoleError.mockRestore()
    })

    it('returns the admin-only PC auto-reject preview count', async () => {
      mockRepositoryGetPendingListingRiskCandidates.mockResolvedValueOnce([
        { id: LISTING_ID, authorId: AUTHOR_ID, author: { userBans: [] }, customFieldValues: [] },
        {
          id: LISTING_ID_B,
          authorId: CLEAN_AUTHOR_ID,
          author: { userBans: [] },
          customFieldValues: [],
        },
        {
          id: LISTING_ID_D,
          authorId: HIGH_RISK_AUTHOR_ID,
          author: { userBans: [] },
          customFieldValues: [],
        },
      ])
      mockComputeAuthorRiskProfiles.mockResolvedValue(
        new Map([
          [
            AUTHOR_ID,
            {
              authorId: AUTHOR_ID,
              highestSeverity: 'low',
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.NEW_AUTHOR,
                  severity: 'low',
                  label: 'New Author',
                  description: 'No previously approved listings',
                },
              ],
            },
          ],
          [CLEAN_AUTHOR_ID, { authorId: CLEAN_AUTHOR_ID, signals: [], highestSeverity: null }],
          [
            HIGH_RISK_AUTHOR_ID,
            {
              authorId: HIGH_RISK_AUTHOR_ID,
              highestSeverity: 'high',
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.ACTIVE_BAN,
                  severity: 'high',
                  label: 'Active Ban',
                  description: 'Banned for spam',
                },
              ],
            },
          ],
        ]),
      )
      mockComputeSubmissionRiskProfiles.mockResolvedValue(
        new Map([
          [
            LISTING_ID,
            {
              listingId: LISTING_ID,
              highestSeverity: 'high',
              signals: [
                {
                  type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
                  severity: 'high',
                  label: 'Placeholder Emulator Version',
                  description: 'Submitted emulator version resembles placeholder text.',
                },
              ],
            },
          ],
          [
            LISTING_ID_B,
            {
              listingId: LISTING_ID_B,
              highestSeverity: 'high',
              signals: [
                {
                  type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
                  severity: 'high',
                  label: 'Placeholder Emulator Version',
                  description: 'Submitted emulator version resembles placeholder text.',
                },
              ],
            },
          ],
        ]),
      )

      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.ADMIN })

      await expect(caller.autoRejectRiskyPreview()).resolves.toEqual({
        eligibleCount: 2,
        reviewRiskQueueCount: 3,
      })
    })

    it('keeps automatic PC risk rejection successful when notification emission fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      mockRepositoryGetPendingListingRiskCandidates.mockResolvedValueOnce([
        {
          id: LISTING_ID_D,
          authorId: HIGH_RISK_AUTHOR_ID,
          author: { userBans: [] },
          customFieldValues: [],
        },
      ])
      mockComputeAuthorRiskProfiles.mockResolvedValue(
        new Map([
          [
            HIGH_RISK_AUTHOR_ID,
            {
              authorId: HIGH_RISK_AUTHOR_ID,
              highestSeverity: 'high',
              signals: [
                {
                  type: RISK_SIGNAL_TYPES.ACTIVE_BAN,
                  severity: 'high',
                  label: 'Active Ban',
                  description: 'Banned for spam',
                },
              ],
            },
          ],
        ]),
      )
      mockComputeSubmissionRiskProfiles.mockResolvedValue(new Map())
      mockEmitNotificationEvent.mockImplementationOnce(() => {
        throw new Error('notification failed')
      })

      const { caller, prisma } = createCaller({ userId: ADMIN_ID, role: Role.ADMIN })
      prisma.pcListing.findMany.mockResolvedValueOnce([
        { id: LISTING_ID_D, authorId: HIGH_RISK_AUTHOR_ID },
      ])
      prisma.pcListing.updateMany.mockResolvedValue({ count: 1 })

      await expect(caller.autoRejectRisky()).resolves.toMatchObject({
        success: true,
        rejectedCount: 1,
        skippedCount: 0,
      })
      expect(consoleError).toHaveBeenCalledWith(
        `Failed to emit notification for PC listing ${LISTING_ID_D}:`,
        expect.any(Error),
      )

      consoleError.mockRestore()
    })

    it('requires admin role for automatic PC risk rejection', async () => {
      const { caller } = createCaller({ userId: ADMIN_ID, role: Role.MODERATOR })

      await expect(caller.autoRejectRiskyPreview()).rejects.toThrow(/admin|insufficient/i)
      await expect(caller.autoRejectRisky()).rejects.toThrow(/admin|insufficient/i)

      expect(mockRepositoryGetPendingListingRiskCandidates).not.toHaveBeenCalled()
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
