import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameModerationRepository } from '@/features/games/moderation/server/game-moderation.repository'
import { GameModerationService } from '@/features/games/moderation/server/game-moderation.service'
import analytics from '@/lib/analytics'
import { createActorFromSession } from '@/server/auth/actor'
import { prisma } from '@/server/db'
import { gameStatsCache } from '@/server/utils/cache'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, Prisma, Role } from '@orm/client'
import { gamesRouter } from './games'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const root = vi.hoisted(() => ({
  $transaction: vi.fn(),
  game: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  user: { update: vi.fn() },
  trustActionLog: { create: vi.fn() },
}))
const models = vi.hoisted(() => ({
  game: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  user: { update: vi.fn() },
  trustActionLog: { create: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: root }))
vi.mock('@/lib/analytics', () => ({
  default: {
    trust: { trustScoreChanged: vi.fn(), trustLevelChanged: vi.fn() },
    performance: { errorOccurred: vi.fn() },
  },
}))
vi.mock('@/server/utils/cache', () => ({
  gameStatsCache: { delete: vi.fn(), get: vi.fn(), set: vi.fn() },
}))
vi.mock('@/server/cache/invalidation', () => ({
  invalidateGameRelatedContent: vi.fn(),
  invalidateSitemap: vi.fn(),
  revalidateByTag: vi.fn(),
}))
const adminId = '00000000-0000-4000-a000-000000000001'
const firstId = '00000000-0000-4000-a000-000000000010'
const secondId = '00000000-0000-4000-a000-000000000011'
function game(id: string, submittedBy = 'author-1') {
  return { id, title: id, systemId: 'system-1', submittedBy, status: ApprovalStatus.PENDING }
}
const transaction: Prisma.TransactionClient = {
  ...prisma,
  game: { ...prisma.game, ...models.game },
  user: { ...prisma.user, ...models.user },
  trustActionLog: { ...prisma.trustActionLog, ...models.trustActionLog },
}
const caller = gamesRouter.createCaller({
  prisma,
  headers: new Headers(),
  session: {
    user: {
      id: adminId,
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMIN,
      permissions: [PERMISSIONS.APPROVE_GAMES],
      showNsfw: false,
    },
  },
})
beforeEach(() => {
  vi.clearAllMocks()
  root.$transaction
    .mockReset()
    .mockImplementation(async (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
      operation(transaction),
    )
  root.game.findMany.mockImplementation(() => {
    throw new Error('Pending games must be read inside the transaction')
  })
  root.game.findUnique.mockImplementation(() => {
    throw new Error('Pending games must be read inside the transaction')
  })
  models.game.findMany.mockReset().mockResolvedValue([game(secondId)])
  models.game.findUnique.mockReset().mockResolvedValue(game(firstId))
  models.game.updateMany.mockResolvedValue({ count: 1 })
  models.game.update.mockResolvedValue({ ...game(firstId), status: ApprovalStatus.APPROVED })
  models.user.update.mockResolvedValue({ trustScore: 106 })
  models.trustActionLog.create.mockResolvedValue({})
})

describe('game moderation transactions', () => {
  it('enforces the moderation capability when the service is called directly', async () => {
    const service = new GameModerationService(new GameModerationRepository(prisma))
    const actor = createActorFromSession({
      user: { id: adminId, role: Role.ADMIN, permissions: [] },
    })
    await expect(
      service.review(actor, { id: firstId, status: ApprovalStatus.APPROVED }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(service.approveMany(actor, [firstId])).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(service.rejectMany(actor, [firstId])).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(root.$transaction).not.toHaveBeenCalled()
  })

  it('rewards and counts only the games still pending inside the transaction', async () => {
    const result = await caller.bulkApproveGames({ gameIds: [firstId, secondId] })
    expect(result.approvedCount).toBe(1)
    expect(root.game.findMany).not.toHaveBeenCalled()
    expect(models.game.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [secondId] }, status: ApprovalStatus.PENDING },
      }),
    )
    expect(models.trustActionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ metadata: expect.objectContaining({ gameId: secondId }) }),
      }),
    )
    expect(root.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
    )
  })

  it('discards failed-attempt rewards when a concurrent decision forces a retry', async () => {
    models.game.findMany.mockResolvedValue([game(firstId, 'rolled-back-author')])
    root.$transaction.mockImplementationOnce(
      async (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        await operation(transaction)
        models.game.findMany.mockResolvedValue([game(secondId, 'committed-author')])
        throw Object.assign(new Error('Concurrent game decision'), { code: 'P2034' })
      },
    )
    await caller.bulkApproveGames({ gameIds: [firstId, secondId] })
    expect(root.$transaction).toHaveBeenCalledTimes(2)
    expect(analytics.trust.trustScoreChanged).toHaveBeenCalledOnce()
    expect(analytics.trust.trustScoreChanged).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'committed-author' }),
    )
  })

  it('rechecks a single game before deciding and refuses an already processed game', async () => {
    models.game.findUnique.mockResolvedValue({ ...game(firstId), status: ApprovalStatus.REJECTED })
    await expect(
      caller.approveGame({ id: firstId, status: ApprovalStatus.APPROVED }),
    ).rejects.toThrow()
    expect(models.game.findUnique).toHaveBeenCalledWith({
      where: { id: firstId },
      select: { id: true, title: true, systemId: true, status: true, submittedBy: true },
    })
    expect(models.game.update).not.toHaveBeenCalled()
    expect(models.trustActionLog.create).not.toHaveBeenCalled()
    expect(root.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
    )
  })

  it('serializes bulk rejection and returns no internal trust receipts', async () => {
    const result = await caller.bulkRejectGames({ gameIds: [firstId, secondId] })
    expect(result.rejectedCount).toBe(1)
    expect(result).not.toHaveProperty('trustChanges')
    expect(root.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
    )
  })

  it.each([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED])(
    'returns only the consumed status contract for a single %s decision',
    async (status) => {
      models.game.update.mockResolvedValue({
        ...game(firstId),
        status,
        submitter: { email: 'private@example.com' },
      })
      const result = await caller.approveGame({ id: firstId, status })
      expect(result).toEqual({ status })
      expect(models.trustActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              gameId: firstId,
              ...(status === ApprovalStatus.APPROVED
                ? { approvedBy: adminId }
                : { rejectedBy: adminId }),
            }),
          }),
        }),
      )
      expect(root.$transaction).toHaveBeenCalledOnce()
    },
  )

  it('publishes analytics and cache changes only after the owning transaction commits', async () => {
    const commit = Promise.withResolvers<void>()
    root.$transaction.mockImplementationOnce(
      async (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        const result = await operation(transaction)
        await commit.promise
        return result
      },
    )
    const result = caller.approveGame({ id: firstId, status: ApprovalStatus.APPROVED })
    try {
      await vi.waitFor(() => expect(models.trustActionLog.create).toHaveBeenCalledOnce())
      expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
      expect(gameStatsCache.delete).not.toHaveBeenCalled()
      commit.resolve()
      await expect(result).resolves.toEqual({ status: ApprovalStatus.APPROVED })
      expect(analytics.trust.trustScoreChanged).toHaveBeenCalledOnce()
      expect(gameStatsCache.delete).toHaveBeenCalledOnce()
    } finally {
      commit.resolve()
    }
  })

  it.each(['single', 'bulk approve', 'bulk reject'] as const)(
    'discards completion effects when a %s decision fails to commit',
    async (operation) => {
      root.$transaction.mockImplementationOnce(
        async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          await run(transaction)
          throw new Error('Commit failed')
        },
      )
      const decision =
        operation === 'single'
          ? caller.approveGame({ id: firstId, status: ApprovalStatus.APPROVED })
          : operation === 'bulk approve'
            ? caller.bulkApproveGames({ gameIds: [firstId, secondId] })
            : caller.bulkRejectGames({ gameIds: [firstId, secondId] })
      await expect(decision).rejects.toThrow('Commit failed')
      expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
      expect(gameStatsCache.delete).not.toHaveBeenCalled()
    },
  )

  it('retries a conflict thrown by the bound game write without publishing the failed attempt', async () => {
    models.game.update.mockRejectedValueOnce(
      Object.assign(new Error('Write conflict'), { code: 'P2034' }),
    )
    await expect(
      caller.approveGame({ id: firstId, status: ApprovalStatus.APPROVED }),
    ).resolves.toEqual({ status: ApprovalStatus.APPROVED })
    expect(root.$transaction).toHaveBeenCalledTimes(2)
    expect(models.game.findUnique).toHaveBeenCalledTimes(2)
    expect(models.trustActionLog.create).toHaveBeenCalledOnce()
    expect(analytics.trust.trustScoreChanged).toHaveBeenCalledOnce()
  })

  it.each(['approve', 'reject'] as const)(
    'refuses an empty pending set during bulk %s without another trust adjustment',
    async (decision) => {
      models.game.findMany.mockResolvedValue([])
      const result =
        decision === 'approve'
          ? caller.bulkApproveGames({ gameIds: [firstId] })
          : caller.bulkRejectGames({ gameIds: [firstId] })
      await expect(result).rejects.toThrow(`No valid pending games found to ${decision}`)
      expect(models.game.updateMany).not.toHaveBeenCalled()
      expect(models.trustActionLog.create).not.toHaveBeenCalled()
      expect(analytics.trust.trustScoreChanged).not.toHaveBeenCalled()
      expect(gameStatsCache.delete).not.toHaveBeenCalled()
    },
  )
})
