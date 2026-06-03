import { describe, expect, it, beforeEach, vi } from 'vitest'
import { RISK_SIGNAL_TYPES } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES } from '@/schemas/submissionRisk'
import { Role } from '@orm/client'
import type * as AuthorRiskService from '@/server/services/author-risk.service'

vi.unmock('@/server/api/trpc')

vi.mock('@/server/db', () => ({
  prisma: {},
}))

const mockComputeAuthorRiskProfiles = vi.fn().mockResolvedValue(new Map())
const mockComputeSubmissionRiskProfiles = vi.fn().mockResolvedValue(new Map())
const mockListVerifiedEmulatorIdsByUserId = vi.fn()
const mockGetPendingListingRiskCandidates = vi.fn()
const mockGetPendingListingsByIds = vi.fn()
const mockGetPendingListings = vi.fn()
const mockApplyTrustAction = vi.fn().mockResolvedValue(undefined)

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

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: (...args: unknown[]) => mockApplyTrustAction(...args),
}))

vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
  NOTIFICATION_EVENTS: {
    LISTING_APPROVED: 'LISTING_APPROVED',
    LISTING_REJECTED: 'LISTING_REJECTED',
  },
}))

vi.mock('@/server/cache/invalidation', () => ({
  invalidateListingSeo: vi.fn().mockResolvedValue(undefined),
  invalidateListingsSeo: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/utils/cache/instances', () => ({
  listingStatsCache: { delete: vi.fn(), get: vi.fn(), set: vi.fn() },
  invalidateCatalogCompatibilityCacheForDevice: vi.fn(),
  invalidateCatalogCompatibilityCacheForDevices: vi.fn(),
}))

vi.mock('@/server/utils/emulator-config/emulator-detector', () => ({
  generateEmulatorConfig: vi.fn(),
}))

vi.mock('@/server/repositories/listings.repository', () => ({
  ListingsRepository: vi.fn().mockImplementation(function MockListingsRepository() {
    return {
      getModeratorInfo: vi.fn(),
      listVerifiedEmulatorIdsByUserId: mockListVerifiedEmulatorIdsByUserId,
      getPendingListingRiskCandidates: mockGetPendingListingRiskCandidates,
      getPendingListingsByIds: mockGetPendingListingsByIds,
      getPendingListings: mockGetPendingListings,
    }
  }),
}))

vi.mock('@/server/repositories/pc-listings.repository', () => ({
  PcListingsRepository: vi.fn().mockImplementation(function MockPcListingsRepository() {
    return { getModeratorInfo: vi.fn() }
  }),
}))

const { prisma } = await import('@/server/db')
const { adminRouter } = await import('./admin')

const ADMIN_ID = '00000000-0000-4000-a000-000000000001'
const AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const CLEAN_AUTHOR_ID = '00000000-0000-4000-a000-000000000003'
const HIGH_RISK_AUTHOR_ID = '00000000-0000-4000-a000-000000000004'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const LISTING_ID_B = '00000000-0000-4000-a000-000000000011'
const LISTING_ID_C = '00000000-0000-4000-a000-000000000012'
const LISTING_ID_D = '00000000-0000-4000-a000-000000000013'

function createCaller(overrides: { userId?: string; role?: Role } = {}) {
  return {
    caller: adminRouter.createCaller({
      session: {
        user: {
          id: overrides.userId ?? ADMIN_ID,
          email: 'admin@test.com',
          name: 'Admin User',
          role: overrides.role ?? Role.MODERATOR,
          permissions: [],
          showNsfw: false,
        },
      },
      prisma,
      headers: new Headers(),
    }),
  }
}

describe('listing admin pending approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockComputeAuthorRiskProfiles.mockResolvedValue(new Map())
    mockComputeSubmissionRiskProfiles.mockResolvedValue(new Map())
  })

  it('filters risk-only listings using lightweight candidates before fetching full page rows', async () => {
    const submissionRiskListing = {
      id: LISTING_ID,
      authorId: AUTHOR_ID,
      author: { userBans: [] },
      customFieldValues: [],
    }
    const authorRiskListing = {
      id: LISTING_ID_B,
      authorId: ADMIN_ID,
      author: { userBans: [] },
      customFieldValues: [],
    }
    const cleanListing = {
      id: LISTING_ID_C,
      authorId: CLEAN_AUTHOR_ID,
      author: { userBans: [] },
      customFieldValues: [],
    }
    mockGetPendingListingRiskCandidates.mockResolvedValueOnce([
      submissionRiskListing,
      authorRiskListing,
      cleanListing,
    ])
    mockGetPendingListingsByIds.mockResolvedValueOnce([submissionRiskListing, authorRiskListing])
    mockComputeAuthorRiskProfiles.mockResolvedValue(
      new Map([
        [AUTHOR_ID, { authorId: AUTHOR_ID, signals: [], highestSeverity: null }],
        [
          ADMIN_ID,
          {
            authorId: ADMIN_ID,
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

    const { caller } = createCaller()

    const result = await caller.getPending({ riskFilter: 'risky', page: 1, limit: 20 })

    expect(mockGetPendingListingRiskCandidates).toHaveBeenCalledWith({
      emulatorIds: undefined,
      search: undefined,
      sortField: undefined,
      sortDirection: undefined,
    })
    expect(mockGetPendingListingsByIds).toHaveBeenCalledWith([LISTING_ID, LISTING_ID_B], {
      emulatorIds: undefined,
      search: undefined,
    })
    expect(mockGetPendingListings).not.toHaveBeenCalled()
    expect(result.listings).toHaveLength(2)
    expect(result.listings[0].id).toBe(LISTING_ID)
    expect(result.listings[0].submissionRiskProfile.highestSeverity).toBe('high')
    expect(result.listings[1].id).toBe(LISTING_ID_B)
    expect(result.listings[1].authorRiskProfile.highestSeverity).toBe('low')
    expect(result.pagination.total).toBe(2)
  })

  it('loads pending listings directly when risk filter is all', async () => {
    const listing = {
      id: LISTING_ID,
      authorId: AUTHOR_ID,
      author: { userBans: [] },
      customFieldValues: [],
    }
    mockGetPendingListings.mockResolvedValueOnce({
      listings: [listing],
      pagination: { total: 1, pages: 1, page: 1, offset: 0, limit: 20 },
    })

    const { caller } = createCaller()

    const result = await caller.getPending({ riskFilter: 'all', page: 1, limit: 20 })

    expect(mockGetPendingListings).toHaveBeenCalledWith({
      emulatorIds: undefined,
      search: undefined,
      page: 1,
      limit: 20,
      sortField: undefined,
      sortDirection: undefined,
    })
    expect(mockGetPendingListingRiskCandidates).not.toHaveBeenCalled()
    expect(mockGetPendingListingsByIds).not.toHaveBeenCalled()
    expect(result.listings).toHaveLength(1)
    expect(result.listings[0].id).toBe(LISTING_ID)
    expect(result.pagination.total).toBe(1)
  })

  it('returns an empty page when no risk-only candidates are risky', async () => {
    const cleanListing = {
      id: LISTING_ID_C,
      authorId: CLEAN_AUTHOR_ID,
      author: { userBans: [] },
      customFieldValues: [],
    }
    mockGetPendingListingRiskCandidates.mockResolvedValueOnce([cleanListing])
    mockComputeAuthorRiskProfiles.mockResolvedValue(
      new Map([
        [CLEAN_AUTHOR_ID, { authorId: CLEAN_AUTHOR_ID, signals: [], highestSeverity: null }],
      ]),
    )
    mockComputeSubmissionRiskProfiles.mockResolvedValue(
      new Map([[LISTING_ID_C, { listingId: LISTING_ID_C, signals: [], highestSeverity: null }]]),
    )

    const { caller } = createCaller()

    const result = await caller.getPending({ riskFilter: 'risky', page: 1, limit: 20 })

    expect(mockGetPendingListingsByIds).not.toHaveBeenCalled()
    expect(result.listings).toHaveLength(0)
    expect(result.pagination.total).toBe(0)
  })
})

describe('listing admin auto risk rejection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockComputeAuthorRiskProfiles.mockResolvedValue(new Map())
    mockComputeSubmissionRiskProfiles.mockResolvedValue(new Map())
    mockListVerifiedEmulatorIdsByUserId.mockResolvedValue([])
    mockGetPendingListingRiskCandidates.mockResolvedValue([])
  })

  function setupPrisma() {
    const tx = {
      listing: {
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    }
    const prismaMock = prisma as unknown as {
      user: { findUnique: ReturnType<typeof vi.fn> }
      listing: typeof tx.listing
      $transaction: ReturnType<typeof vi.fn>
    }

    prismaMock.user = {
      findUnique: vi.fn().mockResolvedValue({ id: ADMIN_ID }),
    }
    prismaMock.listing = tx.listing
    prismaMock.$transaction = vi.fn(
      async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
    )

    return { tx, prismaMock }
  }

  it('rejects pending handheld reports with high author risk or high submission risk with author risk', async () => {
    const { tx } = setupPrisma()
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

    mockGetPendingListingRiskCandidates.mockResolvedValueOnce([
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
    tx.listing.findMany.mockResolvedValueOnce([
      { id: LISTING_ID_C, authorId: AUTHOR_ID, deviceId: 'device-3' },
      { id: LISTING_ID_D, authorId: HIGH_RISK_AUTHOR_ID, deviceId: 'device-4' },
    ])

    const { caller } = createCaller({ role: Role.ADMIN })

    const result = await caller.autoRejectRisky()

    expect(mockGetPendingListingRiskCandidates).toHaveBeenCalledWith({})
    expect(tx.listing.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: [LISTING_ID_C, LISTING_ID_D] },
        status: 'PENDING',
      },
      include: { author: { select: { id: true } } },
    })
    expect(tx.listing.update).toHaveBeenCalledTimes(2)
    expect(tx.listing.update).toHaveBeenCalledWith({
      where: { id: LISTING_ID_C },
      data: expect.objectContaining({
        status: 'REJECTED',
        processedByUserId: ADMIN_ID,
        processedNotes:
          'Automatically rejected by review risk bulk action: submission risk high severity; author risk low severity (1 signal).',
      }),
    })
    expect(tx.listing.update).toHaveBeenCalledWith({
      where: { id: LISTING_ID_D },
      data: expect.objectContaining({
        status: 'REJECTED',
        processedByUserId: ADMIN_ID,
        processedNotes:
          'Automatically rejected by review risk bulk action: author risk high severity (1 signal).',
      }),
    })
    expect(mockApplyTrustAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: AUTHOR_ID,
        context: expect.objectContaining({
          listingId: LISTING_ID_C,
          reason:
            'Automatically rejected by review risk bulk action: submission risk high severity; author risk low severity (1 signal).',
        }),
      }),
    )
    expect(mockApplyTrustAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: HIGH_RISK_AUTHOR_ID,
        context: expect.objectContaining({
          listingId: LISTING_ID_D,
          reason:
            'Automatically rejected by review risk bulk action: author risk high severity (1 signal).',
        }),
      }),
    )
    expect(result).toMatchObject({
      success: true,
      rejectedCount: 2,
      skippedCount: 0,
    })
  })

  it('returns the admin-only auto-reject preview count', async () => {
    mockGetPendingListingRiskCandidates.mockResolvedValueOnce([
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
        [CLEAN_AUTHOR_ID, { authorId: CLEAN_AUTHOR_ID, signals: [], highestSeverity: null }],
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

    const { caller } = createCaller({ role: Role.ADMIN })

    await expect(caller.autoRejectRiskyPreview()).resolves.toEqual({
      eligibleCount: 2,
      reviewRiskQueueCount: 3,
    })
  })

  it('requires admin role for automatic risk rejection', async () => {
    setupPrisma()

    const { caller } = createCaller({ role: Role.MODERATOR })

    await expect(caller.autoRejectRiskyPreview()).rejects.toThrow(/admin|insufficient/i)
    await expect(caller.autoRejectRisky()).rejects.toThrow(/admin|insufficient/i)

    expect(mockGetPendingListingRiskCandidates).not.toHaveBeenCalled()
  })
})
