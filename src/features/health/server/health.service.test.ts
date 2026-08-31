import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { HealthRepository } from './health.repository'
import { HealthService } from './health.service'

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

describe('HealthService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('delegates the database check to the repository', async () => {
    const repository = new HealthRepository(prisma)
    const checkDatabase = vi.spyOn(repository, 'checkDatabase').mockResolvedValueOnce()
    const service = new HealthService(repository)

    await expect(service.checkDatabase()).resolves.toBeUndefined()

    expect(checkDatabase).toHaveBeenCalledOnce()
  })

  it('propagates repository failures', async () => {
    const error = new Error('database unavailable')
    const repository = new HealthRepository(prisma)
    vi.spyOn(repository, 'checkDatabase').mockRejectedValueOnce(error)
    const service = new HealthService(repository)

    await expect(service.checkDatabase()).rejects.toBe(error)
  })
})
