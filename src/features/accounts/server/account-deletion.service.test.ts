import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { AccountDeletionRepository } from './account-deletion.repository'
import { AccountDeletionService } from './account-deletion.service'

const cache = vi.hoisted(() => ({ revalidateTag: vi.fn() }))
vi.mock('next/cache', () => ({ revalidateTag: cache.revalidateTag }))
vi.mock('@/server/db', () => ({ prisma: {} }))

describe('account deletion cache expiry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('expires author metadata immediately instead of serving the previous identity', async () => {
    const repository = new AccountDeletionRepository(prisma)
    vi.spyOn(repository, 'deleteAccount').mockResolvedValue({
      id: 'former-author',
    })
    await new AccountDeletionService(repository).deleteAccountData({ clerkId: 'user_removed' })
    expect(cache.revalidateTag.mock.calls).toEqual([
      ['users', { expire: 0 }],
      ['listings', { expire: 0 }],
      ['pc-listings', { expire: 0 }],
    ])
  })

  it('retries all identity cache expiry after the first attempt committed but failed to invalidate', async () => {
    const repository = new AccountDeletionRepository(prisma)
    const deletion = vi
      .spyOn(repository, 'deleteAccount')
      .mockResolvedValueOnce({ id: 'former-author' })
      .mockResolvedValueOnce(null)
    cache.revalidateTag.mockImplementationOnce(() => {
      throw new Error('Cache invalidation failed')
    })
    const service = new AccountDeletionService(repository)

    await expect(service.deleteAccountData({ clerkId: 'user_removed' })).rejects.toThrow(
      'Cache invalidation failed',
    )
    cache.revalidateTag.mockClear()

    await service.deleteAccountData({ clerkId: 'user_removed' })

    expect(deletion).toHaveBeenNthCalledWith(2, { clerkId: 'user_removed' })
    expect(cache.revalidateTag.mock.calls).toEqual([
      ['users', { expire: 0 }],
      ['listings', { expire: 0 }],
      ['pc-listings', { expire: 0 }],
    ])
  })

  it('propagates database failure before invalidating caches', async () => {
    const repository = new AccountDeletionRepository(prisma)
    vi.spyOn(repository, 'deleteAccount').mockRejectedValue(new Error('Transaction failed'))
    await expect(
      new AccountDeletionService(repository).deleteAccountData({ clerkId: 'user_removed' }),
    ).rejects.toThrow('Transaction failed')
    expect(cache.revalidateTag).not.toHaveBeenCalled()
  })
})
