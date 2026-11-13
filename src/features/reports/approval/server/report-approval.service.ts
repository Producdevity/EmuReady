import { ResourceError } from '@/lib/errors'
import { type ListingType } from '@/schemas/common'
import { ApprovalStatus } from '@orm'
import { type ApprovalTrustRepository } from './approval-trust.repository'
import { ApprovalTrustService } from './approval-trust.service'
import { completeReportApproval } from './report-approval.effects'
import {
  assertCanChangeReportStatus,
  requiresEmulatorVerification,
  type ApprovalActor,
} from './report-approval.policy'
import { type ReportApprovalRepository } from './report-approval.repository'

type ChangeStatusInput = {
  reportId: string
  reportType: ListingType
  actor: ApprovalActor
  notes?: string | null
} & (
  | { intent: 'override'; newStatus: ApprovalStatus }
  | { intent: 'reset'; newStatus: typeof ApprovalStatus.PENDING }
  | {
      intent: 'review' | 'permission-review'
      newStatus: typeof ApprovalStatus.APPROVED | typeof ApprovalStatus.REJECTED
    }
)

export class ReportApprovalService {
  constructor(private readonly repository: ReportApprovalRepository) {}

  async changeStatus(input: ChangeStatusInput) {
    assertCanChangeReportStatus(input.actor, input.intent, input.reportType, input.newStatus)
    const result = await this.repository.transaction(async (repository, trustRepository) => {
      const report = await repository.find(input)
      const errors =
        input.reportType === 'handheld' ? ResourceError.listing : ResourceError.pcListing
      if (!report) return errors.notFound()
      return this.persistDecision(input, report, repository, trustRepository)
    })
    if (result.changed) {
      await completeReportApproval({
        ...result,
        actorId: input.actor.id,
        notes: result.notes,
      })
    }
    if (result.banReason !== null) {
      const errors =
        input.reportType === 'handheld' ? ResourceError.listing : ResourceError.pcListing
      return errors.cannotApproveBannedUser(result.banReason)
    }
    return {
      id: result.updated.id,
      status: result.updated.status,
      processedAt: result.updated.processedAt,
    }
  }

  async reviewPending(
    input: Omit<ChangeStatusInput, 'reportId' | 'intent' | 'newStatus'> & {
      reportIds: string[]
      newStatus: typeof ApprovalStatus.APPROVED | typeof ApprovalStatus.REJECTED
      notesById?: ReadonlyMap<string, string>
    },
  ) {
    assertCanChangeReportStatus(input.actor, 'review', input.reportType, input.newStatus)
    const reportIds = [...new Set(input.reportIds)].sort()
    const changes = await this.repository.transaction(async (repository, trustRepository) => {
      const decisions = []
      const reports = await repository.pending(reportIds, input.reportType)
      for (const report of reports) {
        const reportId = report.id
        decisions.push(
          await this.persistDecision(
            {
              ...input,
              reportId,
              intent: 'review',
              notes: input.notesById?.get(reportId) ?? input.notes,
            },
            report,
            repository,
            trustRepository,
          ),
        )
      }
      return decisions
    })
    for (const change of changes) {
      await completeReportApproval({
        ...change,
        actorId: input.actor.id,
        notes: change.notes,
      })
    }
    return {
      approvedCount: changes.filter((change) => change.updated.status === ApprovalStatus.APPROVED)
        .length,
      rejectedCount: changes.filter((change) => change.updated.status === ApprovalStatus.REJECTED)
        .length,
      skippedCount: reportIds.length - changes.length,
    }
  }

  private async persistDecision(
    input: ChangeStatusInput,
    report: NonNullable<Awaited<ReturnType<ReportApprovalRepository['find']>>>,
    repository: ReportApprovalRepository,
    trustRepository: ApprovalTrustRepository,
  ) {
    const errors = input.reportType === 'handheld' ? ResourceError.listing : ResourceError.pcListing
    const reviewing = input.intent === 'review' || input.intent === 'permission-review'
    if (reviewing && report.status !== ApprovalStatus.PENDING) return errors.notPending()
    if (input.intent === 'reset' && report.status === ApprovalStatus.PENDING)
      return errors.alreadyPending()
    if (requiresEmulatorVerification(input.actor, input.intent)) {
      const verified = await repository.isVerifiedDeveloper(input.actor.id, report.emulatorId)
      if (!verified) {
        return input.newStatus === ApprovalStatus.APPROVED
          ? errors.mustBeVerifiedToApprove()
          : errors.mustBeVerifiedToReject()
      }
    }
    const now = new Date()
    const ban =
      reviewing && input.newStatus === ApprovalStatus.APPROVED
        ? report.author?.userBans.find((entry) => !entry.expiresAt || entry.expiresAt > now)
        : undefined
    const newStatus = ban ? ApprovalStatus.REJECTED : input.newStatus
    const notes = ban
      ? `Automatically rejected: User is currently banned (${ban.reason})`
      : (input.notes ?? (input.intent === 'override' ? report.processedNotes : null))
    if (report.status === newStatus) {
      const updated =
        input.intent === 'override' &&
        input.notes !== undefined &&
        input.notes !== report.processedNotes
          ? await repository.updateNotes(
              { reportId: input.reportId, reportType: input.reportType },
              input.notes,
              input.actor.id,
              now,
            )
          : report
      return { report, updated, changed: false, trustChange: null, banReason: null, notes }
    }
    const updated = await repository.setStatus({
      ...input,
      status: newStatus,
      actorId: input.actor.id,
      processedAt: now,
      notes,
    })
    const trustChange = await new ApprovalTrustService(trustRepository).reconcile({
      reportId: input.reportId,
      reportType: input.reportType,
      authorId: report.authorId,
      actorId: input.actor.id,
      previousStatus: report.status,
      newStatus,
      reason: notes ?? 'Report status changed',
    })
    return { report, updated, changed: true, trustChange, banReason: ban?.reason ?? null, notes }
  }
}
