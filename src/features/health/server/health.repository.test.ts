import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { HealthRepository } from './health.repository'

const transaction = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
}))

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

describe('HealthRepository', () => {
  beforeEach(() => {
    transaction.$queryRaw.mockReset()
    mockPrisma.$transaction.mockReset()
    mockPrisma.$transaction.mockImplementation(
      (operation: (client: typeof transaction) => Promise<void>) => operation(transaction),
    )
  })

  it('bounds the readiness query with transaction and statement timeouts', async () => {
    transaction.$queryRaw.mockResolvedValue(undefined)
    const repository = new HealthRepository(prisma)

    await expect(repository.checkDatabase()).resolves.toBeUndefined()

    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      maxWait: 5_000,
      timeout: 5_000,
    })
    expect(transaction.$queryRaw).toHaveBeenNthCalledWith(
      1,
      ["SELECT set_config('statement_timeout', ", ', true)'],
      '5000',
    )
    expect(transaction.$queryRaw).toHaveBeenNthCalledWith(2, ['SELECT 1'])
  })

  it('propagates database failures to the readiness handler', async () => {
    const error = new Error('database unavailable')
    transaction.$queryRaw.mockResolvedValueOnce(undefined).mockRejectedValueOnce(error)
    const repository = new HealthRepository(prisma)

    await expect(repository.checkDatabase()).rejects.toBe(error)
  })
})
