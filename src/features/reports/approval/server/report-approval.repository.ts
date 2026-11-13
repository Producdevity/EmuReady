import { type z } from 'zod'
import { AppError, ResourceError } from '@/lib/errors'
import { type ListingType } from '@/schemas/common'
import { type UpdateListingAdminSchema } from '@/schemas/listing'
import { type UpdatePcListingAdminSchema } from '@/schemas/pcListing'
import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { toPrismaCustomFieldValue } from '@/server/utils/prisma-json'
import { withRetryTransaction } from '@/server/utils/transactions'
import { ApprovalStatus, Prisma } from '@orm'
import { type PrismaClient } from '@orm/client'
import { ApprovalTrustRepository } from './approval-trust.repository'
import { HANDHELD_APPROVAL_SELECT, PC_APPROVAL_SELECT } from './persistence/report-approval.prisma'

interface Target {
  reportId: string
  reportType: ListingType
}

function decisionData(
  status: ApprovalStatus,
  actorId: string,
  processedAt: Date,
  notes: string | null,
) {
  const pending = status === ApprovalStatus.PENDING
  return {
    status,
    processedByUserId: pending ? null : actorId,
    processedAt: pending ? null : processedAt,
    processedNotes: pending ? null : notes,
  }
}

export class ReportApprovalRepository extends PrismaWriteRepository<Target> {
  constructor(
    private readonly owner: PrismaClient,
    private readonly transactionClient: Prisma.TransactionClient | null = null,
  ) {
    super(transactionClient ?? owner)
  }

  transaction<T>(
    operation: (repository: ReportApprovalRepository, trust: ApprovalTrustRepository) => Promise<T>,
  ): Promise<T> {
    if (this.transactionClient !== null) {
      return AppError.internalError('Report approval requires a transaction owner')
    }
    return withRetryTransaction(
      this.owner,
      (tx) =>
        operation(new ReportApprovalRepository(this.owner, tx), new ApprovalTrustRepository(tx)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async find(target: Target) {
    if (target.reportType === 'handheld') {
      const record = await this.prisma.listing.findUnique({
        where: { id: target.reportId },
        select: HANDHELD_APPROVAL_SELECT,
      })
      return record ? { ...record, reportType: target.reportType } : null
    }
    const record = await this.prisma.pcListing.findUnique({
      where: { id: target.reportId },
      select: PC_APPROVAL_SELECT,
    })
    return record ? { ...record, reportType: target.reportType } : null
  }

  async pending(reportIds: string[], reportType: ListingType) {
    if (reportType === 'handheld') {
      const records = await this.prisma.listing.findMany({
        where: { id: { in: reportIds }, status: ApprovalStatus.PENDING },
        select: HANDHELD_APPROVAL_SELECT,
        orderBy: { id: 'asc' },
      })
      return records.map((record) => ({ ...record, reportType }))
    }
    const records = await this.prisma.pcListing.findMany({
      where: { id: { in: reportIds }, status: ApprovalStatus.PENDING },
      select: PC_APPROVAL_SELECT,
      orderBy: { id: 'asc' },
    })
    return records.map((record) => ({ ...record, reportType }))
  }

  async isVerifiedDeveloper(userId: string, emulatorId: string): Promise<boolean> {
    const verification = await this.prisma.verifiedDeveloper.findUnique({
      where: { userId_emulatorId: { userId, emulatorId } },
      select: { id: true },
    })
    return verification !== null
  }

  setStatus(
    input: Target & {
      status: ApprovalStatus
      actorId: string
      processedAt: Date
      notes: string | null
    },
  ) {
    const data = decisionData(input.status, input.actorId, input.processedAt, input.notes)
    return this.executeWrite(
      () =>
        input.reportType === 'handheld'
          ? this.prisma.listing.update({
              where: { id: input.reportId },
              data,
              select: { id: true, status: true, processedAt: true },
            })
          : this.prisma.pcListing.update({
              where: { id: input.reportId },
              data,
              select: { id: true, status: true, processedAt: true },
            }),
      input,
    )
  }

  async updateHandheld(
    input: z.output<typeof UpdateListingAdminSchema>,
    actorId: string,
    previousStatus: ApprovalStatus,
  ) {
    const { id, customFieldValues, ...data } = input
    return this.executeWrite(
      async () => {
        const updated = await this.prisma.listing.update({
          where: { id },
          data: {
            ...data,
            ...(previousStatus === input.status
              ? {}
              : decisionData(input.status, actorId, new Date(), null)),
          },
          select: HANDHELD_APPROVAL_SELECT,
        })
        if (customFieldValues) {
          await this.prisma.listingCustomFieldValue.deleteMany({ where: { listingId: id } })
          if (customFieldValues.length > 0) {
            await this.prisma.listingCustomFieldValue.createMany({
              data: customFieldValues.map((field) => ({
                listingId: id,
                customFieldDefinitionId: field.customFieldDefinitionId,
                value: toPrismaCustomFieldValue(field.value),
              })),
            })
          }
        }
        return { ...updated, reportType: 'handheld' as const }
      },
      { reportId: id, reportType: 'handheld' },
    )
  }

  async updatePc(
    input: z.output<typeof UpdatePcListingAdminSchema>,
    actorId: string,
    previousStatus: ApprovalStatus,
  ) {
    const { id, customFieldValues, ...data } = input
    return this.executeWrite(
      async () => {
        const updated = await this.prisma.pcListing.update({
          where: { id },
          data: {
            ...data,
            ...(previousStatus === input.status
              ? {}
              : decisionData(input.status, actorId, new Date(), null)),
          },
          select: PC_APPROVAL_SELECT,
        })
        if (customFieldValues !== undefined) {
          await this.prisma.pcListingCustomFieldValue.deleteMany({ where: { pcListingId: id } })
          if (customFieldValues.length > 0) {
            await this.prisma.pcListingCustomFieldValue.createMany({
              data: customFieldValues.map((field) => ({
                pcListingId: id,
                customFieldDefinitionId: field.customFieldDefinitionId,
                value: toPrismaCustomFieldValue(field.value),
              })),
            })
          }
        }
        return { ...updated, reportType: 'pc' as const }
      },
      { reportId: id, reportType: 'pc' },
    )
  }

  protected translateWriteError(error: unknown, target: Target): never {
    if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND)) {
      return target.reportType === 'handheld'
        ? ResourceError.listing.notFound()
        : ResourceError.pcListing.notFound()
    }
    throw error
  }
}
