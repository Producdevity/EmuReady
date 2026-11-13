import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, Role, type TrustAction, type UserBan } from '@orm'
import { ApprovalTrustRepository } from './approval-trust.repository'
import { completeReportApproval } from './report-approval.effects'
import { ReportApprovalRepository } from './report-approval.repository'
import { ReportApprovalService } from './report-approval.service'

vi.mock('@/server/db', () => ({ prisma: {} }))
vi.mock('./report-approval.effects', () => ({ completeReportApproval: vi.fn() }))

function setup(reportType: 'handheld' | 'pc', initialStatus: ApprovalStatus) {
  const userBans: Pick<UserBan, 'reason' | 'expiresAt'>[] = []
  const common = {
    id: 'report-1',
    status: initialStatus,
    authorId: 'author-1',
    gameId: 'game-1',
    emulatorId: 'emulator-1',
    processedAt: new Date('2026-01-01'),
    processedNotes: 'Old notes',
    author: { userBans },
  }
  const record =
    reportType === 'handheld'
      ? { ...common, reportType, deviceId: 'device-1' }
      : { ...common, reportType, cpuId: 'cpu-1', gpuId: null }
  const repository = new ReportApprovalRepository(prisma)
  const trust = new ApprovalTrustRepository(prisma)
  const transaction = vi
    .spyOn(repository, 'transaction')
    .mockImplementation((operation) => operation(repository, trust))
  const find = vi.spyOn(repository, 'find').mockImplementation(async () => ({ ...record }))
  vi.spyOn(repository, 'pending').mockImplementation(async () => {
    if (record.status !== ApprovalStatus.PENDING) return []
    if (record.reportType === 'handheld') return [{ ...record }]
    return [{ ...record }]
  })
  const verified = vi.spyOn(repository, 'isVerifiedDeveloper').mockResolvedValue(true)
  const update = vi.spyOn(repository, 'setStatus').mockImplementation(async (input) => {
    record.status = input.status
    return {
      id: record.id,
      status: input.status,
      processedAt: input.status === ApprovalStatus.PENDING ? null : input.processedAt,
    }
  })
  let contribution =
    initialStatus === ApprovalStatus.APPROVED
      ? 6
      : initialStatus === ApprovalStatus.REJECTED
        ? -8
        : 0
  const history: { action: TrustAction; weight: number }[] = []
  vi.spyOn(trust, 'statusContribution').mockImplementation(async () => contribution)
  const append = vi
    .spyOn(trust, 'appendReconciliation')
    .mockImplementation(async (_author, entries) => {
      const delta = entries.reduce((sum, entry) => sum + entry.weight, 0)
      history.push(...entries.map((entry) => ({ action: entry.action, weight: entry.weight })))
      contribution += delta
      return 100 + contribution
    })
  return {
    service: new ReportApprovalService(repository),
    repository,
    trust,
    transaction,
    record,
    find,
    verified,
    update,
    append,
    history,
    contribution: () => contribution,
    input: {
      reportId: record.id,
      reportType,
      actor: { id: 'reviewer-1', role: Role.SUPER_ADMIN },
      intent: 'override' as const,
    },
  }
}

beforeEach(() => vi.clearAllMocks())

for (const reportType of ['handheld', 'pc'] as const) {
  describe(`${reportType} decision workflow`, () => {
    for (const from of Object.values(ApprovalStatus)) {
      for (const to of Object.values(ApprovalStatus)) {
        it(`commits ${from} → ${to} with its trust contribution`, async () => {
          const run = setup(reportType, from)
          await run.service.changeStatus({ ...run.input, newStatus: to })
          expect(run.record.status).toBe(to)
          expect(run.contribution()).toBe(
            to === ApprovalStatus.APPROVED ? 6 : to === ApprovalStatus.REJECTED ? -8 : 0,
          )
          expect(run.transaction).toHaveBeenCalledOnce()
          expect(completeReportApproval).toHaveBeenCalledTimes(from === to ? 0 : 1)
          if (from === to) expect(run.append).not.toHaveBeenCalled()
        })
      }
    }

    it('does not repeat a correction on a retried request', async () => {
      const run = setup(reportType, ApprovalStatus.REJECTED)
      await run.service.changeStatus({ ...run.input, newStatus: ApprovalStatus.APPROVED })
      await run.service.changeStatus({ ...run.input, newStatus: ApprovalStatus.APPROVED })
      expect(run.contribution()).toBe(6)
      expect(run.history.map((entry) => entry.weight)).toEqual([8, 6])
      expect(run.append).toHaveBeenCalledOnce()
      expect(completeReportApproval).toHaveBeenCalledOnce()
    })

    it('does not emit effects when trust persistence fails', async () => {
      const run = setup(reportType, ApprovalStatus.REJECTED)
      run.append.mockRejectedValueOnce(new Error('database unavailable'))
      await expect(
        run.service.changeStatus({ ...run.input, newStatus: ApprovalStatus.APPROVED }),
      ).rejects.toThrow('database unavailable')
      expect(completeReportApproval).not.toHaveBeenCalled()
    })

    it('requires verified emulator ownership for developer decisions', async () => {
      const run = setup(reportType, ApprovalStatus.PENDING)
      run.verified.mockResolvedValue(false)
      await expect(
        run.service.changeStatus({
          ...run.input,
          intent: 'review',
          newStatus: ApprovalStatus.APPROVED,
          actor: { id: 'developer-1', role: Role.DEVELOPER },
        }),
      ).rejects.toThrow(/verified/)
      expect(run.update).not.toHaveBeenCalled()
      expect(run.append).not.toHaveBeenCalled()
    })

    it('rejects a banned author atomically before reporting why approval failed', async () => {
      const run = setup(reportType, ApprovalStatus.PENDING)
      run.record.author.userBans.push({ reason: 'Spam', expiresAt: null })
      await expect(
        run.service.changeStatus({
          ...run.input,
          intent: 'review',
          newStatus: ApprovalStatus.APPROVED,
        }),
      ).rejects.toThrow(/banned/)
      expect(run.record.status).toBe(ApprovalStatus.REJECTED)
      expect(run.contribution()).toBe(-8)
      expect(completeReportApproval).toHaveBeenCalledOnce()
    })

    it('ignores expired bans', async () => {
      const run = setup(reportType, ApprovalStatus.PENDING)
      run.record.author.userBans.push({ reason: 'Expired', expiresAt: new Date('2020-01-01') })
      await run.service.changeStatus({
        ...run.input,
        intent: 'review',
        newStatus: ApprovalStatus.APPROVED,
      })
      expect(run.record.status).toBe(ApprovalStatus.APPROVED)
    })

    it('rejects reset attempts below Moderator before opening a transaction', async () => {
      const run = setup(reportType, ApprovalStatus.REJECTED)
      await expect(
        run.service.changeStatus({
          ...run.input,
          intent: 'reset',
          newStatus: ApprovalStatus.PENDING,
          actor: { id: 'developer-1', role: Role.DEVELOPER },
        }),
      ).rejects.toThrow()
      expect(run.transaction).not.toHaveBeenCalled()
    })

    it('restricts status overrides to Super Admins', async () => {
      const run = setup(reportType, ApprovalStatus.REJECTED)
      await expect(
        run.service.changeStatus({
          ...run.input,
          newStatus: ApprovalStatus.APPROVED,
          actor: { id: 'moderator-1', role: Role.MODERATOR },
        }),
      ).rejects.toThrow()
      expect(run.transaction).not.toHaveBeenCalled()
    })

    it('requires the explicit permission for mobile review', async () => {
      const run = setup(reportType, ApprovalStatus.PENDING)
      await expect(
        run.service.changeStatus({
          ...run.input,
          intent: 'permission-review',
          newStatus: ApprovalStatus.APPROVED,
          actor: { id: 'user-1', role: Role.USER, permissions: [] },
        }),
      ).rejects.toThrow()
      expect(run.transaction).not.toHaveBeenCalled()
    })

    it('preserves explicitly granted mobile moderation access', async () => {
      const run = setup(reportType, ApprovalStatus.PENDING)
      await run.service.changeStatus({
        ...run.input,
        intent: 'permission-review',
        newStatus: ApprovalStatus.APPROVED,
        actor: { id: 'user-1', role: Role.USER, permissions: [PERMISSIONS.APPROVE_LISTINGS] },
      })
      expect(run.verified).not.toHaveBeenCalled()
      expect(run.contribution()).toBe(6)
    })

    it('de-duplicates bulk IDs and skips reports already processed', async () => {
      const run = setup(reportType, ApprovalStatus.PENDING)
      const result = await run.service.reviewPending({
        reportIds: ['report-1', 'report-1'],
        reportType,
        newStatus: ApprovalStatus.APPROVED,
        actor: run.input.actor,
      })
      expect(result).toEqual({ approvedCount: 1, rejectedCount: 0, skippedCount: 0 })
      expect(run.append).toHaveBeenCalledOnce()
      const retry = await run.service.reviewPending({
        reportIds: ['report-1'],
        reportType,
        newStatus: ApprovalStatus.APPROVED,
        actor: run.input.actor,
      })
      expect(retry).toEqual({ approvedCount: 0, rejectedCount: 0, skippedCount: 1 })
      expect(run.append).toHaveBeenCalledOnce()
    })

    it('preserves individual rejection notes in automated bulk decisions', async () => {
      const run = setup(reportType, ApprovalStatus.PENDING)
      await run.service.reviewPending({
        reportIds: ['report-1'],
        reportType,
        newStatus: ApprovalStatus.REJECTED,
        actor: run.input.actor,
        notesById: new Map([['report-1', 'Verified risk signals']]),
      })
      expect(run.update).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Verified risk signals' }),
      )
      expect(completeReportApproval).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Verified risk signals' }),
      )
    })
  })
}
