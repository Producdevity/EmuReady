import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import { ApprovalStatus, type Prisma } from '@orm/client'

const PC_BULK_APPROVE_SELECT = {
  id: true,
  gameId: true,
  cpuId: true,
  gpuId: true,
  authorId: true,
  emulatorId: true,
} satisfies Prisma.PcListingSelect

const PC_BULK_REJECT_SELECT = {
  id: true,
  authorId: true,
  emulatorId: true,
} satisfies Prisma.PcListingSelect

export type PcBulkApproveTarget = Prisma.PcListingGetPayload<{
  select: typeof PC_BULK_APPROVE_SELECT
}>

export type PcBulkRejectTarget = Prisma.PcListingGetPayload<{
  select: typeof PC_BULK_REJECT_SELECT
}>

export type PcBulkModerationTarget = PcBulkApproveTarget | PcBulkRejectTarget

export class PcListingBulkModerationRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  listPendingForBulkApprove(pcListingIds: string[]): Promise<PcBulkApproveTarget[]> {
    return this.prisma.pcListing.findMany({
      where: { id: { in: pcListingIds }, status: ApprovalStatus.PENDING },
      select: PC_BULK_APPROVE_SELECT,
    })
  }

  listPendingForBulkReject(pcListingIds: string[]): Promise<PcBulkRejectTarget[]> {
    return this.prisma.pcListing.findMany({
      where: { id: { in: pcListingIds }, status: ApprovalStatus.PENDING },
      select: PC_BULK_REJECT_SELECT,
    })
  }

  async listVerifiedEmulatorIds(userId: string): Promise<string[]> {
    const verifiedDevelopers = await this.prisma.verifiedDeveloper.findMany({
      where: { userId },
      select: { emulatorId: true },
    })

    return verifiedDevelopers.map((verification) => verification.emulatorId)
  }

  approvePendingByIds(params: {
    pcListingIds: string[]
    processedByUserId: string
    processedAt: Date
  }): Promise<Prisma.BatchPayload> {
    return this.prisma.pcListing.updateMany({
      where: {
        id: { in: params.pcListingIds },
        status: ApprovalStatus.PENDING,
      },
      data: {
        status: ApprovalStatus.APPROVED,
        processedAt: params.processedAt,
        processedByUserId: params.processedByUserId,
      },
    })
  }

  rejectPendingByIds(params: {
    pcListingIds: string[]
    processedByUserId: string
    processedAt: Date
    processedNotes?: string
  }): Promise<Prisma.BatchPayload> {
    return this.prisma.pcListing.updateMany({
      where: {
        id: { in: params.pcListingIds },
        status: ApprovalStatus.PENDING,
      },
      data: {
        status: ApprovalStatus.REJECTED,
        processedAt: params.processedAt,
        processedByUserId: params.processedByUserId,
        processedNotes: params.processedNotes,
      },
    })
  }
}
