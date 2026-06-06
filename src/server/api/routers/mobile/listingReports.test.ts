import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportReason, Role } from '@orm/client'

vi.unmock('@/server/api/mobileContext')

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

const mockEmitNotificationEvent = vi.fn()
vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: mockEmitNotificationEvent },
  NOTIFICATION_EVENTS: {
    REPORT_CREATED: 'report.created',
  },
}))

vi.mock('@/server/utils/security-validation', () => ({
  sanitizeInput: vi.fn((value: string) => value.trim()),
}))

const { mobileListingReportsRouter } = await import('./listingReports')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const REPORT_ID = '00000000-0000-4000-a000-000000000020'

function createMockPrisma() {
  return {
    listing: {
      findUnique: vi.fn().mockResolvedValue({
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        author: { id: AUTHOR_ID },
      }),
    },
    listingReport: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: REPORT_ID,
        listingId: LISTING_ID,
        reportedById: USER_ID,
      }),
    },
  }
}

type MockPrisma = ReturnType<typeof createMockPrisma>

function createCaller(prisma: MockPrisma = createMockPrisma()) {
  return {
    caller: mobileListingReportsRouter.createCaller({
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
      prisma: prisma as never,
      headers: new Headers(),
      apiKey: null,
    }),
    prisma,
  }
}

describe('mobileListingReportsRouter create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a report and emits the same moderator notification event as web', async () => {
    const { caller, prisma } = createCaller()

    const result = await caller.create({
      listingId: LISTING_ID,
      reason: ReportReason.SPAM,
      description: '  needs review  ',
    })

    expect(result).toEqual({
      id: REPORT_ID,
      success: true,
      message: 'Report submitted successfully',
    })
    expect(prisma.listingReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          listingId: LISTING_ID,
          reportedById: USER_ID,
          description: 'needs review',
        }),
      }),
    )
    expect(mockEmitNotificationEvent).toHaveBeenCalledWith({
      eventType: 'report.created',
      entityType: 'listingReport',
      entityId: REPORT_ID,
      triggeredBy: USER_ID,
      payload: {
        reportId: REPORT_ID,
        contentId: LISTING_ID,
        contentType: 'Compatibility Report',
        actionUrl: `/admin/reports?listing=${LISTING_ID}`,
        listingId: LISTING_ID,
      },
    })
  })
})
