import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { Prisma } from '@orm/client'
import { withRetryTransaction } from './transactions'

const database = vi.hoisted(() => ({ $transaction: vi.fn() }))
vi.mock('@/server/db', () => ({ prisma: database }))

beforeEach(() => vi.resetAllMocks())

describe('transaction retries', () => {
  it('retries Prisma write conflicts even when their message contains no known keyword', async () => {
    const conflict = Object.assign(new Error('Write conflict'), { code: 'P2034' })
    database.$transaction.mockRejectedValueOnce(conflict).mockResolvedValueOnce('committed')
    await expect(
      withRetryTransaction(prisma, async () => 'committed', {
        retryDelay: 0,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
    ).resolves.toBe('committed')
    expect(database.$transaction).toHaveBeenCalledTimes(2)
    expect(database.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 30000,
      timeout: 30000,
    })
  })

  it('does not retry a rejected business decision', async () => {
    database.$transaction.mockRejectedValueOnce(new Error('Report is not pending'))
    await expect(withRetryTransaction(prisma, async () => null, { retryDelay: 0 })).rejects.toThrow(
      'Report is not pending',
    )
    expect(database.$transaction).toHaveBeenCalledOnce()
  })

  it('retries a write conflict preserved inside repository error causes', async () => {
    const conflict = Object.assign(new Error('Write conflict'), { code: 'P2034' })
    const wrapped = new Error('Database write failed', {
      cause: new Error('Database operation failed', { cause: conflict }),
    })
    database.$transaction.mockRejectedValueOnce(wrapped).mockResolvedValueOnce('committed')
    await expect(
      withRetryTransaction(prisma, async () => 'committed', { retryDelay: 0 }),
    ).resolves.toBe('committed')
    expect(database.$transaction).toHaveBeenCalledTimes(2)
  })

  it('does not retry a different Prisma failure wrapped by a repository', async () => {
    const constraint = Object.assign(new Error('Duplicate entry'), { code: 'P2002' })
    const wrapped = new Error('Database write failed', { cause: constraint })
    database.$transaction.mockRejectedValue(wrapped)
    await expect(withRetryTransaction(prisma, async () => null, { retryDelay: 0 })).rejects.toBe(
      wrapped,
    )
    expect(database.$transaction).toHaveBeenCalledOnce()
  })

  it('stops at the configured retry limit', async () => {
    const conflict = Object.assign(new Error('Write conflict'), { code: 'P2034' })
    database.$transaction.mockRejectedValue(conflict)
    await expect(
      withRetryTransaction(prisma, async () => null, { retryDelay: 0, maxRetries: 2 }),
    ).rejects.toBe(conflict)
    expect(database.$transaction).toHaveBeenCalledTimes(2)
  })
})
