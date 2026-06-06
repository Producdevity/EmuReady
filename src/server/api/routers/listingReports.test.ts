import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportReason, Role } from '@orm/client'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')

const mockEmitNotificationEvent = vi.fn()
vi.mock('@/server/notifications/eventEmitter', () => ({
  notificationEventEmitter: { emitNotificationEvent: mockEmitNotificationEvent },
  NOTIFICATION_EVENTS: {
    REPORT_CREATED: 'report.created',
  },
}))

vi.mock('@/server/utils/security-validation', () => ({
  validateEnum: vi.fn(),
  sanitizeInput: vi.fn((value: string) => value.trim()),
  validatePagination: vi.fn((page, limit, max) => ({ page: page ?? 1, limit: limit ?? max ?? 20 })),
}))

vi.mock('@/lib/trust/service', () => ({
  TrustService: vi.fn().mockImplementation(function MockTrustService() {
    return { logAction: vi.fn(), reverseLogAction: vi.fn() }
  }),
}))

const { listingReportsRouter } = await import('./listingReports')

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
        reason: ReportReason.SPAM,
        description: 'needs review',
        listing: {
          game: { title: 'Test Game' },
          author: { name: 'Report Author' },
        },
      }),
    },
  }
}

type MockPrisma = ReturnType<typeof createMockPrisma>

function createCaller(prisma: MockPrisma = createMockPrisma()) {
  return {
    caller: listingReportsRouter.createCaller({
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
    }),
    prisma,
  }
}

describe('listingReportsRouter create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a report and emits a moderator notification event', async () => {
    const { caller, prisma } = createCaller()

    const report = await caller.create({
      listingId: LISTING_ID,
      reason: ReportReason.SPAM,
      description: '  needs review  ',
    })

    expect(report.id).toBe(REPORT_ID)
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
      includeTriggeredBy: true,
      payload: {
        reportId: REPORT_ID,
        contentId: LISTING_ID,
        contentType: 'Compatibility Report',
        actionUrl: `/listings/${LISTING_ID}`,
        listingId: LISTING_ID,
      },
    })
  })
})
