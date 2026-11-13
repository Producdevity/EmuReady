import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { logAudit } from '@/server/services/audit.service'
import { nullifyUserVotes, restoreUserVotes } from '@/server/services/vote-nullification.service'
import { trackTrustScoreChange, type TrustScoreChange } from '@/server/utils/trust-score-analytics'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role, TrustAction } from '@orm'
import { type Prisma } from '@orm/client'
import { userBansRouter } from './userBans'
import { voteInvestigationRouter } from './voteInvestigation'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const root = vi.hoisted(() => ({
  $transaction: vi.fn(),
  user: { findUnique: vi.fn() },
  userBan: { findUnique: vi.fn() },
}))
const models = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  userBan: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: root }))
vi.mock('@/server/services/audit.service', () => ({ logAudit: vi.fn(), buildDiff: vi.fn() }))
vi.mock('@/server/services/vote-nullification.service', () => ({
  nullifyUserVotes: vi.fn(),
  restoreUserVotes: vi.fn(),
}))
vi.mock('@/server/utils/trust-score-analytics', () => ({ trackTrustScoreChange: vi.fn() }))

const actorId = '00000000-0000-4000-a000-000000000001'
const userId = '00000000-0000-4000-a000-000000000002'
const banId = '00000000-0000-4000-a000-000000000003'
const headers = new Headers({ 'x-request-id': 'moderation-test' })
const ban = {
  id: banId,
  userId,
  user: { id: userId },
  reason: 'Spam',
  notes: null,
  expiresAt: null,
  isActive: true,
  votesNullified: true,
}
const lifted = { ...ban, isActive: false }
const transaction: Prisma.TransactionClient = {
  ...prisma,
  user: { ...prisma.user, ...models.user },
  userBan: { ...prisma.userBan, ...models.userBan },
}
const change: TrustScoreChange = {
  userId,
  action: TrustAction.ADMIN_ADJUSTMENT_NEGATIVE,
  oldScore: 10,
  newScore: 5,
  delta: -5,
}
const discardedChange: TrustScoreChange = { ...change, oldScore: 20, newScore: 15 }
const nullification = {
  handheldVotesNullified: 1,
  pcVotesNullified: 2,
  commentVotesNullified: 3,
  pcCommentVotesNullified: 4,
  listingsRecalculated: 5,
  commentsRecalculated: 6,
  trustAdjustments: 7,
} satisfies Awaited<ReturnType<typeof nullifyUserVotes>>
const restoration = {
  handheldVotesRestored: 1,
  pcVotesRestored: 2,
  commentVotesRestored: 3,
  pcCommentVotesRestored: 4,
  listingsRecalculated: 5,
  commentsRecalculated: 6,
  trustAdjustments: 7,
} satisfies Awaited<ReturnType<typeof restoreUserVotes>>

function context(authenticated = true) {
  return {
    prisma,
    headers,
    session: authenticated
      ? {
          user: {
            id: actorId,
            role: Role.ADMIN,
            permissions: [PERMISSIONS.MANAGE_USER_BANS],
            name: null,
            email: null,
            showNsfw: false,
          },
        }
      : null,
  }
}

const operations = [
  {
    name: 'nullify votes',
    run: (authenticated = true) =>
      voteInvestigationRouter
        .createCaller(context(authenticated))
        .nullifyVotes({ userId, reason: 'Moderation', includeCommentVotes: false }),
    service: nullifyUserVotes,
    params: {
      userId,
      adminUserId: actorId,
      reason: 'Moderation',
      includeCommentVotes: false,
      headers,
    },
    result: nullification,
    audited: false,
  },
  {
    name: 'restore votes',
    run: (authenticated = true) =>
      voteInvestigationRouter
        .createCaller(context(authenticated))
        .restoreVotes({ userId, reason: 'Moderation' }),
    service: restoreUserVotes,
    params: { userId, adminUserId: actorId, reason: 'Moderation', headers },
    result: restoration,
    audited: false,
  },
  {
    name: 'ban and nullify',
    run: (authenticated = true) =>
      userBansRouter
        .createCaller(context(authenticated))
        .create({ userId, reason: 'Spam', nullifyVotes: true }),
    service: nullifyUserVotes,
    params: {
      userId,
      adminUserId: actorId,
      reason: 'Ban: Spam',
      includeCommentVotes: true,
      headers,
    },
    result: ban,
    audited: true,
  },
  {
    name: 'lift ban and restore',
    run: (authenticated = true) =>
      userBansRouter.createCaller(context(authenticated)).lift({ id: banId, notes: 'Reviewed' }),
    service: restoreUserVotes,
    params: { userId, adminUserId: actorId, reason: 'Ban lifted: Spam', headers },
    result: lifted,
    audited: true,
  },
]

beforeEach(() => {
  vi.resetAllMocks()
  root.$transaction.mockImplementation(
    async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => run(transaction),
  )
  root.user.findUnique.mockResolvedValue({ role: Role.USER })
  root.userBan.findUnique.mockResolvedValue(ban)
  models.user.findUnique.mockImplementation(async (input: { where: { id: string } }) => ({
    role: input.where.id === actorId ? Role.ADMIN : Role.USER,
  }))
  models.userBan.findUnique.mockResolvedValue(ban)
  models.userBan.findFirst.mockResolvedValue(null)
  models.userBan.create.mockResolvedValue(ban)
  models.userBan.update.mockImplementation(async (input: { data: { isActive?: boolean } }) =>
    input.data.isActive === false ? lifted : ban,
  )
  vi.mocked(nullifyUserVotes).mockImplementation(async (_tx, input) => {
    input.trustChanges.push(change)
    return nullification
  })
  vi.mocked(restoreUserVotes).mockImplementation(async (_tx, input) => {
    input.trustChanges.push(change)
    return restoration
  })
})

describe.each(operations)('$name trust transaction', (operation) => {
  it('keeps the actor, result and completion effects behind the real transaction commit', async () => {
    const completed = Promise.withResolvers<void>()
    const commit = Promise.withResolvers<void>()
    root.$transaction.mockImplementationOnce(
      async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        const result = await run(transaction)
        completed.resolve()
        await commit.promise
        return result
      },
    )
    const request = operation.run()
    try {
      await completed.promise
      expect(trackTrustScoreChange).not.toHaveBeenCalled()
      expect(logAudit).not.toHaveBeenCalled()
      expect(operation.service).toHaveBeenCalledWith(
        transaction,
        expect.objectContaining(operation.params),
      )
      expect(root.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
        maxWait: 120_000,
        timeout: 120_000,
      })
      commit.resolve()
      expect(await request).toEqual(operation.result)
      expect(trackTrustScoreChange).toHaveBeenCalledExactlyOnceWith(change)
      if (operation.audited)
        expect(logAudit).toHaveBeenCalledWith(prisma, expect.objectContaining({ actorId, headers }))
    } finally {
      commit.resolve()
      await request
    }
  })

  it('discards all completion effects when commit fails', async () => {
    root.$transaction.mockImplementationOnce(
      async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        await run(transaction)
        throw new Error('Commit rejected')
      },
    )
    await expect(operation.run()).rejects.toThrow('Commit rejected')
    expect(trackTrustScoreChange).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('discards receipts from a retry and publishes only the committed attempt', async () => {
    root.$transaction.mockImplementationOnce(
      async (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        await run(transaction)
        throw Object.assign(new Error('Write conflict'), { code: 'P2034' })
      },
    )
    vi.mocked(nullifyUserVotes).mockImplementationOnce(async (_tx, input) => {
      input.trustChanges.push(discardedChange)
      return nullification
    })
    vi.mocked(restoreUserVotes).mockImplementationOnce(async (_tx, input) => {
      input.trustChanges.push(discardedChange)
      return restoration
    })
    expect(await operation.run()).toEqual(operation.result)
    expect(root.$transaction).toHaveBeenCalledTimes(2)
    expect(trackTrustScoreChange).toHaveBeenCalledExactlyOnceWith(change)
  })

  it('rejects an unauthenticated actor before any transaction', async () => {
    await expect(operation.run(false)).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(root.$transaction).not.toHaveBeenCalled()
    expect(nullifyUserVotes).not.toHaveBeenCalled()
    expect(restoreUserVotes).not.toHaveBeenCalled()
  })
})
