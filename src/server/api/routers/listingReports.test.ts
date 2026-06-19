import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, ReportReason, ReportStatus, Role, TrustAction } from '@orm/client'

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
  sanitizeInput: vi.fn((value: string) => value.trim()),
}))

const mockLogAction = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/trust/service', () => ({
  TrustService: vi.fn().mockImplementation(function MockTrustService() {
    return { logAction: mockLogAction, reverseLogAction: vi.fn() }
  }),
}))

const { listingReportsRouter } = await import('./listingReports')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const REPORT_ID = '00000000-0000-4000-a000-000000000020'

function createMockPrisma() {
  const tx = {
    listing: {
      findUnique: vi.fn().mockResolvedValue({
        id: LISTING_ID,
        authorId: AUTHOR_ID,
        author: { id: AUTHOR_ID },
      }),
      update: vi.fn().mockResolvedValue({ id: LISTING_ID }),
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
      update: vi.fn().mockResolvedValue({ id: REPORT_ID, status: ReportStatus.RESOLVED }),
      delete: vi.fn().mockResolvedValue({ id: REPORT_ID }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ trustScore: 0 }),
      update: vi.fn().mockResolvedValue({ id: USER_ID }),
    },
    trustActionLog: {
      create: vi.fn().mockResolvedValue({ id: 'trust-log-id' }),
    },
  }

  return {
    ...tx,
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  }
}

type MockPrisma = ReturnType<typeof createMockPrisma>

function createCaller(
  prisma: MockPrisma = createMockPrisma(),
  options: { role?: Role; permissions?: string[] } = {},
) {
  return {
    caller: listingReportsRouter.createCaller({
      session: {
        user: {
          id: USER_ID,
          email: 'test@test.com',
          name: 'Test User',
          role: options.role ?? Role.USER,
          permissions: options.permissions ?? [],
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

  it('updates report status, listing status, and trust effects inside one transaction', async () => {
    const { caller, prisma } = createCaller(createMockPrisma(), {
      role: Role.ADMIN,
      permissions: [PERMISSIONS.MANAGE_USER_BANS],
    })
    prisma.listingReport.findUnique.mockResolvedValue({
      id: REPORT_ID,
      listingId: LISTING_ID,
      reportedById: USER_ID,
      reason: ReportReason.SPAM,
      status: ReportStatus.PENDING,
      listing: { status: ApprovalStatus.APPROVED },
    })

    await caller.updateStatus({
      id: REPORT_ID,
      status: ReportStatus.RESOLVED,
      reviewNotes: 'Confirmed spam',
    })

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: LISTING_ID },
      data: expect.objectContaining({
        status: ApprovalStatus.REJECTED,
        processedByUserId: USER_ID,
        processedNotes: 'Rejected due to report: Confirmed spam',
      }),
    })
    expect(mockLogAction).toHaveBeenCalledWith({
      userId: USER_ID,
      action: TrustAction.REPORT_CONFIRMED,
      metadata: {
        reportId: REPORT_ID,
        listingId: LISTING_ID,
        reviewedBy: USER_ID,
        reason: ReportReason.SPAM,
      },
    })
    expect(prisma.listingReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: REPORT_ID },
        data: expect.objectContaining({
          status: ReportStatus.RESOLVED,
          reviewedById: USER_ID,
        }),
      }),
    )
  })

  it('prevents changing a report after it reaches a final status', async () => {
    const { caller, prisma } = createCaller(createMockPrisma(), {
      role: Role.ADMIN,
      permissions: [PERMISSIONS.MANAGE_USER_BANS],
    })
    prisma.listingReport.findUnique.mockResolvedValue({
      id: REPORT_ID,
      listingId: LISTING_ID,
      reportedById: USER_ID,
      reason: ReportReason.SPAM,
      status: ReportStatus.RESOLVED,
      listing: { status: ApprovalStatus.REJECTED },
    })

    await expect(
      caller.updateStatus({
        id: REPORT_ID,
        status: ReportStatus.DISMISSED,
        reviewNotes: 'Changing decision',
      }),
    ).rejects.toThrow('Report has already been resolved or dismissed')

    expect(prisma.listing.update).not.toHaveBeenCalled()
    expect(mockLogAction).not.toHaveBeenCalled()
    expect(prisma.listingReport.update).not.toHaveBeenCalled()
  })
})
