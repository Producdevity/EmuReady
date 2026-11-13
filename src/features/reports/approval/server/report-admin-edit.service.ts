import { type z } from 'zod'
import { AppError, ResourceError } from '@/lib/errors'
import { type UpdateListingAdminSchema } from '@/schemas/listing'
import { type UpdatePcListingAdminSchema } from '@/schemas/pcListing'
import { invalidateListingSeo, invalidatePcListingSeo } from '@/server/cache/invalidation'
import {
  invalidateCatalogCompatibilityCacheForDevice,
  listingStatsCache,
} from '@/server/utils/cache/instances'
import { trackTrustScoreChange } from '@/server/utils/trust-score-analytics'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, Role } from '@orm'
import { ApprovalTrustService } from './approval-trust.service'
import { type ApprovalActor } from './report-approval.policy'
import { type ReportApprovalRepository } from './report-approval.repository'

type ApprovalRecord = NonNullable<Awaited<ReturnType<ReportApprovalRepository['find']>>>

async function invalidateEditedReport(report: ApprovalRecord): Promise<void> {
  if (report.reportType === 'handheld') {
    listingStatsCache.delete('listing-stats')
    invalidateCatalogCompatibilityCacheForDevice(report.deviceId)
    if (report.status === ApprovalStatus.APPROVED) await invalidateListingSeo(report)
  } else {
    listingStatsCache.delete('pc-listing-stats')
    if (report.status === ApprovalStatus.APPROVED) await invalidatePcListingSeo(report)
  }
}

export class ReportAdminEditService {
  constructor(private readonly repository: ReportApprovalRepository) {}

  async updateHandheld(input: z.output<typeof UpdateListingAdminSchema>, actor: ApprovalActor) {
    if (!hasRolePermission(actor.role, Role.MODERATOR))
      return ResourceError.listing.requiresModeratorToUpdate()
    const result = await this.repository.transaction(async (repository, trust) => {
      const previous = await repository.find({ reportId: input.id, reportType: 'handheld' })
      if (!previous) return ResourceError.listing.notFound()
      const updated = await repository.updateHandheld(input, actor.id, previous.status)
      const change = await new ApprovalTrustService(trust).reconcile({
        reportId: input.id,
        reportType: 'handheld',
        authorId: previous.authorId,
        actorId: actor.id,
        previousStatus: previous.status,
        newStatus: updated.status,
        reason: 'Report updated by moderator',
      })
      return { previous, updated, change }
    })
    trackTrustScoreChange(result.change)
    await invalidateEditedReport(result.previous)
    await invalidateEditedReport(result.updated)
    return {
      id: result.updated.id,
      status: result.updated.status,
      processedAt: result.updated.processedAt,
    }
  }

  async updatePc(input: z.output<typeof UpdatePcListingAdminSchema>, actor: ApprovalActor) {
    if (!hasPermission(actor.permissions, PERMISSIONS.APPROVE_LISTINGS))
      return AppError.insufficientPermissions([PERMISSIONS.APPROVE_LISTINGS])
    const result = await this.repository.transaction(async (repository, trust) => {
      const previous = await repository.find({ reportId: input.id, reportType: 'pc' })
      if (!previous) return ResourceError.pcListing.notFound()
      const updated = await repository.updatePc(input, actor.id, previous.status)
      const change = await new ApprovalTrustService(trust).reconcile({
        reportId: input.id,
        reportType: 'pc',
        authorId: previous.authorId,
        actorId: actor.id,
        previousStatus: previous.status,
        newStatus: updated.status,
        reason: 'Report updated by moderator',
      })
      return { previous, updated, change }
    })
    trackTrustScoreChange(result.change)
    await invalidateEditedReport(result.previous)
    await invalidateEditedReport(result.updated)
    return {
      id: result.updated.id,
      status: result.updated.status,
      processedAt: result.updated.processedAt,
    }
  }
}
