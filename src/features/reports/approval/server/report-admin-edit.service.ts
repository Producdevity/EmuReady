import { type z } from 'zod'
import { AppError, ResourceError } from '@/lib/errors'
import { type UpdateListingAdminSchema } from '@/schemas/listing'
import { type UpdatePcListingAdminSchema } from '@/schemas/pcListing'
import { invalidateListingsSeo, invalidatePcListingsSeo } from '@/server/cache/invalidation'
import {
  invalidateCatalogCompatibilityCacheForDevice,
  listingStatsCache,
} from '@/server/utils/cache/instances'
import { trackTrustScoreChange } from '@/server/utils/trust-score-analytics'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, Role } from '@orm'
import { ApprovalTrustService } from './approval-trust.service'
import { notifyReportDecision } from './report-approval.effects'
import { type ApprovalActor } from './report-approval.policy'
import { type ReportApprovalRepository } from './report-approval.repository'

type ApprovalRecord = NonNullable<Awaited<ReturnType<ReportApprovalRepository['find']>>>

async function invalidateEditedReport(
  previous: ApprovalRecord,
  updated: ApprovalRecord,
): Promise<void> {
  const reports = [previous, updated]
  if (updated.reportType === 'handheld') {
    listingStatsCache.delete('listing-stats')
    const handheld = reports.filter((report) => report.reportType === 'handheld')
    for (const deviceId of new Set(handheld.map((report) => report.deviceId))) {
      invalidateCatalogCompatibilityCacheForDevice(deviceId)
    }
    const publicReports = handheld.filter((report) => report.status === ApprovalStatus.APPROVED)
    if (publicReports.length > 0) await invalidateListingsSeo(publicReports)
  } else {
    listingStatsCache.delete('pc-listing-stats')
    const publicReports = reports
      .filter((report) => report.reportType === 'pc')
      .filter((report) => report.status === ApprovalStatus.APPROVED)
    if (publicReports.length > 0) await invalidatePcListingsSeo(publicReports)
  }
}

export class ReportAdminEditService {
  constructor(private readonly repository: ReportApprovalRepository) {}

  async updateHandheld(input: z.output<typeof UpdateListingAdminSchema>, actor: ApprovalActor) {
    if (!hasRolePermission(actor.role, Role.MODERATOR))
      return ResourceError.listing.requiresModeratorToUpdate()
    return this.updateReport(
      { reportId: input.id, reportType: 'handheld', status: input.status },
      actor,
      (repository, previous) => repository.updateHandheld(input, actor.id, previous.status),
    )
  }

  async updatePc(input: z.output<typeof UpdatePcListingAdminSchema>, actor: ApprovalActor) {
    if (!hasPermission(actor.permissions, PERMISSIONS.APPROVE_LISTINGS))
      return AppError.insufficientPermissions([PERMISSIONS.APPROVE_LISTINGS])
    return this.updateReport(
      { reportId: input.id, reportType: 'pc', status: input.status },
      actor,
      (repository, previous) => repository.updatePc(input, actor.id, previous.status),
    )
  }

  private async updateReport(
    target: Parameters<ReportApprovalRepository['find']>[0] & { status: ApprovalStatus },
    actor: ApprovalActor,
    persist: (
      repository: ReportApprovalRepository,
      previous: ApprovalRecord,
    ) => Promise<ApprovalRecord>,
  ) {
    const result = await this.repository.transaction(async (repository, trust) => {
      const previous = await repository.find(target)
      const errors =
        target.reportType === 'handheld' ? ResourceError.listing : ResourceError.pcListing
      if (!previous) return errors.notFound()
      if (
        previous.status !== ApprovalStatus.APPROVED &&
        target.status === ApprovalStatus.APPROVED
      ) {
        const ban = previous.author?.userBans.find(
          (entry) => !entry.expiresAt || entry.expiresAt > new Date(),
        )
        if (ban) return errors.cannotApproveBannedUser(ban.reason)
      }
      const updated = await persist(repository, previous)
      const change = await new ApprovalTrustService(trust).reconcile({
        reportId: target.reportId,
        reportType: target.reportType,
        authorId: previous.authorId,
        actorId: actor.id,
        previousStatus: previous.status,
        newStatus: updated.status,
        reason: 'Report updated by moderator',
      })
      return { previous, updated, change }
    })
    trackTrustScoreChange(result.change)
    await invalidateEditedReport(result.previous, result.updated)
    if (result.previous.status !== result.updated.status) {
      notifyReportDecision({
        report: result.updated,
        updated: result.updated,
        actorId: actor.id,
        notes: result.updated.processedNotes,
      })
    }
    return {
      id: result.updated.id,
      status: result.updated.status,
      processedAt: result.updated.processedAt,
    }
  }
}
