import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { AccountDeletionRepository } from './account-deletion.repository'
import { AccountDeletionService } from './account-deletion.service'

const cache = vi.hoisted(() => ({ revalidateTag: vi.fn(), invalidate: vi.fn() }))
vi.mock('next/cache', () => ({ revalidateTag: cache.revalidateTag }))
vi.mock('@/server/db', () => ({ prisma: {} }))
vi.mock('@/server/cache/invalidation', () => ({
  invalidateListingsSeo: cache.invalidate,
  invalidatePcListingsSeo: cache.invalidate,
  invalidateUser: cache.invalidate,
}))

describe('account deletion cache expiry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('expires author metadata immediately instead of serving the previous identity', async () => {
    const repository = new AccountDeletionRepository(prisma)
    vi.spyOn(repository, 'deleteAccount').mockResolvedValue({
      id: 'former-author',
      listings: [],
      pcListings: [],
    })
    await new AccountDeletionService(repository).deleteAccount({ clerkId: 'user_removed' })
    expect(cache.revalidateTag.mock.calls).toEqual([
      ['user-former-author', { expire: 0 }],
      ['listings', { expire: 0 }],
      ['pc-listings', { expire: 0 }],
    ])
  })

  it('retries report cache expiry after an already-completed database deletion', async () => {
    const repository = new AccountDeletionRepository(prisma)
    vi.spyOn(repository, 'deleteAccount').mockResolvedValue(null)
    await new AccountDeletionService(repository).deleteAccount({ clerkId: 'user_removed' })
    expect(cache.revalidateTag).toHaveBeenCalledWith('listings', { expire: 0 })
    expect(cache.revalidateTag).toHaveBeenCalledWith('pc-listings', { expire: 0 })
  })

  it('propagates database failure before invalidating caches', async () => {
    const repository = new AccountDeletionRepository(prisma)
    vi.spyOn(repository, 'deleteAccount').mockRejectedValue(new Error('Transaction failed'))
    await expect(
      new AccountDeletionService(repository).deleteAccount({ clerkId: 'user_removed' }),
    ).rejects.toThrow('Transaction failed')
    expect(cache.revalidateTag).not.toHaveBeenCalled()
  })
})
