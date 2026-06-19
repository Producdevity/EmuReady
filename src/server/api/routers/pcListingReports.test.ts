import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, ReportReason, ReportStatus, Role, TrustAction } from '@orm'

vi.unmock('@/server/api/trpc')

const mockLogAction = vi.fn().mockResolvedValue(undefined)
const mockTrustService = vi.fn().mockImplementation(function MockTrustService() {
  return { logAction: mockLogAction }
})

vi.mock('@/lib/trust/service', () => ({
  TrustService: mockTrustService,
}))

const { pcListingReportsRouter } = await import('./pcListingReports')

const USER_ID = '00000000-0000-4000-a000-000000000001'
const REPORT_ID = '00000000-0000-4000-a000-000000000020'
const PC_LISTING_ID = '00000000-0000-4000-a000-000000000030'

function createPrismaError(code: string): Error & { code: string } {
  return Object.assign(new Error(`Prisma error ${code}`), { code })
}

function createMockPrisma() {
  const tx = {
    pcListing: {
      update: vi.fn().mockResolvedValue({ id: PC_LISTING_ID }),
    },
    pcListingReport: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
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

function createCaller(prisma: MockPrisma = createMockPrisma()) {
  return {
    caller: pcListingReportsRouter.createCaller({
      session: {
        user: {
          id: USER_ID,
          email: 'test@test.com',
          name: 'Test User',
          role: Role.ADMIN,
          permissions: [PERMISSIONS.MANAGE_USER_BANS, PERMISSIONS.VIEW_USER_BANS],
          showNsfw: false,
        },
      },
      prisma: prisma as never,
      headers: new Headers(),
    }),
    prisma,
  }
}

describe('pcListingReportsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates report status, listing status, and trust effects inside one transaction', async () => {
    const { caller, prisma } = createCaller()
    prisma.pcListingReport.findUnique.mockResolvedValue({
      id: REPORT_ID,
      pcListingId: PC_LISTING_ID,
      reportedById: USER_ID,
      reason: ReportReason.SPAM,
      status: ReportStatus.PENDING,
      pcListing: { status: ApprovalStatus.APPROVED },
    })

    await caller.updateStatus({
      id: REPORT_ID,
      status: ReportStatus.RESOLVED,
      reviewNotes: 'Confirmed spam',
    })

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.pcListing.update).toHaveBeenCalledWith({
      where: { id: PC_LISTING_ID },
      data: expect.objectContaining({
        status: ApprovalStatus.REJECTED,
        processedByUserId: USER_ID,
        processedNotes: 'Rejected due to report: Confirmed spam',
      }),
    })
    expect(mockTrustService).toHaveBeenCalledWith(
      expect.objectContaining({ pcListingReport: prisma.pcListingReport }),
    )
    expect(mockLogAction).toHaveBeenCalledWith({
      userId: USER_ID,
      action: TrustAction.REPORT_CONFIRMED,
      metadata: {
        reportId: REPORT_ID,
        pcListingId: PC_LISTING_ID,
        reviewedBy: USER_ID,
        reason: ReportReason.SPAM,
      },
    })
    expect(prisma.pcListingReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: REPORT_ID },
        data: expect.objectContaining({
          status: ReportStatus.RESOLVED,
          reviewedById: USER_ID,
        }),
      }),
    )
  })

  it('does not duplicate trust effects when the status is unchanged', async () => {
    const { caller, prisma } = createCaller()
    prisma.pcListingReport.findUnique.mockResolvedValue({
      id: REPORT_ID,
      pcListingId: PC_LISTING_ID,
      reportedById: USER_ID,
      reason: ReportReason.SPAM,
      status: ReportStatus.RESOLVED,
      pcListing: { status: ApprovalStatus.APPROVED },
    })

    await caller.updateStatus({
      id: REPORT_ID,
      status: ReportStatus.RESOLVED,
      reviewNotes: 'Already handled',
    })

    expect(prisma.pcListing.update).not.toHaveBeenCalled()
    expect(mockLogAction).not.toHaveBeenCalled()
    expect(prisma.pcListingReport.update).toHaveBeenCalled()
  })

  it('prevents changing a PC report after it reaches a final status', async () => {
    const { caller, prisma } = createCaller()
    prisma.pcListingReport.findUnique.mockResolvedValue({
      id: REPORT_ID,
      pcListingId: PC_LISTING_ID,
      reportedById: USER_ID,
      reason: ReportReason.SPAM,
      status: ReportStatus.RESOLVED,
      pcListing: { status: ApprovalStatus.REJECTED },
    })

    await expect(
      caller.updateStatus({
        id: REPORT_ID,
        status: ReportStatus.DISMISSED,
        reviewNotes: 'Changing decision',
      }),
    ).rejects.toThrow('PC report has already been resolved or dismissed')

    expect(prisma.pcListing.update).not.toHaveBeenCalled()
    expect(mockLogAction).not.toHaveBeenCalled()
    expect(prisma.pcListingReport.update).not.toHaveBeenCalled()
  })

  it('maps missing report deletes to the PC report not-found error without preloading', async () => {
    const { caller, prisma } = createCaller()
    prisma.pcListingReport.delete.mockRejectedValue(createPrismaError('P2025'))

    await expect(caller.delete({ id: REPORT_ID })).rejects.toThrow('PC report not found')

    expect(prisma.pcListingReport.findUnique).not.toHaveBeenCalled()
  })
})
