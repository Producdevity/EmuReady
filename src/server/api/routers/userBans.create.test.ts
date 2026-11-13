import { beforeEach, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { logAudit } from '@/server/services/audit.service'
import { nullifyUserVotes } from '@/server/services/vote-nullification.service'
import { Prisma, Role } from '@orm/client'
import { userBansRouter } from './userBans'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
const root = vi.hoisted(() => ({
  $transaction: vi.fn(),
  user: { findUnique: vi.fn() },
  userBan: { findFirst: vi.fn(), create: vi.fn() },
}))
const models = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  userBan: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: root }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/server/services/audit.service', () => ({ logAudit: vi.fn(), buildDiff: vi.fn() }))
vi.mock('@/server/services/vote-nullification.service', () => ({
  nullifyUserVotes: vi.fn(),
  restoreUserVotes: vi.fn(),
}))
const adminId = '00000000-0000-4000-a000-000000000001'
const userId = '00000000-0000-4000-a000-000000000002'
const ban = { id: '00000000-0000-4000-a000-000000000003', userId }
const transaction: Prisma.TransactionClient = {
  ...prisma,
  user: { ...prisma.user, ...models.user },
  userBan: { ...prisma.userBan, ...models.userBan },
}
const caller = userBansRouter.createCaller({
  prisma,
  headers: new Headers(),
  session: {
    user: {
      id: adminId,
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMIN,
      permissions: [],
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
  root.user.findUnique.mockResolvedValue({ role: Role.USER })
  root.userBan.findFirst.mockImplementation(() => {
    throw new Error('Active bans must be checked inside the transaction')
  })
  models.user.findUnique.mockImplementation(async (input: { where: { id: string } }) => ({
    role: input.where.id === adminId ? Role.ADMIN : Role.USER,
  }))
  models.userBan.findFirst.mockReset().mockResolvedValue(null)
  models.userBan.create.mockReset().mockResolvedValue(ban)
  models.userBan.update.mockResolvedValue(ban)
  vi.mocked(nullifyUserVotes).mockResolvedValue({
    handheldVotesNullified: 0,
    pcVotesNullified: 0,
    commentVotesNullified: 0,
    pcCommentVotesNullified: 0,
    listingsRecalculated: 0,
    commentsRecalculated: 0,
    trustAdjustments: 0,
  })
})

it('checks for an active ban inside the Serializable creation transaction', async () => {
  await expect(caller.create({ userId, reason: 'Spam' })).resolves.toEqual(ban)
  expect(root.userBan.findFirst).not.toHaveBeenCalled()
  expect(root.userBan.create).not.toHaveBeenCalled()
  expect(models.userBan.findFirst).toHaveBeenCalledWith({
    where: {
      userId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
    },
  })
  expect(root.$transaction).toHaveBeenCalledWith(
    expect.any(Function),
    expect.objectContaining({ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
  )
})

it('refuses an existing active ban without creating or nullifying votes', async () => {
  models.userBan.findFirst.mockResolvedValue(ban)
  await expect(caller.create({ userId, reason: 'Spam', nullifyVotes: true })).rejects.toThrow(
    'User already has an active ban',
  )
  expect(models.userBan.create).not.toHaveBeenCalled()
  expect(nullifyUserVotes).not.toHaveBeenCalled()
  expect(logAudit).not.toHaveBeenCalled()
})

it('rechecks the winning ban after a concurrent insert aborts the transaction', async () => {
  root.$transaction.mockImplementationOnce(
    async (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
      await operation(transaction)
      models.userBan.findFirst.mockResolvedValue(ban)
      throw Object.assign(new Error('Concurrent ban insertion'), { code: 'P2034' })
    },
  )
  await expect(caller.create({ userId, reason: 'Spam', nullifyVotes: true })).rejects.toThrow(
    'User already has an active ban',
  )
  expect(root.$transaction).toHaveBeenCalledTimes(2)
  expect(models.userBan.findFirst).toHaveBeenCalledTimes(2)
  expect(models.userBan.create).toHaveBeenCalledOnce()
  expect(nullifyUserVotes).toHaveBeenCalledOnce()
  expect(logAudit).not.toHaveBeenCalled()
})

it('retries an insert conflict wrapped by repository error handling', async () => {
  models.userBan.create.mockImplementationOnce(async () => {
    models.userBan.findFirst.mockResolvedValue(ban)
    throw Object.assign(new Error('Concurrent ban insertion'), { code: 'P2034' })
  })
  await expect(caller.create({ userId, reason: 'Spam', nullifyVotes: true })).rejects.toThrow(
    'User already has an active ban',
  )
  expect(root.$transaction).toHaveBeenCalledTimes(2)
  expect(models.userBan.create).toHaveBeenCalledOnce()
  expect(nullifyUserVotes).not.toHaveBeenCalled()
  expect(logAudit).not.toHaveBeenCalled()
})
