import { createClerkClient } from '@clerk/backend'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { AccountDeletionRepository } from './account-deletion.repository'
import { AccountDeletionService } from './account-deletion.service'

const mocks = vi.hoisted(() => ({ deleteUser: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({ users: { deleteUser: mocks.deleteUser } }),
}))
vi.mock('next/cache', () => ({ revalidateTag: mocks.revalidateTag }))
vi.mock('@/server/db', () => ({ prisma: {} }))

describe('account deletion identity lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetAllMocks()
  })

  function setup() {
    const repository = new AccountDeletionRepository(prisma)
    const identity = vi
      .spyOn(repository, 'findClerkIdentity')
      .mockResolvedValue({ clerkId: 'user_removed' })
    const deletion = vi
      .spyOn(repository, 'deleteAccount')
      .mockResolvedValue({ id: 'former-author' })
    return { identity, deletion, service: new AccountDeletionService(repository) }
  }

  it('removes the sign-in identity before removing database data', async () => {
    const { deletion, service } = setup()
    mocks.deleteUser.mockImplementation(async () => {
      expect(deletion).not.toHaveBeenCalled()
    })

    await service.deleteAccount('former-author')

    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith('user_removed')
    expect(deletion).toHaveBeenCalledExactlyOnceWith({ id: 'former-author' })
    expect(mocks.revalidateTag).toHaveBeenCalledWith('users', { expire: 0 })
  })

  it('keeps database data when the identity provider cannot delete the account', async () => {
    const { deletion, service } = setup()
    mocks.deleteUser.mockRejectedValue(
      Object.assign(new Error('Clerk unavailable'), { status: 503 }),
    )

    await expect(service.deleteAccount('former-author')).rejects.toThrow('Clerk unavailable')

    expect(deletion).not.toHaveBeenCalled()
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })

  it('finishes data removal on retry after Clerk succeeded but the database failed', async () => {
    const { deletion, service } = setup()
    deletion.mockRejectedValueOnce(new Error('Database unavailable'))
    const clerk = createClerkClient({ secretKey: 'sk_test_deletion_fixture' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ errors: [{ code: 'resource_not_found', message: 'User not found' }] }),
        { status: 404 },
      ),
    )
    mocks.deleteUser
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce((id: string) => clerk.users.deleteUser(id))

    await expect(service.deleteAccount('former-author')).rejects.toThrow('Database unavailable')
    expect(mocks.revalidateTag).not.toHaveBeenCalled()

    await service.deleteAccount('former-author')

    expect(deletion).toHaveBeenCalledTimes(2)
    expect(mocks.revalidateTag).toHaveBeenCalledWith('users', { expire: 0 })
  })

  it('does not treat an unrecognized 404 as proof that the identity was deleted', async () => {
    const { deletion, service } = setup()
    mocks.deleteUser.mockRejectedValue(
      Object.assign(new Error('Proxy route not found'), { status: 404 }),
    )

    await expect(service.deleteAccount('former-author')).rejects.toThrow('Proxy route not found')

    expect(deletion).not.toHaveBeenCalled()
  })

  it('expires caches when a concurrent deletion already removed the database account', async () => {
    const { identity, deletion, service } = setup()
    identity.mockResolvedValue(null)
    deletion.mockResolvedValue(null)

    await service.deleteAccount('former-author')

    expect(mocks.deleteUser).not.toHaveBeenCalled()
    expect(deletion).toHaveBeenCalledExactlyOnceWith({ id: 'former-author' })
    expect(mocks.revalidateTag).toHaveBeenCalledWith('users', { expire: 0 })
  })

  it('does not call Clerk when handling a verified deletion webhook', async () => {
    const { identity, deletion, service } = setup()

    await service.deleteAccountData({ clerkId: 'user_removed' })

    expect(identity).not.toHaveBeenCalled()
    expect(mocks.deleteUser).not.toHaveBeenCalled()
    expect(deletion).toHaveBeenCalledExactlyOnceWith({ clerkId: 'user_removed' })
  })
})
