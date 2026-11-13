import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invalidateListingsSeo, invalidatePcListingsSeo } from '@/server/cache/invalidation'
import { prisma } from '@/server/db'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { trackTrustScoreChange } from '@/server/utils/trust-score-analytics'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, PcOs, Role, type UserBan } from '@orm'
import { ApprovalTrustRepository } from './approval-trust.repository'
import { ReportAdminEditService } from './report-admin-edit.service'
import { ReportApprovalRepository } from './report-approval.repository'
import type * as NotificationEvents from '@/server/notifications/eventEmitter'

vi.mock('@/server/db', () => ({ prisma: {} }))
vi.mock('@/server/utils/trust-score-analytics', () => ({ trackTrustScoreChange: vi.fn() }))
vi.mock('@/server/cache/invalidation', () => ({
  invalidateListingSeo: vi.fn(),
  invalidatePcListingSeo: vi.fn(),
  invalidateListingsSeo: vi.fn(),
  invalidatePcListingsSeo: vi.fn(),
}))
vi.mock('@/server/notifications/eventEmitter', async (importOriginal) => ({
  ...(await importOriginal<typeof NotificationEvents>()),
  notificationEventEmitter: { emitNotificationEvent: vi.fn() },
}))
vi.mock('@/server/utils/cache/instances', () => ({
  listingStatsCache: { delete: vi.fn() },
  invalidateCatalogCompatibilityCacheForDevice: vi.fn(),
}))

function setup(status: ApprovalStatus = ApprovalStatus.REJECTED) {
  const userBans: Pick<UserBan, 'reason' | 'expiresAt'>[] = []
  const common = {
    id: 'report-1',
    status,
    authorId: 'author-1',
    gameId: 'old-game',
    emulatorId: 'emulator-1',
    author: { userBans },
    processedAt: null,
    processedNotes: null,
  }
  const handheld = { ...common, reportType: 'handheld' as const, deviceId: 'old-device' }
  const pc = { ...common, reportType: 'pc' as const, cpuId: 'old-cpu', gpuId: null }
  const repository = new ReportApprovalRepository(prisma)
  const bound = new ReportApprovalRepository(prisma, prisma)
  const trust = new ApprovalTrustRepository(prisma)
  const transaction = vi
    .spyOn(repository, 'transaction')
    .mockImplementation((operation) => operation(bound, trust))
  vi.spyOn(bound, 'find').mockImplementation(async (input) =>
    input.reportType === 'handheld' ? handheld : pc,
  )
  const updateHandheld = vi.spyOn(bound, 'updateHandheld').mockImplementation(async (input) => ({
    ...handheld,
    ...input,
    author: handheld.author,
    authorId: handheld.authorId,
    reportType: 'handheld',
    processedAt: new Date(),
    processedNotes: null,
  }))
  const updatePc = vi.spyOn(bound, 'updatePc').mockImplementation(async (input) => ({
    ...pc,
    ...input,
    gpuId: input.gpuId ?? null,
    author: pc.author,
    authorId: pc.authorId,
    reportType: 'pc',
    processedAt: new Date(),
    processedNotes: null,
  }))
  vi.spyOn(trust, 'statusContribution').mockResolvedValue(-8)
  const append = vi.spyOn(trust, 'appendReconciliation').mockResolvedValue(106)
  const actor = {
    id: 'reviewer-1',
    role: Role.MODERATOR,
    permissions: [PERMISSIONS.APPROVE_LISTINGS],
  }
  const input = {
    id: 'report-1',
    gameId: 'new-game',
    emulatorId: 'emulator-1',
    performanceId: 1,
    status: ApprovalStatus.APPROVED,
  }
  return {
    service: new ReportAdminEditService(repository),
    repository,
    bound,
    trust,
    transaction,
    userBans,
    updateHandheld,
    updatePc,
    append,
    actor,
    input,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('admin report edits', () => {
  it.each(['handheld', 'pc'] as const)(
    'blocks approval of a banned author through the %s editor',
    async (reportType) => {
      const run = setup()
      run.userBans.push({ reason: 'Spam', expiresAt: null })
      const edit =
        reportType === 'handheld'
          ? run.service.updateHandheld({ ...run.input, deviceId: 'new-device' }, run.actor)
          : run.service.updatePc(
              { ...run.input, cpuId: 'new-cpu', os: PcOs.WINDOWS, osVersion: '11', memorySize: 16 },
              run.actor,
            )
      await expect(edit).rejects.toThrow(/banned/)
      expect(run.updateHandheld).not.toHaveBeenCalled()
      expect(run.updatePc).not.toHaveBeenCalled()
      expect(run.append).not.toHaveBeenCalled()
    },
  )

  it.each(['handheld', 'pc'] as const)(
    'keeps %s trust and edits inside the transaction and effects after commit',
    async (reportType) => {
      const run = setup()
      const commit = Promise.withResolvers<void>()
      run.transaction.mockImplementation(async (operation) => {
        const result = await operation(run.bound, run.trust)
        await commit.promise
        return result
      })
      const edit =
        reportType === 'handheld'
          ? run.service.updateHandheld({ ...run.input, deviceId: 'new-device' }, run.actor)
          : run.service.updatePc(
              { ...run.input, cpuId: 'new-cpu', os: PcOs.WINDOWS, osVersion: '11', memorySize: 16 },
              run.actor,
            )
      try {
        await vi.waitFor(() => expect(run.append).toHaveBeenCalledOnce())
        expect(trackTrustScoreChange).not.toHaveBeenCalled()
        expect(invalidateListingsSeo).not.toHaveBeenCalled()
        expect(invalidatePcListingsSeo).not.toHaveBeenCalled()
        expect(notificationEventEmitter.emitNotificationEvent).not.toHaveBeenCalled()
      } finally {
        commit.resolve()
      }
      await edit
      expect(run.transaction).toHaveBeenCalledOnce()
      expect(trackTrustScoreChange).toHaveBeenCalledOnce()
      expect(notificationEventEmitter.emitNotificationEvent).toHaveBeenCalledOnce()
      expect(reportType === 'handheld' ? run.updateHandheld : run.updatePc).toHaveBeenCalledOnce()
    },
  )

  it('reconciles handheld status and invalidates its new public hardware targets', async () => {
    const run = setup()
    await run.service.updateHandheld({ ...run.input, deviceId: 'new-device' }, run.actor)
    expect(run.append).toHaveBeenCalledWith(
      'author-1',
      expect.arrayContaining([
        expect.objectContaining({ weight: 8 }),
        expect.objectContaining({ weight: 6 }),
      ]),
    )
    expect(invalidateListingsSeo).toHaveBeenCalledWith([
      expect.objectContaining({ gameId: 'new-game', deviceId: 'new-device' }),
    ])
    expect(trackTrustScoreChange).toHaveBeenCalledWith(
      expect.objectContaining({ delta: 14, oldScore: 92, newScore: 106 }),
    )
  })

  it('reconciles PC status within the edit transaction', async () => {
    const run = setup()
    await run.service.updatePc(
      { ...run.input, cpuId: 'new-cpu', os: PcOs.WINDOWS, osVersion: '11', memorySize: 16 },
      run.actor,
    )
    expect(run.append).toHaveBeenCalledWith(
      'author-1',
      expect.arrayContaining([
        expect.objectContaining({ weight: 8 }),
        expect.objectContaining({ weight: 6 }),
      ]),
    )
    expect(invalidatePcListingsSeo).toHaveBeenCalledWith([
      expect.objectContaining({ gameId: 'new-game', cpuId: 'new-cpu' }),
    ])
  })

  it('does not change trust when the report status is unchanged', async () => {
    const run = setup()
    await run.service.updateHandheld(
      { ...run.input, status: ApprovalStatus.REJECTED, deviceId: 'new-device' },
      run.actor,
    )
    expect(run.append).not.toHaveBeenCalled()
  })

  it('does not record trust or emit committed effects when editing fails', async () => {
    const run = setup()
    run.updateHandheld.mockRejectedValueOnce(new Error('Invalid custom field'))
    await expect(
      run.service.updateHandheld({ ...run.input, deviceId: 'new-device' }, run.actor),
    ).rejects.toThrow('Invalid custom field')
    expect(run.append).not.toHaveBeenCalled()
    expect(trackTrustScoreChange).not.toHaveBeenCalled()
    expect(invalidateListingsSeo).not.toHaveBeenCalled()
    expect(notificationEventEmitter.emitNotificationEvent).not.toHaveBeenCalled()
  })

  it.each(['handheld', 'pc'] as const)(
    'deduplicates public %s revalidation while retaining old and new targets',
    async (reportType) => {
      const run = setup(ApprovalStatus.APPROVED)
      if (reportType === 'handheld') {
        await run.service.updateHandheld({ ...run.input, deviceId: 'new-device' }, run.actor)
        expect(invalidateListingsSeo).toHaveBeenCalledExactlyOnceWith([
          expect.objectContaining({ gameId: 'old-game', deviceId: 'old-device' }),
          expect.objectContaining({ gameId: 'new-game', deviceId: 'new-device' }),
        ])
      } else {
        await run.service.updatePc(
          { ...run.input, cpuId: 'new-cpu', os: PcOs.WINDOWS, osVersion: '11', memorySize: 16 },
          run.actor,
        )
        expect(invalidatePcListingsSeo).toHaveBeenCalledExactlyOnceWith([
          expect.objectContaining({ gameId: 'old-game', cpuId: 'old-cpu' }),
          expect.objectContaining({ gameId: 'new-game', cpuId: 'new-cpu' }),
        ])
      }
      expect(notificationEventEmitter.emitNotificationEvent).not.toHaveBeenCalled()
    },
  )

  it.each(['handheld', 'pc'] as const)(
    'notifies a committed %s rejection but does not notify a reset to Pending',
    async (reportType) => {
      const run = setup(ApprovalStatus.APPROVED)
      const statuses = [ApprovalStatus.REJECTED, ApprovalStatus.PENDING]
      for (const status of statuses) {
        if (reportType === 'handheld') {
          await run.service.updateHandheld(
            { ...run.input, status, deviceId: 'new-device' },
            run.actor,
          )
        } else {
          await run.service.updatePc(
            {
              ...run.input,
              status,
              cpuId: 'new-cpu',
              os: PcOs.WINDOWS,
              osVersion: '11',
              memorySize: 16,
            },
            run.actor,
          )
        }
      }
      expect(notificationEventEmitter.emitNotificationEvent).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          eventType:
            reportType === 'handheld'
              ? NOTIFICATION_EVENTS.LISTING_REJECTED
              : NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
          entityId: 'report-1',
          triggeredBy: run.actor.id,
        }),
      )
    },
  )

  it('rejects unauthorized handheld edits before writing', async () => {
    const run = setup()
    await expect(
      run.service.updateHandheld(
        { ...run.input, deviceId: 'device-1' },
        { id: 'user-1', role: Role.USER },
      ),
    ).rejects.toThrow(/Moderator/)
    expect(run.updateHandheld).not.toHaveBeenCalled()
  })

  it('requires the existing explicit permission for PC edits', async () => {
    const run = setup()
    await expect(
      run.service.updatePc(
        { ...run.input, cpuId: 'cpu-1', os: PcOs.WINDOWS, osVersion: '11', memorySize: 16 },
        { id: 'user-1', role: Role.USER },
      ),
    ).rejects.toThrow(/permission/i)
    expect(run.updatePc).not.toHaveBeenCalled()
  })
})
