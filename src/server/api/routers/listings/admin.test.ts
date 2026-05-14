import { describe, expect, it, beforeEach, vi } from 'vitest'
import { RISK_SIGNAL_TYPES } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES } from '@/schemas/submissionRisk'
import { Role } from '@orm'

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

vi.mock('@/server/services/author-risk.service', () => ({
  computeAuthorRiskProfiles: (...args: unknown[]) => mockComputeAuthorRiskProfiles(...args),
  createExistingAuthorBansMap: (
    listings: readonly {
      authorId: string
      author?: { userBans?: readonly { reason: string }[] } | null
    }[],
  ) => {
    const existingBansMap = new Map<string, { reason: string }[]>()

    for (const listing of listings) {
      if (
        listing.author?.userBans &&
        listing.author.userBans.length > 0 &&
        !existingBansMap.has(listing.authorId)
      ) {
        existingBansMap.set(
          listing.authorId,
          listing.author.userBans.map((ban) => ({ reason: ban.reason })),
        )
      }
    }

    return existingBansMap
  },
}))

vi.mock('@/server/services/submission-risk.service', () => ({
  computeSubmissionRiskProfiles: (...args: unknown[]) => mockComputeSubmissionRiskProfiles(...args),
}))

vi.mock('@/lib/trust/service', () => ({
  applyTrustAction: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
  NOTIFICATION_EVENTS: {
    LISTING_APPROVED: 'LISTING_APPROVED',
    LISTING_REJECTED: 'LISTING_REJECTED',
  },
}))

vi.mock('@/server/cache/invalidation', () => ({
  invalidateListing: vi.fn().mockResolvedValue(undefined),
  invalidateListPages: vi.fn().mockResolvedValue(undefined),
  invalidateSitemap: vi.fn().mockResolvedValue(undefined),
  revalidateByTag: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/utils/cache/instances', () => ({
  listingStatsCache: { delete: vi.fn(), get: vi.fn(), set: vi.fn() },
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
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const LISTING_ID_B = '00000000-0000-4000-a000-000000000011'
const LISTING_ID_C = '00000000-0000-4000-a000-000000000012'

function createCaller() {
  return {
    caller: adminRouter.createCaller({
      session: {
        user: {
          id: ADMIN_ID,
          email: 'admin@test.com',
          name: 'Admin User',
          role: Role.MODERATOR,
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
    expect(mockGetPendingListingsByIds).toHaveBeenCalledWith([LISTING_ID, LISTING_ID_B])
    expect(mockGetPendingListings).not.toHaveBeenCalled()
    expect(result.listings).toHaveLength(2)
    expect(result.listings[0].id).toBe(LISTING_ID)
    expect(result.listings[0].submissionRiskProfile.highestSeverity).toBe('high')
    expect(result.listings[1].id).toBe(LISTING_ID_B)
    expect(result.listings[1].authorRiskProfile.highestSeverity).toBe('low')
    expect(result.pagination.total).toBe(2)
  })
})
